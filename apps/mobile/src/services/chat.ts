/**
 * Scripture chat.
 *  - Answers stream over Socket.IO (ask:start → ask:chunk* → ask:done); if the
 *    socket can't connect, the same request goes to POST /ask in one piece.
 *  - History is read straight from Supabase (RLS: users only see their own).
 */
import { ASK_EVENTS, AskResponse, type AskChunk, type AskError, type AskRequest, type AskStart, type Citation } from '@biblemates/shared';
import { socket } from '../lib/socket';
import { postJson } from '../lib/server';
import { supabase } from '../lib/supabase';

const ANSWER_TIMEOUT_MS = 90_000;
const CONNECT_TIMEOUT_MS = 5_000;

export type AskHandlers = { onStart?: (s: AskStart) => void; onDelta: (text: string) => void };

export function sendAsk(req: AskRequest, h: AskHandlers): Promise<AskResponse> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    };

    const onStart = (s: AskStart) => s.requestId === req.requestId && h.onStart?.(s);
    const onChunk = (c: AskChunk) => c.requestId === req.requestId && h.onDelta(c.delta);
    const onDone = (r: unknown) => {
      const parsed = AskResponse.safeParse(r);
      if (!parsed.success || parsed.data.requestId !== req.requestId) return;
      finish(() => resolve(parsed.data));
    };
    const onError = (e: AskError) => {
      if (e.requestId && e.requestId !== req.requestId) return;
      finish(() => reject(new Error(e.message)));
    };
    const onDisconnect = () => finish(() => reject(new Error('Connection lost. Please try again.')));

    const timer = setTimeout(
      () => finish(() => reject(new Error('The answer is taking too long. Please try again.'))),
      ANSWER_TIMEOUT_MS,
    );
    let connectTimer: ReturnType<typeof setTimeout> | undefined;

    function cleanup() {
      clearTimeout(timer);
      clearTimeout(connectTimer);
      socket.off(ASK_EVENTS.start, onStart);
      socket.off(ASK_EVENTS.chunk, onChunk);
      socket.off(ASK_EVENTS.done, onDone);
      socket.off(ASK_EVENTS.error, onError);
      socket.off('disconnect', onDisconnect);
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
    }

    const emit = () => {
      socket.on('disconnect', onDisconnect);
      socket.emit(ASK_EVENTS.ask, req);
    };
    // Socket unavailable: same request over HTTP, whole answer at once.
    const viaHttp = () =>
      finish(() => {
        postJson<unknown>('/ask', req, 60_000)
          .then((r) => resolve(AskResponse.parse(r)))
          .catch(reject);
      });
    function onConnect() {
      clearTimeout(connectTimer);
      socket.off('connect_error', onConnectError);
      emit();
    }
    function onConnectError() {
      viaHttp();
    }

    socket.on(ASK_EVENTS.start, onStart);
    socket.on(ASK_EVENTS.chunk, onChunk);
    socket.on(ASK_EVENTS.done, onDone);
    socket.on(ASK_EVENTS.error, onError);

    if (socket.connected) return emit();
    socket.once('connect', onConnect);
    socket.once('connect_error', onConnectError);
    connectTimer = setTimeout(viaHttp, CONNECT_TIMEOUT_MS);
    socket.connect();
  });
}

// ---------------------------------------------------------------- history

export type ConversationSummary = { id: string; title: string | null; mood: string | null; updated_at: string };

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
  crisis: boolean;
};

export async function listConversations(): Promise<ConversationSummary[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, mood, updated_at')
    .order('updated_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, role, content, citations, crisis')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as ChatMessage[];
}

export async function deleteConversation(conversationId: string) {
  const { error } = await supabase.from('conversations').delete().eq('id', conversationId);
  if (error) throw error;
}
