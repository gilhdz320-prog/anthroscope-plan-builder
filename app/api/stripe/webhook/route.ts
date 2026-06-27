import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAccessCode } from "@/lib/access-codes";
import { buildAccessCodeEmail } from "@/lib/emails/access-code";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const resendKey = process.env.RESEND_API_KEY;
const fromEmail =
  process.env.RESEND_FROM_EMAIL ?? "Anthroscope <no-reply@anthroscope.pro>";
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  "https://planbuilder.anthroscope.pro";

const stripe = stripeKey ? new Stripe(stripeKey) : null;
const resend = resendKey ? new Resend(resendKey) : null;

export async function POST(req: NextRequest) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe not configured (missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET)" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 });
  }

  // Only act on successful payments
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Guard: must be paid
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true, skipped: "not_paid" });
  }

  const customerEmail =
    session.customer_details?.email ??
    session.customer_email ??
    null;

  if (!customerEmail) {
    return NextResponse.json(
      { error: "No customer email on session" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Idempotency: if we already created a code for this session, just re-send it.
  const { data: existing } = await admin
    .from("access_codes")
    .select("code, customer_email")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  let code = existing?.code;

  if (!code) {
    // Generate a unique code (retry on rare collision)
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateAccessCode();
      const { error } = await admin.from("access_codes").insert({
        code: candidate,
        stripe_session_id: session.id,
        customer_email: customerEmail,
        amount_paid_cents: session.amount_total ?? null,
        currency: session.currency ?? "usd",
      });
      if (!error) {
        code = candidate;
        break;
      }
      // If unique violation on stripe_session_id, another concurrent webhook won.
      if (error.code === "23505" && error.message.includes("stripe_session_id")) {
        const { data: race } = await admin
          .from("access_codes")
          .select("code")
          .eq("stripe_session_id", session.id)
          .maybeSingle();
        if (race?.code) {
          code = race.code;
          break;
        }
      }
      // Otherwise keep trying (code collision)
    }
  }

  if (!code) {
    return NextResponse.json(
      { error: "Could not generate access code" },
      { status: 500 },
    );
  }

  // Send email
  if (resend) {
    const { subject, html, text } = buildAccessCodeEmail({
      code,
      customerEmail,
      signupUrl: `${appUrl}/signup?code=${encodeURIComponent(code)}`,
    });

    try {
      await resend.emails.send({
        from: fromEmail,
        to: customerEmail,
        subject,
        html,
        text,
      });
    } catch (err) {
      // Log but don't fail the webhook — code is still saved and retrievable
      console.error("[stripe-webhook] resend send failed", err);
    }
  } else {
    console.warn("[stripe-webhook] RESEND_API_KEY missing — skipping email");
  }

  return NextResponse.json({ received: true, code_issued: true });
}
