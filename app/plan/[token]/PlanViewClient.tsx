"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { PoweredByAnthroscope } from "@/components/PoweredByAnthroscope";
import {
  EQUIVALENTES_GRUPOS,
  GRUPO_KEYS,
  equivalentesToMacros,
  type Equivalentes,
  type GrupoKey,
} from "@/lib/equivalentes";
import {
  CLINICAL_GROUP_META,
  CLINICAL_TO_DB_GROUPS,
} from "@/lib/food-groups";

interface FoodOut {
  id: string;
  group: string;
  es: string;
  en: string;
  serving_es: string;
  serving_en: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface PlanEquivalentesData {
  mode: string;
  kcalTarget: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  groups: Equivalentes;
}

interface ApiResponse {
  plan: {
    id: string;
    title: string;
    valid_from: string | null;
    valid_until: string | null;
    plan_mode: string;
    equivalentes: PlanEquivalentesData | null;
    notes: string | null;
    patient_first_name: string | null;
  };
  meals: { meal_name: string; meal_order: number; servings: number; group: string | null }[];
  foodsByGroup: Record<string, FoodOut[]>;
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function t(locale: "es" | "en", es: string, en: string): string {
  return locale === "en" ? en : es;
}

function fmtDate(d: string | null, locale: "es" | "en"): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(locale === "en" ? "en-US" : "es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

export function PlanViewClient({ token }: { token: string }) {
  const { locale } = useLocale();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound" | "expired" | "error">(
    "loading",
  );
  const [swaps, setSwaps] = useState<Record<string, string>>({});
  const [modalGroup, setModalGroup] = useState<GrupoKey | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const storageKey = `plan_swaps_${token}`;

  // Load persisted swaps.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setSwaps(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
  }, [storageKey]);

