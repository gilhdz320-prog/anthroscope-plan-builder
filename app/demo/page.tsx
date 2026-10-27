import Link from "next/link";
import { buildDemo } from "@/lib/demo/fixture";
import { EQUIVALENTES_GRUPOS } from "@/lib/equivalentes";
import { PoweredByAnthroscope } from "@/components/PoweredByAnthroscope";

export const metadata = {
  title: "Demo · Anthroscope Plan Builder",
  description:
    "Así se ve un plan terminado: equivalentes SMAE repartidos por comida, metas de macros, progreso y PDF con tu marca.",
};

const GOAL_LABEL: Record<string, string> = {
  weight_loss: "Pérdida de grasa",
  maintenance: "Mantenimiento",
  muscle_gain: "Ganancia muscular",
  performance: "Rendimiento",
};

/** Gráfica ligera (SVG) para la demo, sin dependencias. */
function Sparkline({
  points,
  color,
  unit,
}: {
  points: Array<{ date: string; value: number }>;
  color: string;
  unit: string;
}) {
  const width = 520;
  const height = 120;
  const padding = 8;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const coords = points.map((point, index) => {
    const x =
      padding +
      (index / Math.max(1, points.length - 1)) * (width - padding * 2);
    const y =
      height -
      padding -
      ((point.value - min) / span) * (height - padding * 2);
    return { x, y };
  });

  const path = coords
    .map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x.toFixed(1)},${coord.y.toFixed(1)}`)
    .join(" ");
  const area = `${path} L${coords[coords.length - 1].x.toFixed(1)},${height - padding} L${coords[0].x.toFixed(1)},${height - padding} Z`;

  const last = values[values.length - 1];
  const first = values[0];
  const delta = last - first;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="font-mono-tabular text-xs" style={{ color: "var(--ink-muted)" }}>
          {last.toFixed(1)} {unit}{" "}
          <span style={{ color: delta <= 0 ? "#0F7B5C" : "#9B2C2C" }}>
            ({delta > 0 ? "+" : ""}
            {delta.toFixed(1)} {unit})
          </span>
        </p>
        <p className="text-[10px]" style={{ color: "var(--ink-subtle)" }}>
          8 semanas
        </p>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={`Evolución: ${first} a ${last} ${unit}`}
        style={{ marginTop: 6 }}
      >
        <path d={area} fill={color} opacity={0.12} />
        <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        {coords.map((coord, index) => (
          <circle key={index} cx={coord.x} cy={coord.y} r={3} fill={color} />
        ))}
      </svg>
    </div>
  );
}

export default function DemoPage() {
  const demo = buildDemo();
  const { patient } = demo;
  const sumKcal = demo.meals.reduce((total, meal) => total + meal.kcal, 0);
  const delta = sumKcal - demo.targetKcal;

  return (
    <main className="min-h-screen" style={{ background: "var(--paper)" }}>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-baseline gap-2">
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
          <Link href="/" className="btn btn-ghost">
            Volver
          </Link>
          <Link href="/signup" className="btn btn-primary">
            Empezar gratis
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-6xl px-6 pb-16">
        <p className="eyebrow" style={{ color: "var(--gold)" }}>
          Ejemplo · datos ficticios
        </p>
        <h1
          className="font-display mt-3 max-w-3xl"
          style={{
            fontSize: "clamp(30px,4.4vw,46px)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "var(--ink-strong)",
          }}
        >
          Así se ve un plan terminado
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
          El mismo motor que usarás: metas por equivalente SMAE, macros que cuadran y un
          PDF listo para entregar. Este ejemplo es de una paciente con objetivo de
          pérdida de grasa.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          {/* Patient */}
          <section className="card-luxe p-6">
            <p className="eyebrow" style={{ color: "var(--ink-subtle)" }}>
              Paciente
            </p>
            <h2
              className="font-display mt-2"
              style={{ fontSize: "28px", color: "var(--ink-strong)", lineHeight: 1.1 }}
            >
              {patient.first_name} {patient.last_name}
            </h2>
            <p className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
              {patient.age} años · {patient.height_cm} cm · {patient.weight_kg} kg ·{" "}
              {GOAL_LABEL[patient.goal] ?? patient.goal}
            </p>
            <p className="mt-2 text-[11px]" style={{ color: "var(--ink-subtle)" }}>
              {patient.sport} · {patient.notes}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-4 border-t pt-4" style={{ borderColor: "var(--border, #ECE6D8)" }}>
              {demo.metrics.map((metric) => (
                <div key={metric.key}>
                  <dt className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ink-subtle)" }}>
                    {metric.label}
                  </dt>
                  <dd
                    className="font-display mt-1"
                    style={{ fontSize: "22px", lineHeight: 1, color: "var(--ink-strong)" }}
                  >
                    {metric.value}
                  </dd>
                  {metric.hint && (
                    <dd className="mt-0.5 text-[10px]" style={{ color: "var(--ink-muted)" }}>
                      {metric.hint}
                    </dd>
                  )}
                </div>
              ))}
            </dl>

            <div className="mt-6 border-t pt-4" style={{ borderColor: "var(--border, #ECE6D8)" }}>
              <p className="eyebrow" style={{ color: "var(--ink-subtle)" }}>
                Progreso
              </p>
              <div className="mt-2 space-y-4">
                <Sparkline
                  points={demo.progress.map((p) => ({ date: p.date, value: p.weight }))}
                  color="#0F7B5C"
                  unit="kg"
                />
                <Sparkline
                  points={demo.progress.map((p) => ({ date: p.date, value: p.waist }))}
                  color="#C9A24A"
                  unit="cm"
                />
              </div>
            </div>
          </section>

          {/* Plan */}
          <section className="card-luxe p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="eyebrow" style={{ color: "var(--ink-subtle)" }}>
                  Plan
                </p>
                <h2
                  className="font-display mt-2"
                  style={{ fontSize: "26px", color: "var(--ink-strong)", lineHeight: 1.1 }}
                >
                  Plan de pérdida de grasa
                </h2>
              </div>
              <div className="text-right">
                <p className="font-display" style={{ fontSize: "28px", lineHeight: 1, color: "var(--ink-strong)" }}>
                  {sumKcal} kcal
                </p>
                <p className="text-[10px]" style={{ color: "var(--ink-subtle)" }}>
                  objetivo {demo.targetKcal} · {delta >= 0 ? "+" : ""}
                  {delta} kcal
                </p>
              </div>
            </div>

            <div
              className="mt-4 grid grid-cols-3 gap-3 rounded-md p-3 text-center"
              style={{ background: "var(--surface-sunken, #F3EFE5)" }}
            >
              {[
                { label: "Proteína", value: demo.totalsMacros.proteinG },
                { label: "Carbohidratos", value: demo.totalsMacros.carbsG },
                { label: "Grasas", value: demo.totalsMacros.fatG },
              ].map((macro) => (
                <div key={macro.label}>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ink-subtle)" }}>
                    {macro.label}
                  </p>
                  <p className="font-display mt-1" style={{ fontSize: "20px", color: "var(--ink-strong)" }}>
                    {macro.value} g
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-4">
              {demo.meals.map((meal) => (
                <div key={meal.name}>
                  <div className="flex items-baseline justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--gold-700, #7E6322)" }}>
                      {meal.name}
                    </p>
                    <p className="font-mono-tabular text-[11px]" style={{ color: "var(--ink-muted)" }}>
                      {meal.kcal} kcal
                    </p>
                  </div>
                  <ul className="mt-1.5 space-y-1">
                    {meal.items.map((item) => (
                      <li key={`${meal.name}-${item.grupo}`} className="flex items-baseline justify-between gap-3 text-xs">
                        <span style={{ color: "var(--ink-strong)" }}>
                          <strong>{item.count}×</strong>{" "}
                          {EQUIVALENTES_GRUPOS[item.grupo].label.es}
                          <span style={{ color: "var(--ink-subtle)" }}> — {item.foods}</span>
                        </span>
                        <span className="font-mono-tabular" style={{ color: "var(--ink-muted)" }}>
                          {item.kcal}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-4" style={{ borderColor: "var(--border, #ECE6D8)" }}>
              <a href="/demo/pdf" className="btn btn-primary">
                Descargar PDF de ejemplo
              </a>
              <Link href="/signup" className="btn btn-ghost">
                Hacer el mío
              </Link>
              <p className="text-[10px]" style={{ color: "var(--ink-subtle)" }}>
                El PDF lleva tu nombre, tu marca y la fecha.
              </p>
            </div>
          </section>
        </div>

        {/* Totals by group */}
        <section className="mt-10">
          <p className="eyebrow" style={{ color: "var(--gold)" }}>
            Equivalentes del día
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {demo.summary.map((group) => (
              <div key={group.grupo} className="card-luxe p-4">
                <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ink-subtle)" }}>
                  {group.label}
                </p>
                <p className="font-display mt-1" style={{ fontSize: "24px", lineHeight: 1, color: "var(--ink-strong)" }}>
                  {group.count}
                </p>
                <p className="text-[10px]" style={{ color: "var(--ink-muted)" }}>
                  {group.kcal} kcal
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12">
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "linear-gradient(135deg, var(--ink-strong) 0%, var(--brand-900, #0A5B45) 100%)" }}
          >
            <p className="font-display" style={{ fontSize: "clamp(22px,3vw,32px)", color: "var(--ink-inverse)", lineHeight: 1.15 }}>
              Tu próximo plan puede verse así, con tu marca.
            </p>
            <p className="mt-2 text-sm" style={{ color: "rgba(248,245,238,0.75)" }}>
              14 días completos, sin tarjeta. Sin límite de pacientes.
            </p>
            <Link
              href="/signup"
              className="btn mt-5"
              style={{ background: "var(--gold-500)", color: "var(--ink-strong)" }}
            >
              Crear mi cuenta gratis
            </Link>
          </div>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6" style={{ borderColor: "var(--border, #ECE6D8)" }}>
          <PoweredByAnthroscope variant="minimal" />
          <p className="text-[11px]" style={{ color: "var(--ink-subtle)" }}>
            Datos de ejemplo con fines demostrativos. No corresponden a una persona real.
          </p>
        </footer>
      </div>
    </main>
  );
}
