/**
 * Configuración de precios y plan.
 *
 * Los precios viven en código (no en el dashboard de Stripe) para que el
 * checkout funcione sin crear productos a mano. Si existen STRIPE_PRICE_MONTHLY
 * / STRIPE_PRICE_ANNUAL, se usan esos price IDs (recomendado en producción,
 * para poder cambiar precio sin deploy).
 */

export type PlanInterval = "monthly" | "annual";

export const BILLING = {
  currency: "mxn",
  productName: "Anthroscope Plan Builder",
  productDescription:
    "Planes de alimentación con SMAE, equivalentes, PDF con tu marca y portal del paciente.",
  trialDays: 14,
  /** Días de gracia tras un pago fallido antes de cortar el acceso. */
  graceDays: 5,
  plans: {
    monthly: {
      interval: "month" as const,
      amount: 19900, // $199.00 MXN
      label: "Mensual",
      priceEnv: "STRIPE_PRICE_MONTHLY",
    },
    annual: {
      interval: "year" as const,
      amount: 199000, // $1,990.00 MXN (2 meses gratis)
      label: "Anual",
      priceEnv: "STRIPE_PRICE_ANNUAL",
    },
  } satisfies Record<
    PlanInterval,
    { interval: "month" | "year"; amount: number; label: string; priceEnv: string }
  >,
} as const;

export function formatPrice(amountCents: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

/** Precio mensual equivalente de cada plan (para comparar en la UI). */
export function monthlyEquivalent(interval: PlanInterval): number {
  return interval === "annual"
    ? Math.round(BILLING.plans.annual.amount / 12)
    : BILLING.plans.monthly.amount;
}
