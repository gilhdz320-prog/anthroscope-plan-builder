import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BILLING, type PlanInterval } from "@/lib/billing/config";
import { getAppUrl, requireStripe } from "@/lib/billing/stripe";
import { getSubscriptionRow } from "@/lib/billing/sync";
import { trackEvent } from "@/lib/analytics/track";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPlanInterval(value: unknown): value is PlanInterval {
  return value === "monthly" || value === "annual";
}

/**
 * Crea una sesión de Stripe Checkout en modo suscripción.
 *
 * Reglas:
 * - Requiere sesión iniciada (la suscripción se ata a un user_id).
 * - Si la usuaria nunca ha tenido suscripción, aplica 14 días de trial en Stripe.
 *   Si ya tuvo trial local (fila creada al registrarse), cobra desde hoy.
 * - Precio: $199 MXN/mes o $1,990 MXN/año (o price IDs si están configurados).
 */
export async function POST(req: NextRequest) {
  let stripe: Stripe;
  try {
    stripe = requireStripe();
  } catch {
    return NextResponse.json(
      { error: "Stripe no está configurado en el servidor." },
      { status: 500 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "Necesitas iniciar sesión.",
        loginUrl: "/login?redirect=/suscripcion",
      },
      { status: 401 },
    );
  }

  let body: { interval?: unknown } = {};
  try {
    body = (await req.json()) as { interval?: unknown };
  } catch {
    // Sin body → plan mensual por defecto
  }
  const interval: PlanInterval = isPlanInterval(body.interval)
    ? body.interval
    : "monthly";
  const plan = BILLING.plans[interval];

  await trackEvent({
    name: "checkout_started",
    userId: user.id,
    props: { interval },
  });

  try {
    const admin = createAdminClient();
    const existing = await getSubscriptionRow(admin, user.id);

    // Cliente de Stripe: reutiliza el existente o crea uno nuevo.
    let customerId = existing?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      // Sin fila previa (p. ej. cuenta anterior al trial automático): se crea en
      // 'incomplete' para NO conceder acceso hasta que el webhook confirme el pago.
      await admin.from("subscriptions").upsert(
        {
          user_id: user.id,
          stripe_customer_id: customerId,
          status: "incomplete",
          provider: "stripe",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    }

    // Trial de 14 días solo si nunca ha tenido suscripción.
    const trialPeriodDays = existing ? undefined : BILLING.trialDays;

    const priceId = process.env[plan.priceEnv];
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = priceId
      ? { price: priceId, quantity: 1 }
      : {
          quantity: 1,
          price_data: {
            currency: BILLING.currency,
            unit_amount: plan.amount,
            recurring: { interval: plan.interval },
            product_data: {
              name: `${BILLING.productName} · ${plan.label}`,
              description: BILLING.productDescription,
            },
          },
        };

    const appUrl = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [lineItem],
      subscription_data: {
        metadata: { user_id: user.id, plan: interval },
        ...(trialPeriodDays ? { trial_period_days: trialPeriodDays } : {}),
      },
      metadata: { user_id: user.id, plan: interval },
      locale: "es",
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      payment_method_collection: "always",
      success_url: `${appUrl}/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/suscripcion?canceled=1`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe no devolvió una URL de pago." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[checkout] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  // El checkout necesita saber el plan y la usuaria: siempre vía /suscripcion.
  return NextResponse.redirect(`${getAppUrl()}/suscripcion`, 303);
}
