import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAccessCode } from "@/lib/access-codes";
import { buildAccessCodeEmail } from "@/lib/emails/access-code";
import {
  buildPaymentFailedEmail,
  buildSubscriptionCanceledEmail,
  buildSubscriptionStartedEmail,
} from "@/lib/emails/lifecycle";
import { sendEmail } from "@/lib/emails/send";
import { trackEvent } from "@/lib/analytics/track";
import { BILLING } from "@/lib/billing/config";
import { getAppUrl, getStripe } from "@/lib/billing/stripe";
import { syncStripeSubscription } from "@/lib/billing/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook de Stripe. Dos responsabilidades:
 *
 * 1) Suscripciones (modelo actual): mantener public.subscriptions al día y
 *    mandar los correos de ciclo de vida (alta, impago, cancelación).
 * 2) Pago único legacy ($57 de por vida): emitir código de acceso, como antes.
 *    Se conserva para no romper a quien ya compró con ese modelo.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      {
        error:
          "Stripe no configurado (falta STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET)",
      },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Falta stripe-signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Firma inválida";
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 });
  }

  const admin = createAdminClient();
  const appUrl = getAppUrl();

  /** Email de la usuaria: de auth.users, con fallback al de la sesión. */
  async function emailForUser(
    userId: string,
    fallback?: string | null,
  ): Promise<string | null> {
    try {
      const { data } = await admin.auth.admin.getUserById(userId);
      return data.user?.email ?? fallback ?? null;
    } catch {
      return fallback ?? null;
    }
  }

  /** Pago único legacy: emite y envía código de acceso. */
  async function handleLegacyPurchase(session: Stripe.Checkout.Session) {
    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true, skipped: "not_paid" });
    }

    const customerEmail =
      session.customer_details?.email ?? session.customer_email ?? null;
    if (!customerEmail) {
      return NextResponse.json({ error: "Sin email en la sesión" }, { status: 400 });
    }

    const { data: existing } = await admin
      .from("access_codes")
      .select("code")
      .eq("stripe_session_id", session.id)
      .maybeSingle();

    let code = (existing as { code?: string } | null)?.code ?? null;

    if (!code) {
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
        if (error.code === "23505" && error.message.includes("stripe_session_id")) {
          const { data: race } = await admin
            .from("access_codes")
            .select("code")
            .eq("stripe_session_id", session.id)
            .maybeSingle();
          if ((race as { code?: string } | null)?.code) {
            code = (race as { code: string }).code;
            break;
          }
        }
      }
    }

    if (!code) {
      return NextResponse.json(
        { error: "No se pudo generar el código" },
        { status: 500 },
      );
    }

    const { subject, html, text } = buildAccessCodeEmail({
      code,
      customerEmail,
      signupUrl: `${appUrl}/signup?code=${encodeURIComponent(code)}`,
    });
    await sendEmail({ to: customerEmail, subject, html, text });

    return NextResponse.json({ received: true, code_issued: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "payment") {
          return await handleLegacyPurchase(session);
        }
        if (session.mode !== "subscription") {
          return NextResponse.json({ received: true, ignored: session.mode });
        }

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;
        if (!subscriptionId) {
          return NextResponse.json(
            { error: "Sesión sin suscripción" },
            { status: 400 },
          );
        }

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const { userId } = await syncStripeSubscription(admin, sub);

        if (userId && sub.status === "active") {
          const email = await emailForUser(
            userId,
            session.customer_details?.email,
          );
          if (email) {
            const plan =
              (sub.metadata?.plan as "monthly" | "annual" | undefined) ?? "monthly";
            const { subject, html, text } = buildSubscriptionStartedEmail({
              appUrl,
              plan,
            });
            await sendEmail({ to: email, subject, html, text });
          }
        }

        if (userId && sub.status === "active") {
          await trackEvent({
            name: "subscription_active",
            userId,
            props: { plan: sub.metadata?.plan ?? "monthly" },
          });
        }

        return NextResponse.json({ received: true, subscription: sub.status });
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await syncStripeSubscription(admin, sub);
        return NextResponse.json({ received: true, subscription: sub.status });
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const { userId } = await syncStripeSubscription(admin, sub);

        if (userId) {
          const email = await emailForUser(userId);
          if (email) {
            const { subject, html, text } = buildSubscriptionCanceledEmail({
              appUrl,
            });
            await sendEmail({ to: email, subject, html, text });
          }
        }

        return NextResponse.json({ received: true, canceled: true });
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id ?? null;

        if (!customerId) {
          return NextResponse.json({ received: true, ignored: "no_customer" });
        }

        const { data: row } = await admin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        const userId = (row as { user_id?: string } | null)?.user_id ?? null;

        if (userId) {
          await admin
            .from("subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("user_id", userId);

          const email = await emailForUser(
            userId,
            invoice.customer_email ?? undefined,
          );
          if (email) {
            const { subject, html, text } = buildPaymentFailedEmail({
              appUrl,
              graceDays: BILLING.graceDays,
            });
            await sendEmail({ to: email, subject, html, text });
          }

          await trackEvent({
            name: "payment_failed",
            userId,
            props: { amount_due: invoice.amount_due ?? null },
          });
        }

        return NextResponse.json({ received: true, past_due: true });
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const maybeSubscription = (
          invoice as unknown as { subscription?: string | { id?: string } }
        ).subscription;
        const subscriptionId =
          typeof maybeSubscription === "string"
            ? maybeSubscription
            : maybeSubscription?.id;

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          await syncStripeSubscription(admin, sub);
        }
        return NextResponse.json({ received: true });
      }

      default:
        return NextResponse.json({ received: true, ignored: event.type });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[stripe-webhook]", event.type, message);
    // 500 → Stripe reintenta. Es lo correcto si falló la escritura en BD.
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
