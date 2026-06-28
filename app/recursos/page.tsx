import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recursos — Productos Digitales | Anthroscope",
  description:
    "Herramientas digitales para nutriólogos y coaches. Anthroscope Plan Builder: planes profesionales del intake al PDF de lujo. Pago único, sin suscripción.",
};

// Dark noir + electric cyan palette for the Productos Digitales section.
const C = {
  bg: "#080c14",
  card: "#0d1020",
  border: "#1a2035",
  text: "#f0f0f5",
  cyan: "#00D4FF",
  muted: "#8a93a8",
  subtle: "#5a6178",
};

const features = [
  "224 alimentos bilingües (USDA + Sistema Mexicano de Equivalentes)",
  "17 grupos de equivalentes con kcal y macros por porción",
  "Plantillas reutilizables (pérdida de peso, mantenimiento, ganancia muscular, rendimiento)",
  "Detección automática de idioma (ES/EN)",
  "Exportación PDF de lujo con portada, macros, comidas y branding del nutriólogo",
  "Acceso desde cualquier dispositivo, datos seguros en la nube",
];

const comparison: { feature: string; builder: string; pro: string }[] = [
  { feature: "Planes de nutrición", builder: "✓ Manual + templates", pro: "✓ IA automático + templates" },
  { feature: "Equivalentes alimentarios", builder: "✓ 224 alimentos", pro: "✓ USDA 500k+ foods" },
  { feature: "Exportación PDF", builder: "✓ PDF de lujo", pro: "✓ PDF avanzado" },
  { feature: "AI Coaching", builder: "—", pro: "✓ GPT-4o-mini" },
  { feature: "CHO Periodización", builder: "—", pro: "✓" },
  { feature: "Ciclo Menstrual", builder: "—", pro: "✓" },
  { feature: "Evaluación Antropométrica", builder: "—", pro: "✓ ISAK protocol" },
  { feature: "Altitud / Aclimatación", builder: "—", pro: "✓" },
  { feature: "Multi-atleta / Equipo", builder: "—", pro: "✓" },
  { feature: "Pago", builder: "Una sola vez", pro: "Suscripción mensual" },
];

function Cell({ value }: { value: string }) {
  const isDash = value.trim() === "—";
  const isCheck = value.startsWith("✓");
  return (
    <span style={{ color: isDash ? C.subtle : isCheck ? C.cyan : C.text }}>
      {value}
    </span>
  );
}

