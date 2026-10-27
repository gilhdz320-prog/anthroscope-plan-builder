import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { fromUnix, inferPlan, mapStatus } from "./plans";

type SubscriptionItemWithPeriod = {
  current_period_end?: number | null;
  price?: { id?: string | null; recurring?: { interval?: string | null } | null } | null;
};

/**
 * Refleja en la BD el estado de una suscripción de Stripe.
 * Idempotente: se puede llamar varias veces con el mismo evento.
 */
export async function syncStripeSubscription(
  admin: SupabaseClient,
  sub: Stripe.Subscription,
): Promise<{ userId: string | null; status: string }> {
  const item = (sub.items?.data?.[0] ?? null) as SubscriptionItemWithPeriod | null;
  const priceId = item?.price?.id ?? null;
  const interval = item?.price?.recurring?.interval ?? null;

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;

  const metadataUserId =
    (sub.metadata?.user_id as string | undefined) ??
    (typeof sub.customer === "object" &&
    sub.customer &&
    "metadata" in sub.customer
      ? (sub.customer.metadata?.user_id as string | undefined)
      : undefined) ??
    null;

  // Periodo actual: en la API 2025+ vive en el item, no en la suscripción.
  const periodEnd =
    fromUnix(item?.current_period_end) ?? fromUnix(sub.trial_end ?? null);

  // Resolver la usuaria: metadata → fila existente por subscription_id → por customer_id
  let userId = metadataUserId;
  if (!userId) {
    const { data: bySub } = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", sub.id)
      .maybeSingle();
    userId = (bySub as { user_id?: string } | null)?.user_id ?? null;
  }
  if (!userId && customerId) {
    const { data: byCustomer } = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    userId = (byCustomer as { user_id?: string } | null)?.user_id ?? null;
  }

  const status = mapStatus(sub.status);

  if (!userId) {
    console.warn("[billing] suscripción sin usuaria asociada", {
      subscriptionId: sub.id,
      customerId,
    });
    return { userId: null, status };
  }

  await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      plan: inferPlan(priceId, interval),
      status,
      provider: "stripe",
      trial_end: fromUnix(sub.trial_end),
      current_period_end: periodEnd,
      cancel_at_period_end: Boolean(sub.cancel_at_period_end),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return { userId, status };
}

/** Busca la fila local de suscripción de una usuaria. */
export async function getSubscriptionRow(
  admin: SupabaseClient,
  userId: string,
): Promise<{
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string | null;
} | null> {
  const { data } = await admin
    .from("subscriptions")
    .select("stripe_customer_id, stripe_subscription_id, status")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as {
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    status: string | null;
  } | null) ?? null;
}
