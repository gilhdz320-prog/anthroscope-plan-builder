import type { SupabaseClient } from "@supabase/supabase-js";
import { BILLING } from "./config";

export type AccessKind =
  | "legacy" // compró el pago único antiguo: acceso de por vida
  | "trial" // prueba local de 14 días
  | "active" // suscripción pagada
  | "past_due" // impago, dentro del periodo de gracia
  | "expired" // sin acceso
  | "none";

export type Access = {
  hasAccess: boolean;
  kind: AccessKind;
  status: string | null;
  plan: string | null;
  /** Días de prueba restantes (solo kind="trial"). */
  trialDaysLeft: number | null;
  /** Días de gracia restantes (solo kind="past_due"). */
  graceDaysLeft: number | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

type SubscriptionRow = {
  status: string | null;
  plan: string | null;
  trial_end: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
};

const DAY_MS = 86_400_000;

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / DAY_MS));
}

/**
 * Resuelve el acceso de una usuaria combinando el código legacy y la
 * suscripción. Se llama en el layout del dashboard (una vez por request).
 */
export async function getAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<Access> {
  const empty: Access = {
    hasAccess: false,
    kind: "none",
    status: null,
    plan: null,
    trialDaysLeft: null,
    graceDaysLeft: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };

  const [legacyResult, subResult] = await Promise.all([
    supabase.rpc("user_has_paid_access", { p_user_id: userId }),
    supabase
      .from("subscriptions")
      .select(
        "status, plan, trial_end, current_period_end, cancel_at_period_end",
      )
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const isLegacy = legacyResult.data === true;
  const sub = (subResult.data ?? null) as SubscriptionRow | null;

  if (sub) {
    const status = sub.status ?? "incomplete";
    const base = {
      ...empty,
      status,
      plan: sub.plan,
      currentPeriodEnd: sub.current_period_end,
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    };

    if (status === "trialing") {
      const trialDaysLeft = daysUntil(sub.trial_end);
      // trial_end null = trial abierto (no debería pasar, pero no bloqueamos)
      const hasAccess = trialDaysLeft === null || trialDaysLeft > 0;
      return {
        ...base,
        hasAccess,
        kind: hasAccess ? "trial" : "expired",
        trialDaysLeft,
      };
    }

    if (status === "active") {
      return { ...base, hasAccess: true, kind: "active" };
    }

    if (status === "past_due") {
      const graceEnd =
        (sub.current_period_end ? new Date(sub.current_period_end).getTime() : Date.now()) +
        BILLING.graceDays * DAY_MS;
      const graceDaysLeft = Math.max(
        0,
        Math.ceil((graceEnd - Date.now()) / DAY_MS),
      );
      const hasAccess = graceEnd > Date.now();
      return {
        ...base,
        hasAccess,
        kind: hasAccess ? "past_due" : "expired",
        graceDaysLeft,
      };
    }

    // canceled / unpaid / incomplete_expired / paused → sin acceso
    return { ...base, hasAccess: false, kind: "expired" };
  }

  // Sin fila de suscripción pero con código legacy → acceso de por vida
  if (isLegacy) {
    return { ...empty, hasAccess: true, kind: "legacy" };
  }

  return empty;
}