export default function RecursosPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Top bar — matches site header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="font-display text-xl"
            style={{ color: "var(--ink-strong)", letterSpacing: "-0.02em" }}
          >
            Anthroscope
          </span>
          <span className="font-display text-xl italic" style={{ color: "var(--brand-700)" }}>
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

      {/* ====================================================================
          PRODUCTOS DIGITALES — dark noir + electric cyan
          Modular grid: add new product cards alongside Plan Builder below.
          ==================================================================== */}
      <section
        style={{ background: C.bg, color: C.text }}
        className="w-full"
      >
        <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
          {/* 1. Section header */}
          <div className="max-w-2xl">
            <h2
              className="font-display"
              style={{
                color: C.cyan,
                fontSize: "clamp(30px, 5vw, 46px)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              Productos Digitales
            </h2>
            <p className="mt-4 text-lg leading-8" style={{ color: C.muted }}>
              Herramientas especializadas para nutriólogos y coaches. Sin suscripción.
            </p>
          </div>

          {/* 2. Product card — Plan Builder (featured, full width) */}
          <article
            className="mt-12 grid grid-cols-1 gap-10 rounded-2xl p-6 sm:p-10 lg:grid-cols-2 lg:gap-14"
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              boxShadow: `0 0 0 1px rgba(0,212,255,0.04), 0 24px 60px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Left — stylized CSS PDF export mockup */}
            <div className="order-2 lg:order-1">
              <div
                className="relative mx-auto w-full max-w-sm overflow-hidden rounded-xl"
                style={{
                  background: "#0a0e18",
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 18px 48px rgba(0,0,0,0.55)",
                }}
              >
                {/* cyan header bar */}
                <div
                  className="flex items-center justify-between px-5 py-4"
                  style={{ background: `linear-gradient(135deg, ${C.cyan} 0%, #0093b3 100%)` }}
                >
                  <div>
                    <div className="h-2.5 w-28 rounded-full" style={{ background: "rgba(8,12,20,0.55)" }} />
                    <div className="mt-2 h-2 w-20 rounded-full" style={{ background: "rgba(8,12,20,0.35)" }} />
                  </div>
                  <span
                    className="rounded-md px-2 py-1 text-[10px] font-bold tracking-widest"
                    style={{ background: "#080c14", color: C.cyan }}
                  >
                    PDF
                  </span>
                </div>

                {/* macro stat row */}
                <div
                  className="grid grid-cols-3 gap-3 border-b px-5 py-5"
                  style={{ borderColor: C.border }}
                >
                  {["175g", "340g", "78g"].map((v, i) => (
                    <div key={i}>
                      <div className="h-1.5 w-8 rounded-full" style={{ background: C.subtle }} />
                      <div
                        className="mt-2 font-mono-tabular text-lg"
                        style={{ color: C.cyan }}
                      >
                        {v}
                      </div>
                    </div>
                  ))}
                </div>

                {/* fake meal lines */}
                <div className="space-y-4 px-5 py-6">
                  {[
                    ["85%", "40%"],
                    ["70%", "30%"],
                    ["90%", "45%"],
                    ["60%", "28%"],
                  ].map(([w1, w2], i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                      <div className="h-2.5 rounded-full" style={{ width: w1, maxWidth: "65%", background: "#1f2740", flex: "0 0 auto" }} />
                      <div className="h-2 rounded-full" style={{ width: w2, maxWidth: "30%", background: C.border }} />
                    </div>
                  ))}
                </div>

                {/* footer branding bar */}
                <div
                  className="flex items-center gap-2 border-t px-5 py-3"
                  style={{ borderColor: C.border }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.cyan }} />
                  <div className="h-1.5 w-24 rounded-full" style={{ background: C.subtle }} />
                </div>
              </div>
            </div>

            {/* Right — product info */}
            <div className="order-1 lg:order-2">
              <div className="flex flex-wrap gap-2">
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ background: "rgba(0,212,255,0.12)", color: C.cyan, border: `1px solid ${C.border}` }}
                >
                  Producto Digital
                </span>
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ background: "rgba(0,212,255,0.12)", color: C.cyan, border: `1px solid ${C.border}` }}
                >
                  Pago Único
                </span>
              </div>

              <h3
                className="font-display mt-5"
                style={{ color: C.text, fontSize: "30px", letterSpacing: "-0.02em" }}
              >
                Anthroscope Plan Builder
              </h3>
              <p className="mt-3 text-base leading-7" style={{ color: C.muted }}>
                Planes de nutrición profesionales, del intake al PDF de lujo, en minutos.
              </p>

              <ul className="mt-6 space-y-3">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm leading-6" style={{ color: C.text }}>
                    <span style={{ color: C.cyan }} aria-hidden>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {/* Price */}
              <div className="mt-8">
                <div className="flex items-baseline gap-1">
                  <span
                    className="font-display"
                    style={{ color: C.text, fontSize: "52px", lineHeight: 1, letterSpacing: "-0.04em" }}
                  >
                    $57
                  </span>
                  <span className="text-sm font-semibold" style={{ color: C.cyan }}>
                    USD
                  </span>
                </div>
                <p className="mt-2 text-sm" style={{ color: C.muted }}>
                  Pago único · Acceso de por vida
                </p>
              </div>

              {/* CTAs */}
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <a
                  href="https://planbuilder.anthroscope.pro/comprar"
                  className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                  style={{ background: C.cyan, color: "#080c14", boxShadow: "0 8px 24px rgba(0,212,255,0.25)" }}
                >
                  Comprar por $57
                </a>
                <a
                  href="https://anthroscope-plan-builder.vercel.app"
                  className="text-sm font-semibold"
                  style={{ color: C.cyan }}
                >
                  Ver demo →
                </a>
              </div>
            </div>
          </article>

          {/* 3. Comparison table */}
          <div className="mt-16">
            <h3
              className="font-display"
              style={{ color: C.text, fontSize: "24px", letterSpacing: "-0.02em" }}
            >
              Plan Builder vs Anthroscope Pro
            </h3>
            <div
              className="mt-6 overflow-x-auto rounded-xl"
              style={{ border: `1px solid ${C.border}` }}
            >
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr style={{ background: "rgba(0,212,255,0.08)" }}>
                    <th className="px-4 py-4 font-semibold" style={{ color: C.cyan }}>
                      Feature
                    </th>
                    <th className="px-4 py-4 font-semibold" style={{ color: C.cyan }}>
                      Plan Builder $57
                    </th>
                    <th className="px-4 py-4 font-semibold" style={{ color: C.cyan }}>
                      Anthroscope Pro desde $49/mes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr
                      key={row.feature}
                      style={{ borderTop: `1px solid ${C.border}`, background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}
                    >
                      <td className="px-4 py-3" style={{ color: C.text }}>
                        {row.feature}
                      </td>
                      <td className="px-4 py-3">
                        <Cell value={row.builder} />
                      </td>
                      <td className="px-4 py-3">
                        <Cell value={row.pro} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm" style={{ color: C.muted }}>
              ¿Ya sabes lo que Anthroscope puede hacer?{" "}
              <Link href="/pricing" style={{ color: C.cyan, fontWeight: 600 }}>
                Ver planes completos →
              </Link>
            </p>
          </div>

          {/* 4. Upsell nudge */}
          <div
            className="mt-12 rounded-2xl p-8"
            style={{
              background: "linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(13,16,32,0.6) 100%)",
              border: `1px solid ${C.border}`,
            }}
          >
            <p className="max-w-3xl text-base leading-7" style={{ color: C.text }}>
              El Plan Builder es el primer paso. Cuando estés listo para escalar — AI,
              evaluaciones, altitud, equipos completos — Anthroscope Pro te espera.
            </p>
            <Link
              href="/pricing"
              className="mt-5 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
              style={{ border: `1px solid ${C.cyan}`, color: C.cyan }}
            >
              Ver Anthroscope Pro →
            </Link>
          </div>

          {/* 5. Modular grid placeholder — more products will be added here */}
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* TODO: add new digital product cards to this grid as they launch */}
            <div
              className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl p-8 text-center"
              style={{ border: `1.5px dashed ${C.border}`, background: "rgba(255,255,255,0.01)" }}
            >
              <span
                className="text-3xl"
                style={{ color: C.subtle }}
                aria-hidden
              >
                +
              </span>
              <p className="mt-3 text-sm font-semibold" style={{ color: C.muted }}>
                Más productos digitales próximamente
              </p>
              <p className="mt-1 text-xs" style={{ color: C.subtle }}>
                More digital products coming soon
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="mx-auto max-w-6xl px-6 text-sm" style={{ color: "var(--ink-muted)" }}>
          © {new Date().getFullYear()} Anthroscope · Plan Builder
        </div>
      </footer>
    </main>
  );
}
