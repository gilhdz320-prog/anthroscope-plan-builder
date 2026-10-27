"use client";

import { useEffect, useRef, useState } from "react";
import { deriveMetrics, TONE_COLORS, type Metric } from "@/lib/anthropometry";

/**
 * Campos de antropometría del alta de paciente.
 *
 * Además de capturar los datos, calcula en vivo los índices derivados
 * (IMC, cintura/cadera, cintura/altura, % grasa estimado). Lee el sexo y la
 * fecha de nacimiento del resto del formulario para poder clasificar el riesgo.
 */
export function AnthropometryFields() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState({
    weight_kg: "",
    height_cm: "",
    body_fat_pct: "",
    waist_cm: "",
    hip_cm: "",
  });
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

  const set = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [key]: event.target.value }));

  const metrics: Metric[] = deriveMetrics({
    weightKg: values.weight_kg,
    heightCm: values.height_cm,
    waistCm: values.waist_cm,
    hipCm: values.hip_cm,
    bodyFatPct: values.body_fat_pct,
    birthDate: siblings.birthDate,
    sex: siblings.sex,
  });

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
            El % de grasa estimado es una referencia poblacional (Deurenberg), no
            sustituye una medición. Los pliegues ISAK irán en una sección aparte.
          </p>
        </div>
      )}
    </div>
  );
}
