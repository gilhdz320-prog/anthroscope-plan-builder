import Link from "next/link";

export type ChecklistStep = {
  key: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
};

/**
 * Checklist de activación del panel.
 *
 * Existe por una razón medida: la mayoría de los trials que no convierten es
 * porque nunca llegan a generar un plan. Mostrar los 4 pasos con estado real
 * (no un tutorial genérico) reduce esa fuga.
 */
export function ActivationChecklist({
  steps,
  extraAction,
}: {
  steps: ChecklistStep[];
  extraAction?: React.ReactNode;
}) {
  const done = steps.filter((step) => step.done).length;
  const total = steps.length;

  if (done === total) return null;

  const pct = Math.round((done / total) * 100);

  return (
    <section
      className="card-luxe p-6 rise"
      style={{ border: "1px solid rgba(201,169,97,0.35)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="eyebrow" style={{ color: "var(--gold)" }}>
          Primeros pasos
        </p>
        <p className="font-mono-tabular text-xs" style={{ color: "var(--ink-muted)" }}>
          {done} de {total}
        </p>
      </div>

      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "var(--surface-sunken, #1a1a1a)" }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "var(--gold)",
            transition: "width 300ms ease",
          }}
        />
      </div>

      <ul className="mt-5 space-y-3">
        {steps.map((step) => (
          <li key={step.key} className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]"
              style={{
                background: step.done ? "rgba(52,211,153,0.15)" : "rgba(201,169,97,0.12)",
                color: step.done ? "#34d399" : "var(--gold)",
                border: `1px solid ${step.done ? "rgba(52,211,153,0.4)" : "rgba(201,169,97,0.35)"}`,
              }}
            >
              {step.done ? "✓" : "•"}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm"
                style={{
                  color: step.done ? "var(--ink-subtle)" : "var(--ink-strong)",
                  textDecoration: step.done ? "line-through" : "none",
                }}
              >
                {step.title}
              </p>
              {!step.done && (
                <p className="mt-0.5 text-[11px]" style={{ color: "var(--ink-muted)" }}>
                  {step.description}
                </p>
              )}
            </div>
            {!step.done && (
              <Link
                href={step.href}
                className="shrink-0 rounded-md px-3 py-1.5 text-[11px] font-semibold"
                style={{ background: "var(--gold)", color: "#111111" }}
              >
                {step.cta}
              </Link>
            )}
          </li>
        ))}
      </ul>

      {extraAction && <div className="mt-5">{extraAction}</div>}
    </section>
  );
}
