"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type Template = {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  kcal_target: number | null;
  is_seed: boolean;
  is_public: boolean;
  user_id: string | null;
};

const goalLabel: Record<string, string> = {
  bulk: "Volumen",
  cut: "Definición",
  endurance: "Resistencia",
  performance: "Rendimiento",
  recovery: "Recuperación",
  maintenance: "Mantenimiento",
  weight_loss: "Pérdida de peso",
  muscle_gain: "Ganancia muscular",
  therapeutic: "Terapéutico",
};

const filters = [
  { key: "all", label: "All" },
  { key: "bulk", label: "Bulk" },
  { key: "cut", label: "Cut" },
  { key: "endurance", label: "Endurance" },
  { key: "performance", label: "Performance" },
  { key: "recovery", label: "Recovery" },
  { key: "maintenance", label: "Maintenance" },
];

function badgeClass(goal: string | null): string {
  switch (goal) {
    case "bulk":
      return "badge-goal badge-bulk";
    case "cut":
      return "badge-goal badge-cut";
    case "endurance":
      return "badge-goal badge-endurance";
    case "performance":
      return "badge-goal badge-performance";
    case "recovery":
      return "badge-goal badge-recovery";
    case "maintenance":
      return "badge-goal badge-maintenance";
    default:
      return "badge-goal badge-default";
  }
}

function parseMacros(
  description: string | null,
): { p: string; c: string; g: string } | null {
  if (!description) return null;
  const m = description.match(/P\s*(\d+)\s*\/\s*C\s*(\d+)\s*\/\s*G\s*(\d+)/i);
  if (!m) return null;
  return { p: m[1], c: m[2], g: m[3] };
}

const cormorant = {
  fontFamily: "var(--font-cormorant), ui-serif, Georgia, serif",
};

