"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { DB_GROUP_META } from "@/lib/food-groups";

export interface FoodSearchItem {
  id: string;
  es: string;
  en: string;
  group: string; // DB group_key
  serving: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Real-time, debounced search across an in-memory food catalog.
 * Results are grouped by exchange category and capped at `maxResults`.
 * Data-source agnostic: the caller supplies `foods`.
 */
export function FoodSearch({
  foods,
  onSelect,
  maxResults = 20,
  autoFocus = false,
  placeholder,
}: {
  foods: FoodSearchItem[];
  onSelect: (food: FoodSearchItem) => void;
  maxResults?: number;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const results = useMemo(() => {
    const q = normalize(debounced);
    if (q.length < 2) return [] as FoodSearchItem[];
    const terms = q.split(/\s+/);
    const matched = foods.filter((f) => {
      const hay = normalize(`${f.es} ${f.en} ${DB_GROUP_META[f.group]?.es ?? ""}`);
      return terms.every((t) => hay.includes(t));
    });
    return matched.slice(0, maxResults);
  }, [debounced, foods, maxResults]);

  // Group results by DB group_key, preserving catalog order.
  const grouped = useMemo(() => {
    const map = new Map<string, FoodSearchItem[]>();
    for (const f of results) {
      const arr = map.get(f.group) ?? [];
      arr.push(f);
      map.set(f.group, arr);
    }
    return [...map.entries()];
  }, [results]);

  const ph =
    placeholder ?? (locale === "en" ? "Search food..." : "Buscar alimento...");

  return (
    <div>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm"
          style={{ color: "var(--ink-subtle)" }}
          aria-hidden
        >
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={ph}
          className="input"
          style={{ paddingLeft: 34 }}
          aria-label={ph}
        />
      </div>

      {debounced.trim().length >= 2 && (
        <div className="mt-3">
          {results.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--ink-subtle)" }}>
              {locale === "en"
                ? "No foods match your search."
                : "Ningún alimento coincide con tu búsqueda."}
            </p>
          ) : (
            <div className="space-y-4">
              {grouped.map(([groupKey, items]) => {
                const meta = DB_GROUP_META[groupKey];
                return (
                  <div key={groupKey}>
                    <p
                      className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: "var(--gold)" }}
                    >
                      {meta?.emoji} {meta ? meta[locale] : groupKey}
                    </p>
                    <ul
                      className="overflow-hidden rounded-lg"
                      style={{ border: "1px solid var(--border-subtle, #2a2a2a)" }}
                    >
                      {items.map((f) => (
                        <li key={f.id}>
                          <button
                            type="button"
                            onClick={() => onSelect(f)}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-[rgba(201,169,97,0.08)]"
                            style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                          >
                            <span className="min-w-0">
                              <span
                                className="block truncate text-sm"
                                style={{ color: "var(--ink-strong)" }}
                              >
                                {locale === "en" ? f.en : f.es}
                              </span>
                              <span
                                className="block truncate text-xs"
                                style={{ color: "var(--ink-subtle)" }}
                              >
                                {locale === "en" ? f.es : f.en} · {f.serving}
                              </span>
                            </span>
                            <span
                              className="shrink-0 font-mono-tabular text-[11px]"
                              style={{ color: "var(--ink-muted)" }}
                            >
                              {Math.round(f.kcal)} kcal · P{Math.round(f.protein)} ·
                              C{Math.round(f.carbs)} · G{Math.round(f.fat)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FoodSearch;
