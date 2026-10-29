"use client";

import { useEffect, useRef, useState } from "react";
import {
  deriveMetrics,
  ISAK_FOLDS,
  ISAK_GIRTHS,
  TONE_COLORS,
  type FoldMap,
  type Metric,
} from "@/lib/anthropometry";

/**
 * Campos de antropometría del alta de paciente.
 *
 * - Básicos: peso, talla, %grasa, cintura, cadera.
 * - ISAK opcional: 8 pliegues + 4 perímetros (desplegable, cerrado por defecto).
 *
 * Calcula en vivo IMC, cintura/cadera, cintura/altura, suma de pliegues y
 * %grasa por Durnin-Womersley. Lee sexo y fecha de nacimiento del resto del
 * formulario para poder clasificar el riesgo.
 */
export function AnthropometryFields({
  defaults = {},
}: {
  /** Valores iniciales (modo edición). Claves planas: weight_kg, fold_triceps_mm… */
  defaults?: Record<string, unknown>;
}) {
  const initial = (key: string) => {
    const raw = defaults[key];
    return raw == null ? "" : String(raw);
  };

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState({
    weight_kg: initial("weight_kg"),
    height_cm: initial("height_cm"),
    body_fat_pct: initial("body_fat_pct"),
    waist_cm: initial("waist_cm"),
    hip_cm: initial("hip_cm"),
  });
  const [folds, setFolds] = useState<Record<string, string>>(
    Object.fromEntries(
      ISAK_FOLDS.map((fold) => [fold.key, initial(`fold_${fold.key}_mm`)]).filter(
        ([, value]) => value !== "",
      ),
    ),
  );
  const [girths, setGirths] = useState<Record<string, string>>(
    Object.fromEntries(
      ISAK_GIRTHS.map((girth) => [girth.key, initial(girth.key)]).filter(
        ([, value]) => value !== "",
      ),
    ),
  );
  const [siblings, setSiblings] = useState<{ sex: string; birthDate: string }>({
    sex: "",
    birthDate: "",
  });

  // Escucha los campos de otras secciones (sexo, fecha de nacimiento) sin
  // convertirlos en componentes controlados.
  useEffect(() => {
    const form = wrapperRef.current?.closest("form");
    if (!form) return;

    const sync = () => {
      const data = new FormData(form);
      setSiblings({
        sex: String(data.get("sex") ?? ""),
        birthDate: String(data.get("birth_date") ?? ""),
      });
    };

    sync();
    form.addEventListener("input", sync);
    form.addEventListener("change", sync);
    return () => {
      form.removeEventListener("input", sync);
      form.removeEventListener("change", sync);
    };
  }, []);

  const set =
    (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [key]: event.target.value }));

  const setFold =
    (key: string) => (event: React.ChangeEvent<HTMLInputElement>) =>
      setFolds((prev) => ({ ...prev, [key]: event.target.value }));

  const setGirth =
    (key: string) => (event: React.ChangeEvent<HTMLInputElement>) =>
      setGirths((prev) => ({ ...prev, [key]: event.target.value }));

  const metrics: Metric[] = deriveMetrics({
    weightKg: values.weight_kg,
    heightCm: values.height_cm,
    waistCm: values.waist_cm,
    hipCm: values.hip_cm,
    bodyFatPct: values.body_fat_pct,
    birthDate: siblings.birthDate,
    sex: siblings.sex,
    folds: folds as FoldMap,
  });

  const foldsCount = ISAK_FOLDS.filter((fold) => folds[fold.key]).length;

  return (
    <div ref={wrapperRef} className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="weight_kg" className="label">Peso (kg)</label>
          <input
            id="weight_kg"
            name="weight_kg"
            type="number"
            step="0.1"
            inputMode="decimal"
            className="input"
            value={values.weight_kg}
            onChange={set("weight_kg")}
          />
        </div>
        <div>
          <label htmlFor="height_cm" className="label">Altura (cm)</label>
          <input
            id="height_cm"
            name="height_cm"
            type="number"
            step="0.1"
            inputMode="decimal"
            className="input"
            value={values.height_cm}
            onChange={set("height_cm")}
          />
        </div>
        <div>
          <label htmlFor="body_fat_pct" className="label">% Grasa</label>
          <input
            id="body_fat_pct"
            name="body_fat_pct"
            type="number"
            step="0.1"
            inputMode="decimal"
            className="input"
            value={values.body_fat_pct}
            onChange={set("body_fat_pct")}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="waist_cm" className="label">Cintura (cm)</label>
          <input
            id="waist_cm"
            name="waist_cm"
            type="number"
            step="0.1"
            inputMode="decimal"
            className="input"
            value={values.waist_cm}
            onChange={set("waist_cm")}
          />
        </div>
        <div>
          <label htmlFor="hip_cm" className="label">Cadera (cm)</label>
          <input
            id="hip_cm"
            name="hip_cm"
            type="number"
            step="0.1"
            inputMode="decimal"
            className="input"
            value={values.hip_cm}
            onChange={set("hip_cm")}
          />
        </div>
      </div>

      {/* ISAK opcional */}
      <details className="rounded-lg p-4" style={{ background: "var(--surface-sunken, #141414)" }}>
        <summary className="cursor-pointer text-xs" style={{ color: "var(--ink-muted)" }}>
          Medidas ISAK (opcional) — 8 pliegues y 4 perímetros
          {foldsCount > 0 && (
            <span style={{ color: "var(--gold)" }}> · {foldsCount}/8 capturados</span>
          )}
        </summary>

        <p className="mt-3 text-[11px]" style={{ color: "var(--ink-subtle)" }}>
          Pliegues en <strong>milímetros</strong> y perímetros en{" "}
          <strong>centímetros</strong>. Con los 4 sitios de Durnin-Womersley
          (bíceps, tríceps, subescapular, cresta ilíaca) se calcula el % de grasa.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {ISAK_FOLDS.map((fold) => (
            <div key={fold.key}>
              <label htmlFor={`fold_${fold.key}_mm`} className="label text-[11px]">
                {fold.label} (mm)
              </label>
              <input
                id={`fold_${fold.key}_mm`}
                name={`fold_${fold.key}_mm`}
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder={fold.hint}
                className="input"
                value={folds[fold.key] ?? ""}
                onChange={setFold(fold.key)}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {ISAK_GIRTHS.map((girth) => (
            <div key={girth.key}>
              <label htmlFor={girth.key} className="label text-[11px]">
                {girth.label} (cm)
              </label>
              <input
                id={girth.key}
                name={girth.key}
                type="number"
                step="0.1"
                inputMode="decimal"
                className="input"
                value={girths[girth.key] ?? ""}
                onChange={setGirth(girth.key)}
              />
            </div>
          ))}
        </div>
      </details>

      {metrics.length > 0 && (
        <div
          className="rounded-lg p-4"
          style={{ background: "var(--surface-sunken, #141414)", border: "1px solid var(--border-subtle, #2a2a2a)" }}
        >
          <p className="eyebrow" style={{ color: "var(--gold)" }}>
            Calculado automáticamente
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.key}>
                <dt className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ink-subtle)" }}>
                  {metric.label}
                </dt>
                <dd
                  className="mt-0.5 text-lg"
                  style={{
                    fontFamily: "var(--font-cormorant), ui-serif, serif",
                    color: "var(--ink-strong)",
                    lineHeight: 1.1,
                  }}
                >
                  {metric.value}
                </dd>
                {metric.hint && (
                  <dd className="text-[10px]" style={{ color: TONE_COLORS[metric.tone] }}>
                    {metric.hint}
                  </dd>
                )}
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[10px]" style={{ color: "var(--ink-subtle)" }}>
            El % de grasa por pliegues usa Durnin-Womersley (1974) + Siri. La
            estimación por IMC (Deurenberg) solo aparece si no hay medición.
          </p>
        </div>
      )}
    </div>
  );
}
