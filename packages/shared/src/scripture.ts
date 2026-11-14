/**
 * Contract between the app and apps/server for Scripture search and the
 * Scripture chat. Both sides validate with these schemas.
 */
import * as z from "zod";

// ---------------------------------------------------------------- moods

export const MOOD_IDS = [
  "anxious",
  "afraid",
  "sad",
  "lonely",
  "overwhelmed",
  "angry",
  "guilty",
  "doubting",
  "hopeful",
  "grateful",
  "joyful",
] as const;
export const MoodId = z.enum(MOOD_IDS);
export type MoodId = z.infer<typeof MoodId>;

export type Mood = {
  id: MoodId;
  label: string;
  /** What a quick-reply chip sends as the user's chat message. */
  message: string;
  /** Natural-language query for semantic search. */
  query: string;
  /** Words as they appear in the ASV, for full-text search and the keyword fallback. */
  keywords: string[];
  /** A short line shown above the passages. It points to Scripture, never replaces it. */
  encouragement: string;
};

export const MOODS: readonly Mood[] = [
  {
    id: "anxious",
    label: "Anxious",
    message: "I'm feeling anxious.",
    query: "anxiety and worry; casting all your cares on God because he cares for you; peace that guards the heart",
    // Not "peace": in the ASV it is mostly greetings and "Is it peace?" narrative.
    keywords: ["anxious", "anxiety", "careth", "troubled"],
    encouragement: "You can bring every worry to God. Here is what His Word says to an anxious heart.",
  },
  {
    id: "afraid",
    label: "Afraid",
    message: "I'm feeling afraid.",
    query: "fear and being afraid; fear not, for I am with thee; God is our refuge and strength",
    keywords: ["fear", "afraid", "refuge", "dismayed", "courage"],
    encouragement: "Fear is real, and so is God's presence with you. Read slowly.",
  },
  {
    id: "sad",
    label: "Sad",
    message: "I'm feeling sad.",
    query: "sorrow and grief; God comforts those who mourn and is near to the brokenhearted",
    keywords: ["sorrow", "weep", "mourn", "comfort", "tears"],
    encouragement: "God is near to the brokenhearted. Let these words sit with you.",
  },
  {
    id: "lonely",
    label: "Lonely",
    message: "I'm feeling lonely.",
    query: "loneliness and feeling alone; God will never leave you nor forsake you; God is with you always",
    keywords: ["alone", "forsake", "desolate", "lonely", "leave"],
    encouragement: "You are not as alone as it feels. Scripture says so again and again.",
  },
  {
    id: "overwhelmed",
    label: "Overwhelmed",
    message: "I'm feeling overwhelmed.",
    query: "overwhelmed, weary and heavy laden; come to me and I will give you rest; strength for the weak",
    // Not "burden": in the ASV it is mostly "the burden of Jehovah" prophecies.
    keywords: ["weary", "laden", "rest", "strength", "faint"],
    encouragement: "You don't have to carry it all today. Rest here for a moment.",
  },
  {
    id: "angry",
    label: "Angry",
    message: "I'm feeling angry.",
    query: "anger and frustration; be slow to anger; do not let the sun go down on your wrath; forgiveness",
    keywords: ["anger", "wrath", "angry", "forgive", "patience"],
    encouragement: "Bring the anger honestly to God. Scripture shows a better way through it.",
  },
  {
    id: "guilty",
    label: "Guilty",
    message: "I'm feeling guilty.",
    query: "guilt and shame over sin; God forgives and cleanses; no condemnation for those in Christ Jesus",
    keywords: ["forgive", "condemnation", "cleanse", "iniquity", "mercy"],
    encouragement: "There is mercy for you. Read what God says about forgiveness.",
  },
  {
    id: "doubting",
    label: "Doubting",
    message: "I'm struggling with doubt.",
    query: "doubt and weak faith; help my unbelief; trusting God's promises when it is hard to believe",
    keywords: ["doubt", "unbelief", "faith", "believe", "trust"],
    encouragement: "Honest questions are welcome. Many in Scripture wrestled too.",
  },
  {
    id: "hopeful",
    label: "Need hope",
    message: "I need some hope.",
    query: "hope for the future; waiting on the Lord; God's promises and plans; hope that does not disappoint",
    keywords: ["hope", "wait", "promise", "renew", "endure"],
    encouragement: "Hope is anchored in who God is. Here is where to find it.",
  },
  {
    id: "grateful",
    label: "Grateful",
    message: "I'm feeling grateful.",
    query: "thankfulness and gratitude; give thanks unto the Lord for he is good; praise",
    keywords: ["thanks", "thanksgiving", "praise", "bless", "good"],
    encouragement: "Gratitude is worship. Here are words to give thanks with.",
  },
  {
    id: "joyful",
    label: "Joyful",
    message: "I'm feeling joyful!",
    query: "joy and gladness; rejoice in the Lord always; the joy of the Lord is your strength",
    keywords: ["joy", "rejoice", "glad", "delight", "sing"],
    encouragement: "Celebrate it! Scripture is full of joy.",
  },
];