  // Fetch plan data.
  useEffect(() => {
    let alive = true;
    fetch(`/api/plan-view/${token}`)
      .then(async (r) => {
        if (!alive) return;
        if (r.status === 404) return setStatus("notfound");
        if (r.status === 410) return setStatus("expired");
        if (!r.ok) return setStatus("error");
        const json = (await r.json()) as ApiResponse;
        setData(json);
        setStatus("ready");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, [token]);

  const persistSwaps = useCallback(
    (next: Record<string, string>) => {
      setSwaps(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  // Foods available for each clinical group.
  const foodsForGroup = useCallback(
    (group: GrupoKey): FoodOut[] => {
      if (!data) return [];
      const dbKeys = CLINICAL_TO_DB_GROUPS[group] ?? [];
      const out: FoodOut[] = [];
      for (const k of dbKeys) out.push(...(data.foodsByGroup[k] ?? []));
      return out;
    },
    [data],
  );

  const groups: Equivalentes | null = data?.plan.equivalentes?.groups ?? null;

  const activeGroups = useMemo(
    () => GRUPO_KEYS.filter((k) => (groups?.[k] ?? 0) > 0),
    [groups],
  );

  const dayMacros = useMemo(() => {
    if (groups) return equivalentesToMacros(groups);
    const eq = data?.plan.equivalentes;
    if (eq)
      return {
        kcal: Math.round(eq.kcalTarget),
        proteinG: Math.round(eq.proteinG),
        carbsG: Math.round(eq.carbsG),
        fatG: Math.round(eq.fatG),
      };
    return { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  }, [groups, data]);

  const selectedFood = useCallback(
    (group: GrupoKey): FoodOut | null => {
      const list = foodsForGroup(group);
      if (list.length === 0) return null;
      const chosen = swaps[group];
      return list.find((f) => f.id === chosen) ?? list[0];
    },
    [foodsForGroup, swaps],
  );

  function chooseFood(group: GrupoKey, foodId: string) {
    persistSwaps({ ...swaps, [group]: foodId });
    setModalGroup(null);
    setToast(
      t(
        locale,
        "✓ Cambiado. Los macros se mantienen iguales.",
        "✓ Swapped. Your macros stay the same.",
      ),
    );
  }

  function copyList() {
    if (!groups) return;
    const lines: string[] = [];
    lines.push(data?.plan.title ?? "");
    for (const g of activeGroups) {
      const n = groups[g] ?? 0;
      const f = selectedFood(g);
      if (!f) continue;
      const name = locale === "en" ? f.en : f.es;
      const serving = locale === "en" ? f.serving_en : f.serving_es;
      lines.push(
        `${CLINICAL_GROUP_META[g].emoji} ${n} ${t(locale, "equiv", "equiv")} ${
          CLINICAL_GROUP_META[g][locale]
        } — ${name} (${n} × ${serving})`,
      );
    }
    navigator.clipboard
      ?.writeText(lines.filter(Boolean).join("\n"))
      .then(() => setToast(t(locale, "✓ Lista copiada", "✓ List copied")))
      .catch(() => setToast(t(locale, "No se pudo copiar", "Could not copy")));
  }

  if (status === "loading") {
    return (
      <Centered>
        <span className="spinner" />
        <p className="mt-3 text-sm" style={{ color: "var(--ink-muted)" }}>
          {t(locale, "Cargando tu plan…", "Loading your plan…")}
        </p>
      </Centered>
    );
  }
  if (status === "notfound" || status === "error") {
    return (
      <Centered>
        <p className="font-display" style={{ fontSize: 24, color: "var(--ink-strong)" }}>
          {t(locale, "Plan no encontrado", "Plan not found")}
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
          {t(
            locale,
            "El enlace no es válido. Pide uno nuevo a tu nutriólogo.",
            "This link is not valid. Ask your nutritionist for a new one.",
          )}
        </p>
      </Centered>
    );
  }
  if (status === "expired") {
    return (
      <Centered>
        <p className="font-display" style={{ fontSize: 24, color: "var(--ink-strong)" }}>
          {t(locale, "Enlace expirado", "Link expired")}
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
          {t(
            locale,
            "Este enlace ha caducado. Pide uno nuevo a tu nutriólogo.",
            "This link has expired. Ask your nutritionist for a new one.",
          )}
        </p>
      </Centered>
    );
  }

  const plan = data!.plan;
  const macroBars = [
    { label: t(locale, "Proteína", "Protein"), g: dayMacros.proteinG, kcal: dayMacros.proteinG * 4, color: "#c9a961" },
    { label: t(locale, "Carbos", "Carbs"), g: dayMacros.carbsG, kcal: dayMacros.carbsG * 4, color: "#7fae8e" },
    { label: t(locale, "Grasa", "Fat"), g: dayMacros.fatG, kcal: dayMacros.fatG * 9, color: "#d98c5f" },
  ];
  const macroTotalKcal = macroBars.reduce((a, b) => a + b.kcal, 0) || 1;

  return (
    <main
      className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-24 pt-8"
      style={{ background: "var(--surface-base)" }}
    >
      {/* Header */}
      <header className="text-center">
        <p className="eyebrow" style={{ color: "var(--gold-600)" }}>
          {t(locale, "Plan de Nutrición", "Nutrition Plan")}
        </p>
        <h1
          className="font-display mt-2"
          style={{ fontSize: 30, color: "var(--ink-strong)", letterSpacing: "-0.02em", lineHeight: 1.05 }}
        >
          {plan.title}
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
          {plan.patient_first_name ? `${plan.patient_first_name} · ` : ""}
          {fmtDate(plan.valid_from, locale)}
          {plan.valid_until ? ` → ${fmtDate(plan.valid_until, locale)}` : ""}
        </p>
      </header>

      {/* Day summary */}
      <section className="card-luxe mt-6 p-5">
        <p className="eyebrow mb-3" style={{ color: "var(--gold-600)" }}>
          {t(locale, "Resumen del día", "Daily summary")}
        </p>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { l: "kcal", v: dayMacros.kcal },
            { l: t(locale, "Pro", "Pro"), v: `${dayMacros.proteinG}g` },
            { l: t(locale, "Carb", "Carb"), v: `${dayMacros.carbsG}g` },
            { l: t(locale, "Grasa", "Fat"), v: `${dayMacros.fatG}g` },
          ].map((m) => (
            <div key={m.l}>
              <p className="font-display" style={{ fontSize: 22, color: "var(--ink-strong)" }}>
                {m.v}
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--ink-subtle)" }}>
                {m.l}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {macroBars.map((b) => (
            <div key={b.label}>
              <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--ink-muted)" }}>
                <span>{b.label}</span>
                <span className="font-mono-tabular">{b.g}g</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-muted)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.round((b.kcal / macroTotalKcal) * 100)}%`, background: b.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Exchange sections */}
      {activeGroups.length === 0 ? (
        <div className="card-luxe mt-6 p-6 text-center" style={{ borderStyle: "dashed" }}>
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            {t(
              locale,
              "Este plan aún no tiene una distribución de equivalentes.",
              "This plan does not have an exchange distribution yet.",
            )}
          </p>
        </div>
      ) : (
        <section className="mt-6 space-y-3">
          <p className="eyebrow" style={{ color: "var(--gold-600)" }}>
            {t(locale, "Tus equivalentes del día", "Your daily exchanges")}
          </p>
          {activeGroups.map((g) => {
            const n = groups![g] ?? 0;
            const food = selectedFood(g);
            const meta = CLINICAL_GROUP_META[g];
            const serving = food ? (locale === "en" ? food.serving_en : food.serving_es) : "";
            return (
              <div key={g} className="card-luxe p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--gold-600)" }}>
                      {meta.emoji} {n} {t(locale, "equiv", "equiv")} · {meta[locale]}
                    </p>
                    {food ? (
                      <p className="mt-1 truncate" style={{ color: "var(--ink-strong)", fontSize: 16 }}>
                        {locale === "en" ? food.en : food.es}
                        <span className="ml-2 font-mono-tabular text-xs" style={{ color: "var(--ink-subtle)" }}>
                          {n} × {serving}
                        </span>
                      </p>
                    ) : (
                      <p className="mt-1 text-sm" style={{ color: "var(--ink-subtle)" }}>
                        {t(locale, "Sin opciones", "No options")}
                      </p>
                    )}
                  </div>
                  {food && (
                    <button
                      type="button"
                      onClick={() => setModalGroup(g)}
                      className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium"
                      style={{ background: "rgba(201,169,97,0.16)", color: "var(--gold-700)" }}
                    >
                      ↔ {t(locale, "Cambiar", "Swap")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Actions */}
      <div className="mt-8 flex flex-wrap gap-3">
        <a href={`/api/plans/${plan.id}/pdf`} download className="btn btn-brand">
          📥 {t(locale, "Descargar PDF", "Download PDF")}
        </a>
        {activeGroups.length > 0 && (
          <button type="button" onClick={copyList} className="btn btn-ghost">
            📋 {t(locale, "Copiar lista", "Copy list")}
          </button>
        )}
      </div>

      <div className="mt-10">
        <PoweredByAnthroscope />
      </div>

      {/* Swap modal / bottom sheet */}
      {modalGroup && (
        <SwapModal
          group={modalGroup}
          equivalents={groups![modalGroup] ?? 0}
          foods={foodsForGroup(modalGroup)}
          currentId={selectedFood(modalGroup)?.id ?? null}
          locale={locale}
          onClose={() => setModalGroup(null)}
          onSelect={(id) => chooseFood(modalGroup, id)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-5 left-1/2 z-[80] -translate-x-1/2 rounded-full px-4 py-2 text-sm shadow-lg"
          style={{ background: "var(--ink-strong)", color: "var(--surface-base)" }}
          role="status"
        >
          {toast}
        </div>
      )}
    </main>
  );
}

function SwapModal({
  group,
  equivalents,
  foods,
  currentId,
  locale,
  onClose,
  onSelect,
}: {
  group: GrupoKey;
  equivalents: number;
  foods: FoodOut[];
  currentId: string | null;
  locale: "es" | "en";
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(currentId);
  const meta = CLINICAL_GROUP_META[group];
  const perEquiv = EQUIVALENTES_GRUPOS[group];
  const currentFood = foods.find((f) => f.id === currentId);

  const sorted = useMemo(() => {
    const q = normalize(query);
    const filtered = q
      ? foods.filter((f) => normalize(`${f.es} ${f.en}`).includes(q))
      : foods.slice();
    filtered.sort((a, b) => {
      if (a.id === currentId) return -1;
      if (b.id === currentId) return 1;
      const an = locale === "en" ? a.en : a.es;
      const bn = locale === "en" ? b.en : b.es;
      return an.localeCompare(bn);
    });
    return filtered;
  }, [query, foods, currentId, locale]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose} />
      <div
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl sm:rounded-2xl"
        style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="border-b p-4" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="font-display" style={{ fontSize: 18, color: "var(--ink-strong)" }}>
            {t(locale, "Cambiar", "Swap")}: {currentFood ? (locale === "en" ? currentFood.en : currentFood.es) : ""}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--ink-muted)" }}>
            {equivalents} {t(locale, "equiv", "equiv")} {meta[locale]} ·{" "}
            {t(locale, "todos tienen los mismos macros", "all share the same macros")}
          </p>
          <p className="mt-1 font-mono-tabular text-[11px]" style={{ color: "var(--gold-700)" }}>
            {t(locale, "Cada opción", "Each option")} = {perEquiv.kcal} kcal · {perEquiv.carbs}g{" "}
            {t(locale, "carb", "carb")} · {perEquiv.protein}g {t(locale, "pro", "pro")} · {perEquiv.fat}g{" "}
            {t(locale, "grasa", "fat")}
          </p>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(locale, "Buscar…", "Search…")}
            className="input mt-3"
            aria-label={t(locale, "Buscar alimento", "Search food")}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {sorted.map((f) => {
            const active = picked === f.id;
            const isCurrent = f.id === currentId;
            const serving = locale === "en" ? f.serving_en : f.serving_es;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setPicked(f.id)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left"
                style={{ background: active ? "rgba(201,169,97,0.14)" : "transparent" }}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span aria-hidden style={{ color: "var(--gold-600)" }}>
                    {active ? "●" : "○"}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate" style={{ color: "var(--ink-strong)", fontSize: 15 }}>
                      {locale === "en" ? f.en : f.es}
                      {isCurrent && (
                        <span className="ml-2 text-[11px]" style={{ color: "var(--gold-700)" }}>
                          ✓ {t(locale, "actual", "current")}
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs" style={{ color: "var(--ink-subtle)" }}>
                      {equivalents} × {serving}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
          {sorted.length === 0 && (
            <p className="p-4 text-center text-sm" style={{ color: "var(--ink-subtle)" }}>
              {t(locale, "Sin resultados", "No results")}
            </p>
          )}
        </div>

        <div className="flex gap-3 border-t p-4" style={{ borderColor: "var(--border-subtle)" }}>
          <button
            type="button"
            className="btn btn-brand flex-1"
            disabled={!picked}
            onClick={() => picked && onSelect(picked)}
          >
            {t(locale, "Seleccionar", "Select")}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t(locale, "Cancelar", "Cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ background: "var(--surface-base)" }}
    >
      {children}
    </main>
  );
}