export function TemplatesClient({
  initialTemplates,
  userId,
}: {
  initialTemplates: Template[];
  userId: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [activeFilter, setActiveFilter] = useState("all");
  const [editing, setEditing] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingId, setUsingId] = useState<string | null>(null);

  async function handleUse(tpl: Template) {
    setError(null);
    // Non-seed templates belong to the user: go straight to the plan editor.
    if (!tpl.is_seed) {
      router.push(`/dashboard/plans/new?template_id=${tpl.id}`);
      return;
    }
    // Seed templates are read-only: duplicate under the current user first,
    // then open the plan editor with the new copy.
    setUsingId(tpl.id);
    const { data, error: insErr } = await supabase
      .from("templates")
      .insert({
        name: tpl.name,
        description: tpl.description,
        goal: tpl.goal,
        kcal_target: tpl.kcal_target,
        user_id: userId,
        is_seed: false,
        is_public: false,
      })
      .select("id")
      .single();
    if (insErr || !data) {
      setUsingId(null);
      setError(insErr?.message ?? "No se pudo duplicar la plantilla.");
      return;
    }
    router.push(`/dashboard/plans/new?template_id=${data.id}`);
  }

  const visible = useMemo(
    () =>
      activeFilter === "all"
        ? templates
        : templates.filter((t) => t.goal === activeFilter),
    [templates, activeFilter],
  );

  function openEditor(tpl: Template) {
    setError(null);
    setEditing({ ...tpl });
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    setError(null);

    const payload = {
      name: editing.name,
      goal: editing.goal,
      kcal_target: editing.kcal_target,
      description: editing.description,
    };

    if (editing.is_seed) {
      // Seed templates are read-only: duplicate under the current user.
      const { data, error: insErr } = await supabase
        .from("templates")
        .insert({
          ...payload,
          user_id: userId,
          is_seed: false,
          is_public: false,
        })
        .select(
          "id, name, description, goal, kcal_target, is_seed, is_public, user_id",
        )
        .single();
      setSaving(false);
      if (insErr) {
        setError(insErr.message);
        return;
      }
      if (data) setTemplates((prev) => [data as Template, ...prev]);
    } else {
      const { error: updErr } = await supabase
        .from("templates")
        .update(payload)
        .eq("id", editing.id);
      setSaving(false);
      if (updErr) {
        setError(updErr.message);
        return;
      }
      setTemplates((prev) =>
        prev.map((t) => (t.id === editing.id ? { ...t, ...payload } : t)),
      );
    }
    setEditing(null);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="rise">
        <p className="eyebrow" style={{ color: "var(--gold)" }}>
          Plantillas
        </p>
        <h1
          className="mt-3"
          style={{
            ...cormorant,
            fontSize: "44px",
            color: "var(--ink-strong)",
            letterSpacing: "-0.02em",
            lineHeight: 1.02,
          }}
        >
          Plantillas reutilizables
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
          Esqueletos de plan que puedes aplicar a cualquier paciente.
        </p>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2 rise rise-1">
        {filters.map((f) => {
          const active = activeFilter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setActiveFilter(f.key)}
              className="rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: active ? "var(--gold)" : "#1a1a1a",
                color: active ? "#0a0a0a" : "var(--ink-muted)",
                border: `1px solid ${active ? "var(--gold)" : "#2a2a2a"}`,
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Template grid */}
      {visible.length === 0 ? (
        <div
          className="card-luxe px-5 py-14 text-center text-sm rise rise-2"
          style={{ color: "var(--ink-subtle)" }}
        >
          No hay plantillas en esta categoría.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 rise rise-2">
          {visible.map((tpl) => {
            const macros = parseMacros(tpl.description);
            return (
              <div
                key={tpl.id}
                className="card-luxe flex cursor-pointer flex-col p-5"
                onClick={() => openEditor(tpl)}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3
                    style={{
                      ...cormorant,
                      fontSize: "18px",
                      color: "var(--gold)",
                      lineHeight: 1.15,
                    }}
                  >
                    {tpl.name}
                  </h3>
                  <button
                    type="button"
                    aria-label="Editar"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditor(tpl);
                    }}
                    className="shrink-0 rounded-md p-1.5 transition-colors hover:bg-[#1f1f1f]"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className={badgeClass(tpl.goal)}>
                    {tpl.goal ? goalLabel[tpl.goal] ?? tpl.goal : "Sin objetivo"}
                  </span>
                  {tpl.is_seed && (
                    <span
                      className="text-[10px] uppercase tracking-[0.12em]"
                      style={{ color: "var(--ink-subtle)" }}
                    >
                      Inicial
                    </span>
                  )}
                </div>

                <p
                  className="mt-3 font-mono-tabular text-xs"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {tpl.kcal_target
                    ? `${tpl.kcal_target} kcal`
                    : "Sin meta calórica"}
                </p>

                {macros && (
                  <div className="mt-4 flex gap-2">
                    <span className="macro-chip">
                      <span className="macro-val">{macros.p}</span>
                      <span className="macro-lbl">Prot</span>
                    </span>
                    <span className="macro-chip">
                      <span className="macro-val">{macros.c}</span>
                      <span className="macro-lbl">Carbs</span>
                    </span>
                    <span className="macro-chip">
                      <span className="macro-val">{macros.g}</span>
                      <span className="macro-lbl">Grasa</span>
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUse(tpl);
                  }}
                  disabled={usingId === tpl.id}
                  className="btn btn-brand mt-5 self-start"
                  style={{ padding: "8px 14px", fontSize: "13px", opacity: usingId === tpl.id ? 0.6 : 1 }}
                >
                  {usingId === tpl.id && <span className="spinner" />}
                  {tpl.is_seed ? "Duplicar y usar" : "Usar plantilla"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit drawer */}
      {editing && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setEditing(null)}
          />
          <div
            className="fixed right-0 top-0 z-50 flex h-full w-96 max-w-full flex-col overflow-y-auto p-6"
            style={{
              background: "#141414",
              borderLeft: "1px solid var(--gold)",
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow" style={{ color: "var(--gold)" }}>
                  {editing.is_seed ? "Duplicar y editar" : "Editar plantilla"}
                </p>
                <h2
                  className="mt-1"
                  style={{ ...cormorant, fontSize: "24px", color: "var(--ink-strong)" }}
                >
                  {editing.name || "Plantilla"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setEditing(null)}
                className="rounded-md p-1.5 transition-colors hover:bg-[#1f1f1f]"
                style={{ color: "var(--ink-muted)" }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {editing.is_seed && (
              <p
                className="mt-3 rounded-md p-2.5 text-[11px]"
                style={{
                  background: "rgba(201,169,97,0.1)",
                  color: "var(--gold-soft)",
                }}
              >
                Esta es una plantilla inicial. Al guardar se creará una copia
                editable en tu cuenta.
              </p>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label className="label">Nombre</label>
                <input
                  className="input"
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="label">Objetivo</label>
                <select
                  className="input"
                  value={editing.goal ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, goal: e.target.value || null })
                  }
                >
                  <option value="">Sin objetivo</option>
                  <option value="bulk">Volumen (bulk)</option>
                  <option value="cut">Definición (cut)</option>
                  <option value="endurance">Resistencia (endurance)</option>
                  <option value="performance">Rendimiento (performance)</option>
                  <option value="recovery">Recuperación (recovery)</option>
                  <option value="maintenance">Mantenimiento (maintenance)</option>
                </select>
              </div>

              <div>
                <label className="label">Meta calórica (kcal)</label>
                <input
                  type="number"
                  className="input"
                  value={editing.kcal_target ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      kcal_target: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                />
              </div>

              <div>
                <label className="label">Descripción</label>
                <textarea
                  className="input"
                  rows={4}
                  value={editing.description ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                />
                <p
                  className="mt-1.5 text-[11px]"
                  style={{ color: "var(--ink-subtle)" }}
                >
                  Macros: usa el formato{" "}
                  <span className="font-mono-tabular">P / C / G</span> (ej.
                  &quot;P200/C350/G80&quot;) para mostrar las chips de
                  Proteína / Carbohidratos / Grasa.
                </p>
              </div>
            </div>

            {error && (
              <p className="mt-3 text-xs" style={{ color: "#fb7185" }}>
                {error}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn btn-brand"
                style={{ opacity: saving ? 0.6 : 1 }}
              >
                {saving && <span className="spinner" />}
                {editing.is_seed ? "Duplicar y editar" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="btn btn-ghost"
              >
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