export const getMood = (id: MoodId): Mood => MOODS.find((m) => m.id === id)!;

// ---------------------------------------------------------------- passages

const BookId = z.string().regex(/^[1-3A-Z]{3}$/, "USFM book id, e.g. PHP");

export const Passage = z.object({
  id: z.uuid(),
  translation: z.string(),
  bookId: BookId,
  chapter: z.number().int().positive(),
  verseStart: z.number().int().positive(),
  verseEnd: z.number().int().positive(),
  /** Human-readable, e.g. "Philippians 4:5–8". */
  reference: z.string(),
  text: z.string(),
  score: z.number(),
});
export type Passage = z.infer<typeof Passage>;

// ---------------------------------------------------------------- search

export const SearchRequest = z
  .object({
    query: z.string().trim().min(2).max(300).optional(),
    mood: MoodId.optional(),
    limit: z.number().int().min(1).max(20).default(8),
  })
  .refine((r) => r.query || r.mood, { message: "Provide a query or a mood" });
export type SearchRequest = z.input<typeof SearchRequest>;

export const SearchMode = z.enum(["hybrid", "keyword"]);

export const SearchResponse = z.object({
  translation: z.string(),
  /** "keyword" means embeddings were slow or unavailable and full-text search was used. */
  mode: SearchMode,
  passages: z.array(Passage),
});
export type SearchResponse = z.infer<typeof SearchResponse>;

// ---------------------------------------------------------------- ask (chat)

/** A verse range the answer quotes. Every citation is checked against scripture_chunks. */
export const Citation = z.object({
  translation: z.string(),
  bookId: BookId,
  chapter: z.number().int().positive(),
  verseStart: z.number().int().positive(),
  verseEnd: z.number().int().positive(),
  reference: z.string(),
  text: z.string(),
});
export type Citation = z.infer<typeof Citation>;

export const AskRequest = z.object({
  /** Client-chosen id, echoed on every streamed event for this answer. */
  requestId: z.string().min(1).max(64),
  /** Omit to start a new conversation. */
  conversationId: z.uuid().optional(),
  message: z.string().trim().min(1).max(2000),
  mood: MoodId.optional(),
});
export type AskRequest = z.input<typeof AskRequest>;

export const AskResponse = z.object({
  requestId: z.string(),
  conversationId: z.uuid(),
  userMessageId: z.uuid(),
  messageId: z.uuid(),
  /** Final answer. Citation markers look like [[PHP 4:6-7]]; only verified ones remain. */
  text: z.string(),
  citations: z.array(Citation),
  /** True when the crisis-safety rule fired (988 / local emergency help was included). */
  crisis: z.boolean(),
  /** "fallback" = Claude was unavailable, so passages were found by search alone. */
  mode: z.enum(["claude", "fallback"]),
});
export type AskResponse = z.infer<typeof AskResponse>;

/** Socket.IO events for streamed answers. */
export const ASK_EVENTS = {
  ask: "ask",
  start: "ask:start",
  chunk: "ask:chunk",
  done: "ask:done",
  error: "ask:error",
} as const;

export type AskStart = { requestId: string; conversationId: string; userMessageId: string };
export type AskChunk = { requestId: string; delta: string };
export type AskError = { requestId?: string; code: "unauthorized" | "invalid" | "busy" | "failed"; message: string };

// ---------------------------------------------------------------- citation markers

/** Matches [[PHP 4:6]] or [[PHP 4:6-7]] in answer text. */
export const CITATION_MARKER = /\[\[([1-3A-Z]{3}) (\d{1,3}):(\d{1,3})(?:[-–](\d{1,3}))?\]\]/g;

export type TextPart = { type: "text"; text: string } | { type: "cite"; bookId: string; chapter: number; verseStart: number; verseEnd: number; raw: string };

/**
 * Splits answer text into plain text and citation markers. A trailing,
 * unfinished "[[..." (mid-stream) is dropped so it never flashes on screen.
 */
export function splitCitations(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const m of text.matchAll(new RegExp(CITATION_MARKER.source, "g"))) {
    if (m.index > last) parts.push({ type: "text", text: text.slice(last, m.index) });
    const verseStart = Number(m[3]);
    parts.push({
      type: "cite",
      bookId: m[1],
      chapter: Number(m[2]),
      verseStart,
      verseEnd: m[4] ? Number(m[4]) : verseStart,
      raw: m[0],
    });
    last = m.index + m[0].length;
  }
  let tail = text.slice(last);
  const open = tail.lastIndexOf("[[");
  if (open !== -1 && !tail.includes("]]", open)) tail = tail.slice(0, open);
  if (tail) parts.push({ type: "text", text: tail });
  return parts;
}
