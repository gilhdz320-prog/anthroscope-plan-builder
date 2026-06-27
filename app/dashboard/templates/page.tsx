import { createClient } from "@/lib/supabase/server";

const goalLabel: Record<string, string> = {
  weight_loss: "Pérdida de peso",
  maintenance: "Mantenimiento",
  muscle_gain: "Ganancia muscular",
  performance: "Rendimiento",
  therapeutic: "Terapéutico",
};

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: templates, error } = await supabase
    .from("templates")
    .select("id, name, description, goal, kcal_target, is_seed, is_public, user_id")
    .order("is_seed", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="rise">
        <p className="eyebrow">Plantillas</p>
        <h1
          className="font-display mt-3"
          style={{
            fontSize: "38px",
            color: "var(--ink-strong)",
            letterSpacing: "-0.025em",
            lineHeight: 1.02,
          }}
        >
          Plantillas reutilizables
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
          Esqueletos de plan que puedes aplicar a cualquier paciente.
        </p>
      </div>

      {error && (
        <div
          className="rounded-md border p-3 text-xs"
          style={{
            background: "var(--danger-bg)",
            borderColor: "rgba(184,60,42,0.2)",
            color: "var(--danger)",
          }}
        >
          {error.message}
        </div>
      )}

      <div className="card-luxe overflow-hidden rise rise-1" style={{ padding: 0 }}>
        <div
          className="border-b px-5 py-3.5"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <p className="eyebrow">Todas las plantillas</p>
        </div>

        {!templates || templates.length === 0 ? (
          <div
            className="px-5 py-14 text-center text-sm"
            style={{ color: "var(--ink-subtle)" }}
          >
            Aún no hay plantillas.
          </div>
        ) : (
          <ul>
            {templates.map((tpl) => (
              <li
                key={tpl.id}
                className="flex items-center justify-between border-t px-5 py-4 transition-colors hover:bg-[var(--surface-sunken)]/40"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <div>
                  <p
                    className="font-display"
                    style={{
                      fontSize: "17px",
                      color: "var(--ink-strong)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {tpl.name}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
                    {tpl.goal ? goalLabel[tpl.goal] ?? tpl.goal : "Sin objetivo"} ·{" "}
                    <span className="font-mono-tabular">
                      {tpl.kcal_target ? `${tpl.kcal_target} kcal` : "sin meta"}
                    </span>
                  </p>
                </div>
                <span className={tpl.is_seed ? "chip" : "chip chip-brand"}>
                  {tpl.is_seed ? "Inicial" : "Personalizada"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
