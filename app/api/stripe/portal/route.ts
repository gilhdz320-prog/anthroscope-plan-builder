import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl, requireStripe } from "@/lib/billing/stripe";
import { getSubscriptionRow } from "@/lib/billing/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Abre el portal de facturación de Stripe: cambiar tarjeta, ver facturas,
 * cancelar o reactivar la suscripción. Es lo que evita que gestiones eso
 * a mano por email.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Necesitas iniciar sesión.", loginUrl: "/login?redirect=/suscripcion" },
      { status: 401 },
    );
  }

  try {
    const stripe = requireStripe();
    const admin = createAdminClient();
    const row = await getSubscriptionRow(admin, user.id);

    if (!row?.stripe_customer_id) {
      return NextResponse.json(
        {
          error:
            "Todavía no tienes una suscripción. Suscríbete primero para gestionarla.",
        },
        { status: 400 },
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: `${getAppUrl()}/suscripcion`,
      locale: "es",
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[billing-portal] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
