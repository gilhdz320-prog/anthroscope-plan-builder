import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAccess } from "@/lib/billing/access";
import { BILLING, formatPrice, monthlyEquivalent } from "@/lib/billing/config";
import { SubscribeButtons } from "@/components/billing/SubscribeButtons";
import { PoweredByAnthroscope } from "@/components/PoweredByAnthroscope";

export const dynamic = "force-dynamic";

const FEATURES = [
  "Planes con Sistema Mexicano de Alimentos Equivalentes (SMAE)",
  "Pacientes y expediente ilimitados — sin topes por plan",
  "PDF con tu marca para entregar en consulta",
  "Portal del paciente por enlace, sin que instale nada",
  "Plantillas por padecimiento y recall dietético 24h/3d/7d",
  "Exporta tus datos cuando quieras (CSV)",
];

export default async function SuscripcionPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string; expired?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const access = user ? await getAccess(supabase, user.id) : null;

  const monthly = formatPrice(BILLING.plans.monthly.amount);
  const annual = formatPrice(BILLING.plans.annual.amount);
  const annualPerMonth = formatPrice(monthlyEquivalent("annual"));
  const savings = formatPrice(
    BILLING.plans.monthly.amount * 12 - BILLING.plans.annual.amount,
  );

  const statusLine = (() => {
    if (!user) return "Crea tu cuenta y empieza con 14 días de prueba.";
    if (!access) return null;
    if (access.kind === "legacy") return "Tienes acceso de por vida (compra original).";
    if (access.kind === "active") return "Tu suscripción está activa.";
    if (access.kind === "trial")
      return `Estás en prueba: te quedan ${access.trialDaysLeft} ${
        access.trialDaysLeft === 1 ? "día" : "días"
      }.`;
    if (access.kind === "past_due")
      return `Pago rechazado: tienes ${access.graceDaysLeft} ${
        access.graceDaysLeft === 1 ? "día" : "días"
      } de acceso antes de que se pause.`;
    return "Tu acceso está pausado. Reactiva para seguir usando tus planes.";
  })();

  return (
    <main className="min-h-screen" style={{ background: "var(--paper)" }}>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <Link href="/" className="eyebrow" style={{ color: "var(--gold)" }}>
          ← Volver
        </Link>

        <div className="mt-6 grid gap-10 md:grid-cols-[1.15fr_1fr] md:items-start">
          {/* Copy */}
          <div>
            <p className="eyebrow" style={{ color: "var(--gold)" }}>
              Para nutriólogas y nutriólogos
            </p>
            <h1
              className="font-display mt-3"
              style={{ fontSize: "clamp(30px,4vw,44px)", lineHeight: 1.05, color: "var(--ink-strong)" }}
            >
              El plan de alimentación en minutos,
              <br />
              con SMAE y tu marca.
            </h1>
            <p className="mt-5 text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
              Deja de pelear con Excel y Word. Arma el plan con equivalentes
              mexicanos, entrégalo como PDF profesional y comparte el portal del
              paciente con un enlace. Sin límite de pacientes.
            </p>

            <ul className="mt-6 space-y-2.5">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex gap-2 text-sm" style={{ color: "var(--ink-strong)" }}>
                  <span style={{ color: "var(--green-600, #0F7B5C)" }}>✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div
              className="mt-6 rounded-md border p-4 text-xs leading-relaxed"
              style={{
                background: "var(--brand-50, #F1F7F3)",
                borderColor: "var(--border-emerald, #CFE3D8)",
                color: "var(--ink-muted)",
              }}
            >
              <strong style={{ color: "var(--ink-strong)" }}>Comparado con lo que hay en México:</strong>{" "}
              los planes de otros software arrancan en $299 MXN/mes y te limitan a
              20 pacientes. Aquí pagas {monthly} y no hay tope.
            </div>
          </div>

          {/* Card de compra */}
          <div className="card-luxe p-6">
            {sp.expired && (
              <p
                className="mb-4 rounded-md border p-3 text-xs"
                style={{ background: "#FDF3F2", borderColor: "#E7C9C5", color: "#9B2C2C" }}
              >
                Tu acceso terminó. Reactiva para volver a tus pacientes y planes.
              </p>
            )}
            {sp.canceled && (
              <p
                className="mb-4 rounded-md border p-3 text-xs"
                style={{ background: "#FFF9EC", borderColor: "#EBD9AE", color: "#7E6322" }}
              >
                Cancelaste el pago. No se cobró nada.
              </p>
            )}

            <p className="eyebrow" style={{ color: "var(--gold)" }}>
              Suscripción
            </p>
            <div className="mt-2 flex items-end gap-2">
              <span className="font-display" style={{ fontSize: "40px", lineHeight: 1 }}>
                {monthly}
              </span>
              <span className="pb-1 text-xs" style={{ color: "var(--ink-muted)" }}>
                MXN / mes
              </span>
            </div>
            <p className="mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
              o {annual} al año ({annualPerMonth}/mes) — ahorras {savings}.
            </p>

            <div className="mt-5">
              <SubscribeButtons
                isLoggedIn={Boolean(user)}
                hasSubscription={Boolean(
                  access && (access.kind === "active" || access.kind === "past_due"),
                )}
              />
            </div>

            {statusLine && (
              <p
                className="mt-4 rounded-md p-3 text-xs"
                style={{ background: "var(--paper)", color: "var(--ink-strong)" }}
              >
                {statusLine}
              </p>
            )}

            <p className="mt-4 text-[11px]" style={{ color: "var(--ink-subtle)" }}>
              Pago seguro con Stripe. Facturas disponibles. Tus datos de pacientes
              son tuyos: puedes exportarlos en cualquier momento.
            </p>
          </div>
        </div>

        {/* FAQ corto */}
        <section className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              q: "¿Hay contrato?",
              a: "No. Se cobra mes a mes (o al año si eliges ese plan) y cancelas desde el portal de Stripe en dos clics.",
            },
            {
              q: "¿Qué pasa si cancelo?",
              a: "Tu cuenta se pausa, pero tus pacientes, planes y plantillas no se borran. Al reactivar sigues donde estabas.",
            },
            {
              q: "¿Sirve para mi consulta?",
              a: "Está hecha para consulta de nutrición en México: SMAE, alimentos mexicanos y PDF que puedes entregar tal cual.",
            },
          ].map((item) => (
            <div key={item.q}>
              <h3 className="text-sm font-semibold" style={{ color: "var(--ink-strong)" }}>
                {item.q}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                {item.a}
              </p>
            </div>
          ))}
        </section>

        <footer className="mt-14 border-t pt-6" style={{ borderColor: "var(--border, #ECE6D8)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PoweredByAnthroscope variant="minimal" />
            <p className="text-[11px]" style={{ color: "var(--ink-subtle)" }}>
              <Link href="/privacidad" className="underline underline-offset-2">
                Aviso de privacidad
              </Link>
              {" · "}
              <Link href="/terminos" className="underline underline-offset-2">
                Términos
              </Link>
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
