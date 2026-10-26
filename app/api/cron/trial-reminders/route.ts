import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildTrialEndingEmail } from "@/lib/emails/lifecycle";
import { sendEmail } from "@/lib/emails/send";
import { getAppUrl } from "@/lib/billing/stripe";
import { trackEvent } from "@/lib/analytics/track";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron diario: avisa a quien está a 3 días (o menos) de terminar el trial.
 *
 * Invocar con:  GET /api/cron/trial-reminders?secret=CRON_SECRET
 * (o Authorization: Bearer CRON_SECRET). Idempotente vía
 * subscriptions.trial_reminder_sent_at.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided =
    req.nextUrl.searchParams.get("secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET no configurado" },
      { status: 500 },
    );
  }
  if (provided !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const appUrl = getAppUrl();

  // Trials que terminan en los próximos 3 días y aún no recibieron aviso.
  const inThreeDays = new Date(Date.now() + 3 * 86_400_000).toISOString();

  const { data: rows, error } = await admin
    .from("subscriptions")
    .select("user_id, trial_end")
    .eq("status", "trialing")
    .eq("provider", "app")
    .is("trial_reminder_sent_at", null)
    .lte("trial_end", inThreeDays)
    .gt("trial_end", new Date().toISOString());

  if (error) {
    console.error("[cron/trial-reminders] query", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const row of (rows ?? []) as Array<{ user_id: string; trial_end: string }>) {
    const daysLeft = Math.max(
      1,
      Math.ceil((new Date(row.trial_end).getTime() - Date.now()) / 86_400_000),
    );

    const { data: userData } = await admin.auth.admin.getUserById(row.user_id);
    const email = userData.user?.email;
    if (!email) continue;

    const { subject, html, text } = buildTrialEndingEmail({ appUrl, daysLeft });
    const result = await sendEmail({ to: email, subject, html, text });

    // Marca el aviso solo si salió; si no, se reintenta mañana.
    if (result.ok) {
      await admin
        .from("subscriptions")
        .update({ trial_reminder_sent_at: new Date().toISOString() })
        .eq("user_id", row.user_id);
      await trackEvent({
        name: "trial_reminder_sent",
        userId: row.user_id,
        props: { days_left: daysLeft },
      });
      sent += 1;
    }
  }

  return NextResponse.json({ ok: true, candidates: rows?.length ?? 0, sent });
}
