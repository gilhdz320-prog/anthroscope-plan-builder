"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { FoodSearch, type FoodSearchItem } from "@/components/FoodSearch";
import { addPlanMeal, removePlanMeal } from "@/app/dashboard/plans/actions";
import {
  EQUIVALENTES_GRUPOS,
  GRUPO_KEYS,
  type Equivalentes,
  type GrupoKey,
} from "@/lib/equivalentes";
import { CLINICAL_TO_DB_GROUPS, CLINICAL_GROUP_META } from "@/lib/food-groups";

export interface MealItem {
  id: string;
  meal_name: string;
  meal_order: number;
  servings: number;
  food_es: string;
  food_en: string;
  serving_es: string;
  serving_en: string;
  kcal: number;
  /** DB group_key of the equivalent food */
  group: string;
  /** equivalent_id so we can look up the food in the catalog */
  equivalent_id: string | null;
}

const MEAL_SLOTS: { name: string; order: number; en: string }[] = [
  { name: "Desayuno", order: 1, en: "Breakfast" },
  { name: "Colación matutina", order: 2, en: "Morning snack" },
  { name: "Comida", order: 3, en: "Lunch" },
  { name: "Colación vespertina", order: 4, en: "Afternoon snack" },
  { name: "Cena", order: 5, en: "Dinner" },
];

function t(locale: "es" | "en", es: string, en: string) {
  return locale === "en" ? en : es;
}

/** Map a DB group_key to its clinical GrupoKey */
function dbGroupToClinical(dbGroup: string): GrupoKey | null {
  for (const clinicalKey of GRUPO_KEYS) {
    const dbKeys = CLINICAL_TO_DB_GROUPS[clinicalKey] ?? [];
    if (dbKeys.includes(dbGroup)) return clinicalKey;
  }
  return null;
}

/** Color for progress bar based on ratio */
function progressColor(ratio: number): string {
  if (ratio >= 1) return "var(--brand-600, #c9a961)";
  if (ratio >= 0.7) return "var(--brand-400, #e2c97e)";
  return "rgba(201,169,97,0.35)";
}

