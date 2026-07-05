"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { FoodSearch, type FoodSearchItem } from "@/components/FoodSearch";
import { addPlanMeal, removePlanMeal } from "@/app/dashboard/plans/actions";

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

export function MealBuilder({
  planId,
  foods,
  items,
}: {
  planId: string;
  foods: FoodSearchItem[];
  items: MealItem[];
}) {
  const { locale } = useLocale();
  const router = useRouter();
  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const bySlot = useMemo(() => {
    const map = new Map<string, MealItem[]>();
    for (const it of items) {
      const arr = map.get(it.meal_name) ?? [];
      arr.push(it);
      map.set(it.meal_name, arr);
    }
    return map;
  }, [items]);

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

  return (
    <div className="rise rise-3">
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
                  style={{ fontSize: 20, color: "var(--brand-900)", letterSpacing: "-0.015em" }}
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
                      <span className="min-w-0" style={{ color: "var(--ink-strong)" }}>
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
                  style={{ background: "rgba(201,169,97,0.16)", color: "var(--gold-700)" }}
                >
                  + {t(locale, "Agregar alimento", "Add food")}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
