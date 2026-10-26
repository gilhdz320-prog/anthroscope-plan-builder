import { createAdminClient } from "@/lib/supabase/admin";

/** Eventos del embudo. Añadir aquí antes de usarlos (tipado). */
export type AnalyticsEvent =
  | "signup_completed"
  | "trial_started"
  | "login"
  | "dashboard_viewed"
  | "patient_created"
  | "plan_created"
  | "plan_pdf_generated"
  | "plan_link_shared"
  | "export_downloaded"
  | "checkout_started"
  | "subscription_active"
  | "payment_failed"
  | "trial_reminder_sent";

type TrackParams = {
  name: AnalyticsEvent;
  userId?: string | null;
  props?: Record<string, unknown>;
  path?: string;
};

/**
 * Registra un evento del embudo. Fire-and-forget: nunca debe romper el flujo
 * que lo llama (ni un alta, ni un cobro, ni un PDF).
 */
export async function trackEvent({
  name,
  userId = null,
  props = {},
  path,
}: TrackParams): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("analytics_events").insert({
      name,
      user_id: userId,
      props,
      path: path ?? null,
    });
    if (error) {
      console.warn("[analytics] no se pudo registrar", name, error.message);
    }
  } catch (err) {
    console.warn("[analytics] error inesperado", name, err);
  }
}
