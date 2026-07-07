import Link from "next/link";
import { PoweredByAnthroscope } from "@/components/PoweredByAnthroscope";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="font-display text-xl"
            style={{ color: "var(--ink-strong)", letterSpacing: "-0.02em" }}
          >
            Anthroscope
          </span>
          <span
            className="font-display text-xl italic"
            style={{ color: "var(--brand-700)" }}
          >
            Plan Builder
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn btn-ghost">
            Iniciar sesión
          </Link>
          <Link href="/signup" className="btn btn-primary">
            Crear cuenta
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="eyebrow rise">
              Edición Profesional · 2026
            </p>
            <h1 className="hero-text mt-6 rise rise-1">
              Planes de nutrición{" "}
              <span className="font-display italic" style={{ color: "var(--brand-700)" }}>
                profesionales
              </span>
              , del intake al PDF, en minutos.
            </h1>
            <p
              className="mt-6 max-w-xl text-lg leading-8 rise rise-2"
              style={{ color: "var(--ink-muted)" }}
            >
              Software diseñado para nutriólogos y coaches deportivos.
              Equivalentes ADA y Sistema Mexicano, plantillas reutilizables,
              cálculos automáticos, recall dietético y exportación PDF de lujo —{" "}
              <span className="font-display italic" style={{ color: "var(--ink-default)" }}>
                listo para tus pacientes
              </span>
              .
            </p>

            {/* PRICING - Prominent and visible */}
            <div
              className="mt-8 rise rise-2 inline-flex flex-col items-start rounded-xl border px-6 py-5"
              style={{
                borderColor: "var(--gold-400)",
                background: "color-mix(in srgb, var(--gold-100) 30%, transparent)",
              }}
            >
              <div className="flex items-baseline gap-3">
                <span
                  className="font-display text-4xl font-bold"
                  style={{ color: "var(--ink-strong)", letterSpacing: "-0.03em" }}
                >
                  $57
                </span>
                <span className="text-sm" style={{ color: "var(--ink-muted)" }}>
                  USD · Pago único
                </span>
              </div>
              <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
                Acceso de por vida. Sin suscripciones. Sin cargos ocultos.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <svg className="h-4 w-4" style={{ color: "var(--brand-600)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs" style={{ color: "var(--ink-default)" }}>
                  Incluye todas las actualizaciones futuras
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 rise rise-3">
              <Link href="/signup" className="btn btn-brand">
                Comenzar ahora — $57 USD
              </Link>
              <Link href="/login" className="btn btn-ghost">
                Ya tengo cuenta →
              </Link>
            </div>

            {/* Features list */}
            <div
              className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 rise rise-4 text-sm"
              style={{ color: "var(--ink-muted)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--brand-500)" }}
                />
                500+ alimentos bilingües
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--gold-500)" }}
                />
                Equivalentes ADA · Mexicano
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--ink-strong)" }}
                />
                Export PDF de lujo
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--brand-500)" }}
                />
                Recall dietético (24h, 3 y 7 días)
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--gold-500)" }}
                />
                Intake form automático
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--ink-strong)" }}
                />
                Plantillas reutilizables
              </div>
            </div>
          </div>

          {/* Showcase card */}
          <div className="lg:col-span-5">
            <div
              className="card-luxe relative overflow-hidden rise rise-2"
              style={{ padding: "32px" }}
            >
              <div
                className="absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full opacity-20"
                style={{
                  background:
                    "radial-gradient(circle, var(--gold-300) 0%, transparent 70%)",
                }}
              />
              <p className="eyebrow">Plan ejemplo</p>
              <h3
                className="section-h mt-3"
                style={{ fontSize: "26px" }}
              >
                Atleta 22a · 70 kg
              </h3>
              <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
                Periodización de fuerza · 2800 kcal
              </p>

              <div
                className="mt-6 grid grid-cols-3 gap-4 border-y py-5"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--ink-subtle)" }}>
                    Prot
                  </p>
                  <p className="stat-num mt-1" style={{ fontSize: "22px" }}>
                    175<span className="text-xs" style={{ color: "var(--ink-muted)" }}>g</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--ink-subtle)" }}>
                    HC
                  </p>
                  <p className="stat-num mt-1" style={{ fontSize: "22px" }}>
                    340<span className="text-xs" style={{ color: "var(--ink-muted)" }}>g</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--ink-subtle)" }}>
                    Lip
                  </p>
                  <p className="stat-num mt-1" style={{ fontSize: "22px" }}>
                    78<span className="text-xs" style={{ color: "var(--ink-muted)" }}>g</span>
                  </p>
                </div>
              </div>

              <ul className="mt-5 space-y-2 text-sm" style={{ color: "var(--ink-default)" }}>
                <li className="flex items-baseline justify-between gap-3">
                  <span className="font-display italic">Desayuno</span>
                  <span className="font-mono-tabular text-xs" style={{ color: "var(--ink-muted)" }}>620 kcal</span>
                </li>
                <li className="flex items-baseline justify-between gap-3">
                  <span className="font-display italic">Comida</span>
                  <span className="font-mono-tabular text-xs" style={{ color: "var(--ink-muted)" }}>880 kcal</span>
                </li>
                <li className="flex items-baseline justify-between gap-3">
                  <span className="font-display italic">Pre-entreno</span>
                  <span className="font-mono-tabular text-xs" style={{ color: "var(--ink-muted)" }}>320 kcal</span>
                </li>
                <li className="flex items-baseline justify-between gap-3">
                  <span className="font-display italic">Cena</span>
                  <span className="font-mono-tabular text-xs" style={{ color: "var(--ink-muted)" }}>740 kcal</span>
                </li>
              </ul>

              <div className="mt-6 pt-5 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <PoweredByAnthroscope variant="minimal" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's included section */}
      <section
        className="border-t py-16"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="mx-auto max-w-6xl px-6">
          <p className="eyebrow text-center">Lo que incluye</p>
          <h2
            className="section-h mt-4 text-center"
            style={{ fontSize: "28px" }}
          >
            Todo lo que necesitas para crear planes profesionales
          </h2>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="space-y-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: "color-mix(in srgb, var(--brand-500) 15%, transparent)" }}
              >
                <svg className="h-5 w-5" style={{ color: "var(--brand-600)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <h3 className="font-display text-sm font-medium" style={{ color: "var(--ink-strong)" }}>
                Intake Form Automático
              </h3>
              <p className="text-xs leading-5" style={{ color: "var(--ink-muted)" }}>
                Envía un link a tu paciente. Llena sus datos y el sistema calcula calorías y macros automáticamente.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="space-y-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: "color-mix(in srgb, var(--gold-500) 15%, transparent)" }}
              >
                <svg className="h-5 w-5" style={{ color: "var(--gold-600)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
                </svg>
              </div>
              <h3 className="font-display text-sm font-medium" style={{ color: "var(--ink-strong)" }}>
                Equivalentes ADA y Mexicano
              </h3>
              <p className="text-xs leading-5" style={{ color: "var(--ink-muted)" }}>
                Base de datos con 500+ alimentos. Sistema Mexicano de Equivalentes y ADA integrados.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="space-y-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: "color-mix(in srgb, var(--brand-500) 15%, transparent)" }}
              >
                <svg className="h-5 w-5" style={{ color: "var(--brand-600)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="font-display text-sm font-medium" style={{ color: "var(--ink-strong)" }}>
                Export PDF Profesional
              </h3>
              <p className="text-xs leading-5" style={{ color: "var(--ink-muted)" }}>
                Genera PDFs de lujo listos para entregar a tus pacientes. Con tu marca y diseño premium.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="space-y-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: "color-mix(in srgb, var(--gold-500) 15%, transparent)" }}
              >
                <svg className="h-5 w-5" style={{ color: "var(--gold-600)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-display text-sm font-medium" style={{ color: "var(--ink-strong)" }}>
                Recall Dietético
              </h3>
              <p className="text-xs leading-5" style={{ color: "var(--ink-muted)" }}>
                Envía formularios de recall de 24 horas, 3 días o 7 días. Tu paciente lo llena desde su celular.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="space-y-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: "color-mix(in srgb, var(--brand-500) 15%, transparent)" }}
              >
                <svg className="h-5 w-5" style={{ color: "var(--brand-600)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                </svg>
              </div>
              <h3 className="font-display text-sm font-medium" style={{ color: "var(--ink-strong)" }}>
                Plantillas Reutilizables
              </h3>
              <p className="text-xs leading-5" style={{ color: "var(--ink-muted)" }}>
                Crea una vez, usa siempre. Guarda tus planes como plantillas y aplícalos a nuevos pacientes.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="space-y-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: "color-mix(in srgb, var(--gold-500) 15%, transparent)" }}
              >
                <svg className="h-5 w-5" style={{ color: "var(--gold-600)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
              </div>
              <h3 className="font-display text-sm font-medium" style={{ color: "var(--ink-strong)" }}>
                Calculadora Integrada
              </h3>
              <p className="text-xs leading-5" style={{ color: "var(--ink-muted)" }}>
                Harris-Benedict, Mifflin-St Jeor, y más. Calcula GEB, GET y distribución de macros al instante.
              </p>
            </div>
          </div>

          {/* CTA at bottom */}
          <div className="mt-16 text-center">
            <Link href="/signup" className="btn btn-brand">
              Comenzar ahora — $57 USD · Pago único
            </Link>
            <p className="mt-3 text-xs" style={{ color: "var(--ink-muted)" }}>
              Sin suscripciones. Acceso inmediato. Actualizaciones incluidas.
            </p>
          </div>
        </div>
      </section>

      <footer
        className="border-t py-6"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="mx-auto max-w-6xl px-6">
          <PoweredByAnthroscope />
        </div>
      </footer>
    </main>
  );
}
