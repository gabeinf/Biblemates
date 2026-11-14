// Invoked hourly by pg_cron. Sends at most one reminder per user per local day,
// at their chosen hour, and only if they haven't already done today's reading.
import { adminClient, isAuthorized, localNow, type PushMessage, sendExpoPush } from "../_shared/push.ts";

function daysBetween(fromIso: string, toIso: string) {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000);
}

Deno.serve(async (req) => {
  if (!isAuthorized(req)) return new Response("unauthorized", { status: 401 });
  const admin = adminClient();

  const { data: prefs, error } = await admin
    .from("notification_prefs")
    .select("user_id, reminder_hour, timezone, last_reminder_on")
    .eq("daily_reminder", true);
  if (error) return new Response(error.message, { status: 500 });

  const due = (prefs ?? [])
    .map((p) => ({ ...p, local: localNow(p.timezone) }))
    .filter((p) => p.local.hour === p.reminder_hour && p.last_reminder_on !== p.local.date);
  if (!due.length) return Response.json({ sent: 0 });

  const userIds = due.map((p) => p.user_id);
  const { data: memberships } = await admin.from("circle_members").select("user_id, circle_id").in("user_id", userIds);
  const circleIds = [...new Set((memberships ?? []).map((m) => m.circle_id))];

  const { data: activeStudies } = await admin
    .from("circle_studies")
    .select("id, circle_id, started_on, study_id, studies(total_days, study_days(day_number, title))")
    .in("circle_id", circleIds.length ? circleIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("status", "active");

  const { data: tokens } = await admin.from("push_tokens").select("token, user_id").in("user_id", userIds);

  const messages: PushMessage[] = [];
  const reminded: { user_id: string; date: string }[] = [];

  for (const p of due) {
    const circleId = memberships?.find((m) => m.user_id === p.user_id)?.circle_id;
    const cs = activeStudies?.find((s) => s.circle_id === circleId);
    // deno-lint-ignore no-explicit-any
    const study = cs?.studies as any;

    let body = "Your circle's reading is ready. Take 5 minutes in the Word.";
    let title: string | undefined;
    if (cs && study) {
      const day = Math.min(Math.max(daysBetween(cs.started_on, p.local.date) + 1, 1), study.total_days);
      const { count } = await admin
        .from("day_completions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", p.user_id)
        .eq("circle_study_id", cs.id)
        .eq("day_number", day);
      if (count) {
        reminded.push({ user_id: p.user_id, date: p.local.date });
        continue; // already read today
      }
      const dayTitle = study.study_days?.find((d: { day_number: number }) => d.day_number === day)?.title;
      if (dayTitle) title = `Day ${day} is here: ${dayTitle}`;
    }

    for (const t of tokens?.filter((t) => t.user_id === p.user_id) ?? []) {
      messages.push({ to: t.token, title, body, sound: "default", data: { url: "/study" } });
    }
    reminded.push({ user_id: p.user_id, date: p.local.date });
  }

  await sendExpoPush(admin, messages);
  for (const r of reminded) {
    await admin.from("notification_prefs").update({ last_reminder_on: r.date }).eq("user_id", r.user_id);
  }
  return Response.json({ sent: messages.length });
});
