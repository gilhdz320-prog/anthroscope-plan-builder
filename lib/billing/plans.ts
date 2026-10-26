import type { PlanInterval } from "./config";

/** Estados que Stripe puede enviar, mapeados a lo que guardamos en la BD. */
export type DbSubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused";

const STATUS_MAP: Record<string, DbSubscriptionStatus> = {
  trialing: "trialing",
  active: "active",
  past_due: "past_due",
  canceled: "canceled",
  unpaid: "unpaid",
  incomplete: "incomplete",
  incomplete_expired: "incomplete_expired",
  paused: "paused",
};

export function mapStatus(stripeStatus: string): DbSubscriptionStatus {
  return STATUS_MAP[stripeStatus] ?? "incomplete";
}

export function isAccessGranting(status: string): boolean {
  return status === "trialing" || status === "active";
}

/** Deduce el plan a partir del price ID configurado o del intervalo de Stripe. */
export function inferPlan(
  priceId: string | null | undefined,
  interval: string | null | undefined,
): PlanInterval {
  if (priceId && priceId === process.env.STRIPE_PRICE_ANNUAL) return "annual";
  if (priceId && priceId === process.env.STRIPE_PRICE_MONTHLY) return "monthly";
  return interval === "year" ? "annual" : "monthly";
}

/** Unix seconds (Stripe) → Date ISO, con null seguro. */
export function fromUnix(value: number | null | undefined): string | null {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : null;
}
