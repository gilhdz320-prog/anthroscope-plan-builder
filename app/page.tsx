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
              Sistema enfocado para nutriólogos y coaches. Equivalentes ADA y
              Sistema Mexicano, plantillas reutilizables, cálculos automáticos
              y exportación PDF de lujo —{" "}
              <span className="font-display italic" style={{ color: "var(--ink-default)" }}>
                listo para tus pacientes
              </span>
              .
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3 rise rise-3">
              <Link href="/signup" className="btn btn-brand">
                Comenzar ahora
              </Link>
              <Link href="/login" className="btn btn-ghost">
                Ya tengo cuenta →
              </Link>
              <span className="chip chip-gold ml-2">Edición Pro · Pago único</span>
            </div>

            <div
              className="mt-12 flex items-center gap-6 rise rise-4 text-sm"
              style={{ color: "var(--ink-muted)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--brand-500)" }}
                />
                224 alimentos bilingües
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
