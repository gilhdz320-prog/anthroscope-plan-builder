import Link from "next/link";
import { getLocale } from "@/lib/i18n";
import { PoweredByAnthroscope } from "@/components/PoweredByAnthroscope";

const copy = {
  es: {
    successTitle: "¡Compra exitosa!",
    successSub: "Revisa tu email para tu código de acceso.",
    badge: "OFERTA EXCLUSIVA — SOLO UNA VEZ",
    upsellHeading: "Espera — Antes de ir a tu cuenta...",
    upsellSub:
      "Ya que eres cliente de Plan Builder, obtén Anthroscope Pro completo por solo $19/mes los primeros 3 meses (luego $39/mes). Cancela cuando quieras.",
    upsellFeatures: [
      "🏆 Gestión de múltiples atletas (hasta 15)",
      "📊 Evaluaciones antropométricas avanzadas",
      "🤖 AI Coach personalizado",
      "📈 Periodización nutricional y CHO",
      "🔔 Alertas y seguimiento automático",
      "📱 App móvil (próximamente)",
    ],
    upsellYes: "Sí, quiero Anthroscope Pro por $19/mes →",
    upsellNo: "No gracias, solo quiero Plan Builder",
    accessHeading: "Tu acceso a Plan Builder:",
    steps: [
      "Revisa tu email",
      "Usa el código para crear tu cuenta en /signup",
      "Empieza a crear planes",
    ],
    goLogin: "Ir al login →",
  },
  en: {
    successTitle: "Purchase successful!",
    successSub: "Check your email for your access code.",
    badge: "EXCLUSIVE OFFER — ONE TIME ONLY",
    upsellHeading: "Wait — Before you go to your account...",
    upsellSub:
      "As a Plan Builder customer, get full Anthroscope Pro for just $19/month for the first 3 months (then $39/month). Cancel anytime.",
    upsellFeatures: [
      "🏆 Gestión de múltiples atletas (hasta 15)",
      "📊 Evaluaciones antropométricas avanzadas",
      "🤖 AI Coach personalizado",
      "📈 Periodización nutricional y CHO",
      "🔔 Alertas y seguimiento automático",
      "📱 App móvil (próximamente)",
    ],
    upsellYes: "Yes, I want Anthroscope Pro for $19/month →",
    upsellNo: "No thanks, just Plan Builder",
    accessHeading: "Your Plan Builder access:",
    steps: [
      "Check your email",
      "Use the code to create your account at /signup",
      "Start creating plans",
    ],
    goLogin: "Go to login →",
  },
};

export default async function GraciasPage() {
  const locale = await getLocale();
  const c = copy[locale];

  return (
    <main className="relative flex min-h-screen flex-col">
      <div className="flex flex-1 justify-center px-6 py-16">
        <div className="w-full max-w-2xl">
          {/* Confirmation */}
          <div className="text-center rise">
            <div style={{ fontSize: "48px", color: "var(--gold-600)" }}>✅</div>
            <h1
              className="font-display mt-4"
              style={{
                fontSize: "44px",
                color: "var(--ink-strong)",
                letterSpacing: "-0.03em",
                lineHeight: 1.02,
              }}
            >
              {c.successTitle}
            </h1>
            <p className="mt-3 text-base" style={{ color: "var(--ink-muted)" }}>
              {c.successSub}
            </p>
          </div>

          {/* Upsell — one time offer */}
          <div
            className="card-luxe mt-12 p-8 rise rise-1"
            style={{ border: "1px solid var(--gold-500)" }}
          >
            <span
              className="eyebrow inline-block rounded-full px-3 py-1"
              style={{
                background: "var(--danger-bg)",
                color: "var(--gold-700)",
                border: "1px solid var(--gold-300)",
              }}
            >
              {c.badge}
            </span>

            <h2
              className="font-display mt-5"
              style={{
                fontSize: "36px",
                color: "var(--ink-strong)",
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
              }}
            >
              {c.upsellHeading}
            </h2>

            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: "var(--ink-muted)" }}
            >
              {c.upsellSub}
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              {c.upsellFeatures.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2"
                  style={{ color: "var(--ink-default)" }}
                >
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <a
              href="https://app.anthroscope.pro/#/registro"
              className="btn btn-brand mt-8 w-full"
            >
              {c.upsellYes}
            </a>

            <a href="#access" className="btn btn-ghost mt-3 w-full">
              {c.upsellNo}
            </a>
          </div>

          {/* Access instructions */}
          <div id="access" className="card-luxe mt-12 p-8 rise rise-2">
            <h3
              className="font-display"
              style={{
                fontSize: "26px",
                color: "var(--ink-strong)",
                letterSpacing: "-0.02em",
              }}
            >
              {c.accessHeading}
            </h3>
            <ol className="mt-5 space-y-4 text-sm">
              {c.steps.map((step, i) => (
                <li
                  key={step}
                  className="flex gap-3"
                  style={{ color: "var(--ink-default)" }}
                >
                  <span
                    className="font-display"
                    style={{
                      color: "var(--gold-600)",
                      fontSize: "20px",
                      lineHeight: 1,
                    }}
                  >
                    {i + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <Link href="/login" className="btn btn-brand mt-7 w-full">
              {c.goLogin}
            </Link>
          </div>

          <div className="mt-12">
            <PoweredByAnthroscope />
          </div>
        </div>
      </div>
    </main>
  );
}
