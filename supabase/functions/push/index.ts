// Triggered by a Database Webhook on INSERT into public.activity.
// Turns circle activity into push notifications, respecting each member's prefs
// and quiet hours.
import { adminClient, inQuietHours, isAuthorized, localNow, type PushMessage, sendExpoPush } from "../_shared/push.ts";

type Activity = {
  id: string;
  circle_id: string;
  actor_id: string;
  target_user_id: string | null;
  kind: "joined" | "completed_reading" | "shared_reflection" | "prayer_request" | "encouraged" | "milestone";
  subject_id: string | null;
  meta: Record<string, unknown>;
};

function compose(a: Activity, actor: string): { title?: string; body: string } | null {
  switch (a.kind) {
    case "completed_reading":
      return { body: `${actor} finished today's reading. You're up next!` };
    case "shared_reflection":
      return a.meta?.verse
        ? { body: `${actor} shared a reflection on a verse you can read today.` }
        : { body: `${actor} shared something meaningful about today's reading.` };
    case "prayer_request":
      return { body: `${actor} shared a prayer request with your circle.` };
    case "encouraged":
      return a.meta?.kind === "praying"
        ? { body: `${actor} is praying for you today.` }
        : { body: `${actor} was encouraged by your reflection ❤️` };
    case "joined":
      return { body: `${actor} joined your circle. Say hello!` };
    case "milestone":
      return { title: "Milestone 🎉", body: `Your circle completed ${a.meta?.study_title ?? "a study"} together!` };
    default:
      return null;
  }
}

Deno.serve(async (req) => {
  if (!isAuthorized(req)) return new Response("unauthorized", { status: 401 });

  const payload = await req.json();
  const a = payload.record as Activity;
  if (!a) return new Response("no record", { status: 400 });

  const admin = adminClient();

  const { data: actorProfile } = await admin.from("profiles").select("display_name").eq("id", a.actor_id).single();
  const message = compose(a, actorProfile?.display_name ?? "Someone in your circle");
  if (!message) return new Response("ignored");

  let recipients: string[];
  if (a.target_user_id) {
    recipients = [a.target_user_id];
  } else {
    const { data: members } = await admin.from("circle_members").select("user_id").eq("circle_id", a.circle_id);
    recipients = (members ?? []).map((m) => m.user_id).filter((id) => a.kind === "milestone" || id !== a.actor_id);
  }
  if (!recipients.length) return new Response("no recipients");

  const prefKey = a.kind === "encouraged" ? "encouragements" : "circle_activity";
  const { data: prefs } = await admin
    .from("notification_prefs")
    .select("user_id, circle_activity, encouragements, quiet_start, quiet_end, timezone")
    .in("user_id", recipients);

  const allowed = new Set(
    recipients.filter((id) => {
      const p = prefs?.find((x) => x.user_id === id);
      if (!p) return true; // default on
      if (!p[prefKey]) return false;
      return !inQuietHours(localNow(p.timezone).hour, p.quiet_start, p.quiet_end);
    }),
  );
  if (!allowed.size) return new Response("all muted");

  const { data: tokens } = await admin.from("push_tokens").select("token, user_id").in("user_id", [...allowed]);
  const messages: PushMessage[] = (tokens ?? []).map((t) => ({
    to: t.token,
    sound: "default",
    title: message.title,
    body: message.body,
    data: { kind: a.kind, subjectId: a.subject_id, url: a.kind === "prayer_request" || a.kind === "encouraged" ? "/home" : "/study" },
  }));

  await sendExpoPush(admin, messages);
  return Response.json({ sent: messages.length });
});
