import Link from "next/link";
import { getLocale } from "@/lib/i18n";
import { PoweredByAnthroscope } from "@/components/PoweredByAnthroscope";

export const dynamic = "force-dynamic";

const copy = {
  es: {
    title: "Suscripción activa",
    subtitle:
      "Listo. Tu cuenta ya está conectada a Stripe y puedes usar el Plan Builder sin límites de pacientes.",
    next: "Qué hacer ahora",
    steps: [
      "Crea tu primer paciente (o importa los que ya tienes).",
      "Arma su plan con equivalentes SMAE.",
      "Genera el PDF con tu marca y compártelo.",
    ],
    cta: "Ir a mi panel",
    billing: "Gestionar suscripción y facturas",
    note: "Te enviamos la confirmación por correo. Si no la ves, revisa spam.",
  },
  en: {
    title: "Subscription active",
    subtitle:
      "You're all set. Your account is connected to Stripe and you can use the Plan Builder with unlimited patients.",
    next: "What to do next",
    steps: [
      "Create your first patient (or import your current ones).",
      "Build their plan with SMAE exchanges.",
      "Generate the branded PDF and share it.",
    ],
    cta: "Go to my dashboard",
    billing: "Manage subscription and invoices",
    note: "We emailed you a confirmation. If you don't see it, check spam.",
  },
};

export default async function GraciasPage() {
  const locale = await getLocale();
  const c = copy[locale];

  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl text-center">
          <div style={{ fontSize: "44px", color: "var(--gold-600)" }}>✓</div>

          <h1
            className="font-display mt-4"
            style={{
              fontSize: "clamp(32px,5vw,44px)",
              color: "var(--ink-strong)",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            {c.title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
            {c.subtitle}
          </p>

          <div className="card-luxe mt-8 p-6 text-left">
            <p className="eyebrow" style={{ color: "var(--gold)" }}>
              {c.next}
            </p>
            <ol className="mt-3 space-y-2 pl-4 text-sm" style={{ color: "var(--ink-strong)" }}>
              {c.steps.map((step) => (
                <li key={step} className="list-decimal">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link href="/dashboard" className="btn btn-primary w-full sm:w-auto">
              {c.cta} →
            </Link>
            <Link
              href="/suscripcion"
              className="text-xs underline underline-offset-4"
              style={{ color: "var(--ink-muted)" }}
            >
              {c.billing}
            </Link>
          </div>

          <p className="mt-8 text-[11px]" style={{ color: "var(--ink-subtle)" }}>
            {c.note}
          </p>
        </div>
      </div>

      <div className="px-6 pb-8">
        <PoweredByAnthroscope variant="minimal" className="text-center" />
      </div>
    </main>
  );
}
