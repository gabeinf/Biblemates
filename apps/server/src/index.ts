/**
 * Biblemates API (runs on your laptop for now; hosted before TestFlight).
 *
 *   GET  /health   liveness + which translation is searched
 *   POST /search   Scripture search by free text and/or mood (auth required)
 *   POST /ask      Scripture chat, whole answer at once (fallback for the socket)
 *
 * Socket.IO on the same port streams chat answers:
 *   client → "ask" AskRequest
 *   server → "ask:start" → "ask:chunk"* → "ask:done" AskResponse | "ask:error"
 */
import { networkInterfaces } from "node:os";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";
import { ASK_EVENTS, AskRequest, SearchRequest, type AskError } from "@biblemates/shared";
import { bearer, userIdFromToken } from "./auth";
import { ask, AskInputError } from "./chat";
import { env } from "./env";
import { searchScripture, warmUp } from "./scripture";

const app = Fastify({ logger: { level: "info" } });
await app.register(cors, { origin: true });

app.get("/health", async () => ({ ok: true, translation: env.SCRIPTURE_TRANSLATION }));

app.post("/search", async (req, reply) => {
  const userId = await userIdFromToken(bearer(req.headers.authorization));
  if (!userId) return reply.code(401).send({ error: "Sign in to search Scripture." });

  const parsed = SearchRequest.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "Invalid request", issues: parsed.error.issues });
  }

  try {
    return await searchScripture(parsed.data);
  } catch (err) {
    req.log.error(err, "search failed");
    return reply.code(503).send({ error: "Scripture search is unavailable right now. Please try again." });
  }
});

app.post("/ask", async (req, reply) => {
  const userId = await userIdFromToken(bearer(req.headers.authorization));
  if (!userId) return reply.code(401).send({ error: "Please sign in again." });

  const parsed = AskRequest.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: "Invalid request", issues: parsed.error.issues });

  try {
    return await ask(userId, parsed.data, { start: () => {}, delta: () => {} });
  } catch (err) {
    if (err instanceof AskInputError) return reply.code(400).send({ error: err.message });
    req.log.error(err, "ask failed");
    return reply.code(503).send({ error: "Something went wrong. Please try again." });
  }
});

// ---------------------------------------------------------------- sockets

const io = new Server(app.server, { cors: { origin: "*" } });

io.use(async (socket, next) => {
  const userId = await userIdFromToken(socket.handshake.auth?.token);
  if (!userId) return next(new Error("unauthorized"));
  socket.data.userId = userId;
  next();
});

io.on("connection", (socket) => {
  const userId: string = socket.data.userId;
  let busy = false;

  socket.on(ASK_EVENTS.ask, async (payload: unknown) => {
    const fail = (e: AskError) => socket.emit(ASK_EVENTS.error, e);
    const parsed = AskRequest.safeParse(payload);
    if (!parsed.success) return fail({ code: "invalid", message: "Invalid message." });
    const { requestId } = parsed.data;
    if (busy) return fail({ requestId, code: "busy", message: "Still answering your last message." });

    busy = true;
    try {
      const res = await ask(userId, parsed.data, {
        start: (s) => socket.emit(ASK_EVENTS.start, s),
        delta: (delta) => socket.emit(ASK_EVENTS.chunk, { requestId, delta }),
      });
      socket.emit(ASK_EVENTS.done, res);
    } catch (err) {
      if (err instanceof AskInputError) return fail({ requestId, code: "invalid", message: err.message });
      app.log.error(err, "ask failed");
      fail({ requestId, code: "failed", message: "Something went wrong. Please try again." });
    } finally {
      busy = false;
    }
  });
});

// ---------------------------------------------------------------- start

await app.listen({ port: env.PORT, host: env.HOST });
void warmUp();

const lan = Object.values(networkInterfaces())
  .flat()
  .find((i) => i && i.family === "IPv4" && !i.internal)?.address;
if (lan) console.log(`\nPhone on the same Wi-Fi: EXPO_PUBLIC_SERVER_URL=http://${lan}:${env.PORT}\n`);