export function MealBuilder({
  planId,
  foods,
  items,
  targetGroups,
}: {
  planId: string;
  foods: FoodSearchItem[];
  items: MealItem[];
  /** The equivalentes distribution from the plan (if set) */
  targetGroups?: Equivalentes | null;
}) {
  const { locale } = useLocale();
  const router = useRouter();
  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showRestantes, setShowRestantes] = useState(true);

  const bySlot = useMemo(() => {
    const map = new Map<string, MealItem[]>();
    for (const it of items) {
      const arr = map.get(it.meal_name) ?? [];
      arr.push(it);
      map.set(it.meal_name, arr);
    }
    return map;
  }, [items]);

  /** Count assigned equivalentes per clinical group from current plan items */
  const assignedGroups = useMemo<Equivalentes>(() => {
    const counts = GRUPO_KEYS.reduce((acc, k) => {
      acc[k] = 0;
      return acc;
    }, {} as Equivalentes);

    // Build a lookup: equivalent_id → FoodSearchItem (for group_key)
    const foodById = new Map<string, FoodSearchItem>();
    for (const f of foods) foodById.set(f.id, f);

    for (const it of items) {
      const dbGroup = it.group;
      if (!dbGroup) continue;
      const clinicalKey = dbGroupToClinical(dbGroup);
      if (clinicalKey) {
        counts[clinicalKey] += it.servings || 1;
      }
    }
    return counts;
  }, [items, foods]);

  function handleAdd(slot: { name: string; order: number }, food: FoodSearchItem) {
    startTransition(async () => {
      const res = await addPlanMeal(planId, slot.name, slot.order, food.id, 1);
      if (!res.error) {
        setOpenSlot(null);
        router.refresh();
      }
    });
  }

  function handleRemove(mealId: string) {
    setBusyId(mealId);
    startTransition(async () => {
      await removePlanMeal(planId, mealId);
      setBusyId(null);
      router.refresh();
    });
  }

  const hasTarget = targetGroups != null;

  return (
    <div className="rise rise-3 space-y-6">
      {/* ── Equivalentes restantes panel ─────────────────────────── */}
      {hasTarget && (
        <div className="card-luxe p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <p className="eyebrow">
              {t(locale, "Equivalentes restantes", "Remaining equivalents")}
            </p>
            <button
              type="button"
              onClick={() => setShowRestantes((v) => !v)}
              className="text-xs"
              style={{ color: "var(--ink-subtle)" }}
            >
              {showRestantes
                ? t(locale, "Ocultar", "Hide")
                : t(locale, "Mostrar", "Show")}
            </button>
          </div>

          {showRestantes && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {GRUPO_KEYS.map((key) => {
                const meta = CLINICAL_GROUP_META[key];
                const target = targetGroups![key] ?? 0;
                const assigned = assignedGroups[key] ?? 0;
                const remaining = Math.max(0, target - assigned);
                const over = assigned > target && target > 0;
                const ratio = target > 0 ? Math.min(assigned / target, 1) : 0;
                const grupoKcal = EQUIVALENTES_GRUPOS[key].kcal;

                return (
                  <div
                    key={key}
                    className="rounded-xl p-3"
                    style={{
                      background: over
                        ? "rgba(192,57,43,0.06)"
                        : "rgba(201,169,97,0.07)",
                      border: over
                        ? "1px solid rgba(192,57,43,0.18)"
                        : "1px solid var(--border-subtle)",
                    }}
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      <span style={{ fontSize: 14 }}>{meta.emoji}</span>
                      <span
                        className="truncate text-[10px] uppercase tracking-[0.12em]"
                        style={{ color: "var(--ink-subtle)" }}
                      >
                        {locale === "en" ? meta.en : meta.es}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div
                      className="mb-2 h-1.5 w-full overflow-hidden rounded-full"
                      style={{ background: "rgba(201,169,97,0.15)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.round(ratio * 100)}%`,
                          background: over
                            ? "var(--danger, #c0392b)"
                            : progressColor(ratio),
                        }}
                      />
                    </div>

                    <div className="flex items-baseline justify-between gap-1">
                      <span
                        className="font-display"
                        style={{
                          fontSize: 22,
                          letterSpacing: "-0.03em",
                          color: over
                            ? "var(--danger, #c0392b)"
                            : remaining === 0
                            ? "var(--brand-600, #c9a961)"
                            : "var(--ink-strong)",
                        }}
                      >
                        {over ? `+${assigned - target}` : remaining}
                      </span>
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--ink-subtle)" }}
                      >
                        {over
                          ? t(locale, "exceso", "over")
                          : remaining === 0
                          ? t(locale, "completo", "done")
                          : t(locale, "restantes", "left")}
                      </span>
                    </div>

                    <div
                      className="mt-0.5 text-[10px]"
                      style={{ color: "var(--ink-muted)" }}
                    >
                      {assigned}/{target}{" "}
                      {t(locale, "porc.", "srv.")} · {grupoKcal * target}{" "}
                      kcal
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Meal slots ───────────────────────────────────────────── */}
      <div>
        <div className="mb-4 flex items-baseline justify-between">
          <p className="eyebrow">{t(locale, "Editar comidas", "Edit meals")}</p>
          {pending && (
            <span className="text-xs" style={{ color: "var(--ink-subtle)" }}>
              {t(locale, "Guardando…", "Saving…")}
            </span>
          )}
        </div>

        <div className="space-y-4">
          {MEAL_SLOTS.map((slot) => {
            const slotItems = bySlot.get(slot.name) ?? [];
            const isOpen = openSlot === slot.name;
            const slotKcal = slotItems.reduce(
              (a, i) => a + i.kcal * (i.servings || 1),
              0,
            );
            return (
              <div key={slot.name} className="card-luxe p-5">
                <div
                  className="flex items-baseline justify-between border-b pb-3"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <h3
                    className="font-display italic"
                    style={{
                      fontSize: 20,
                      color: "var(--brand-900)",
                      letterSpacing: "-0.015em",
                    }}
                  >
                    {t(locale, slot.name, slot.en)}
                  </h3>
                  <span
                    className="font-mono-tabular text-xs"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {Math.round(slotKcal)} kcal
                  </span>
                </div>

                {slotItems.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {slotItems.map((it) => (
                      <li
                        key={it.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span
                          className="min-w-0"
                          style={{ color: "var(--ink-strong)" }}
                        >
                          <span className="truncate">
                            {locale === "en" ? it.food_en : it.food_es}
                          </span>
                          <span
                            className="ml-2 font-mono-tabular text-xs"
                            style={{ color: "var(--ink-subtle)" }}
                          >
                            {it.servings !== 1 ? `${it.servings}× · ` : ""}
                            {locale === "en" ? it.serving_en : it.serving_es}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemove(it.id)}
                          disabled={busyId === it.id}
                          className="shrink-0 rounded-md px-2 py-1 text-xs"
                          style={{ color: "var(--danger, #c0392b)" }}
                          aria-label={t(locale, "Quitar", "Remove")}
                        >
                          {busyId === it.id ? "…" : "✕"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {isOpen ? (
                  <div className="mt-4">
                    <FoodSearch
                      foods={foods}
                      autoFocus
                      onSelect={(f) => handleAdd(slot, f)}
                    />
                    <button
                      type="button"
                      onClick={() => setOpenSlot(null)}
                      className="mt-3 text-xs"
                      style={{ color: "var(--ink-subtle)" }}
                    >
                      {t(locale, "Cancelar", "Cancel")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpenSlot(slot.name)}
                    className="mt-3 rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{
                      background: "rgba(201,169,97,0.16)",
                      color: "var(--gold-700)",
                    }}
                  >
                    + {t(locale, "Agregar alimento", "Add food")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
