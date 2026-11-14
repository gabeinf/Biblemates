// Shared helpers for Biblemates edge functions (Deno).
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

export type PushMessage = {
  to: string;
  title?: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default";
};

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

/** Functions are deployed with --no-verify-jwt; callers must send x-function-secret. */
export function isAuthorized(req: Request): boolean {
  const expected = Deno.env.get("FUNCTION_SECRET");
  return !!expected && req.headers.get("x-function-secret") === expected;
}

/** Hour (0-23) and ISO date (YYYY-MM-DD) for `now` in the given IANA timezone. */
export function localNow(timeZone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { hour: Number(get("hour")), date: `${get("year")}-${get("month")}-${get("day")}` };
}

export function inQuietHours(hour: number, start: number | null, end: number | null): boolean {
  if (start == null || end == null || start === end) return false;
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

/** Sends via the Expo push service and prunes tokens that are no longer registered. */
export async function sendExpoPush(admin: SupabaseClient, messages: PushMessage[]) {
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      console.error("expo push failed", res.status, await res.text());
      continue;
    }
    const { data } = await res.json() as {
      data: { status: string; details?: { error?: string } }[];
    };
    const dead = data
      .map((ticket, idx) => (ticket.details?.error === "DeviceNotRegistered" ? chunk[idx].to : null))
      .filter((t): t is string => !!t);
    if (dead.length) await admin.from("push_tokens").delete().in("token", dead);
  }
}
