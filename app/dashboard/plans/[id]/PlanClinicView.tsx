"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useLocale } from "@/components/LocaleProvider";
import {
  EQUIVALENTES_GRUPOS,
  GRUPO_KEYS,
  type Equivalentes,
  type GrupoKey,
} from "@/lib/equivalentes";
import { CLINICAL_GROUP_META } from "@/lib/food-groups";

export interface ClinicFoodOption {
  es: string;
  en: string;
  serving_es: string;
  serving_en: string;
}

export interface ClinicPatient {
  first_name: string;
  last_name: string;
  sex: string | null;
  age: number | null;
  sport: string | null;
  goal: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  body_fat_pct: number | null;
  lean_mass_kg: number | null;
}

export interface ClinicRequirements {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
  waterMl: number;
}

export interface ClinicData {
  planTitle: string;
  dateLabel: string;
  patient: ClinicPatient;
  requirements: ClinicRequirements;
  groups: Equivalentes | null;
  foodsByGroup: Partial<Record<GrupoKey, ClinicFoodOption[]>>;
  nutritionistName: string | null;
}

interface MealSlot {
  key: string;
  es: string;
  en: string;
  time: string;
  emoji: string;
  pct: number;
}

// Standard clinical distribution across the day (must sum to 1).
const MEAL_SLOTS: MealSlot[] = [
  { key: "desayuno", es: "Desayuno", en: "Breakfast", time: "7:00", emoji: "🌅", pct: 0.25 },
  { key: "colacion_am", es: "Colación AM", en: "AM Snack", time: "10:00", emoji: "☀️", pct: 0.1 },
  { key: "comida", es: "Comida", en: "Lunch", time: "14:00", emoji: "🍽️", pct: 0.3 },
  { key: "colacion_pm", es: "Colación PM", en: "PM Snack", time: "17:00", emoji: "🍎", pct: 0.1 },
  { key: "cena", es: "Cena", en: "Dinner", time: "20:00", emoji: "🌙", pct: 0.25 },
];

function t(locale: "es" | "en", es: string, en: string): string {
  return locale === "en" ? en : es;
}

function nf(n: number): string {
  return new Intl.NumberFormat("es-MX").format(Math.round(n));
}

// Spread N whole equivalents across the meal slots weighted by each slot's
// percentage, using largest-remainder rounding so the parts sum back to N.
function distribute(total: number): number[] {
  if (total <= 0) return MEAL_SLOTS.map(() => 0);
  const raw = MEAL_SLOTS.map((s) => total * s.pct);
  const base = raw.map((r) => Math.floor(r));
  let remainder = total - base.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (remainder <= 0) break;
    base[i] += 1;
    remainder -= 1;
  }
  return base;
}

const goalLabel: Record<string, { es: string; en: string }> = {
  weight_loss: { es: "Pérdida de peso", en: "Weight loss" },
  maintenance: { es: "Mantenimiento", en: "Maintenance" },
  muscle_gain: { es: "Ganancia muscular", en: "Muscle gain" },
  performance: { es: "Rendimiento deportivo", en: "Sports performance" },
};

export function PlanClinicView({ data }: { data: ClinicData }) {
  const { locale } = useLocale();
  const [signatureDate, setSignatureDate] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const { patient, requirements: req, groups, foodsByGroup } = data;

  const activeGroups = useMemo(
    () => GRUPO_KEYS.filter((k) => (groups?.[k] ?? 0) > 0),
    [groups],
  );

  // Per-group distribution across meals: group -> number[] aligned to MEAL_SLOTS.
  const distByGroup = useMemo(() => {
    const map = {} as Record<GrupoKey, number[]>;
    for (const g of activeGroups) map[g] = distribute(groups?.[g] ?? 0);
    return map;
  }, [activeGroups, groups]);

  // Per-meal aggregation: rows (group + equiv) and kcal.
  const meals = useMemo(() => {
    return MEAL_SLOTS.map((slot, slotIdx) => {
      const rows = activeGroups
        .map((g) => ({ group: g, equiv: distByGroup[g]?.[slotIdx] ?? 0 }))
        .filter((r) => r.equiv > 0);
      const kcal = rows.reduce(
        (acc, r) => acc + EQUIVALENTES_GRUPOS[r.group].kcal * r.equiv,
        0,
      );
      return { slot, rows, kcal };
    });
  }, [activeGroups, distByGroup]);

  const totalMealKcal = meals.reduce((a, m) => a + m.kcal, 0) || 1;

  function optionsText(group: GrupoKey, sep: string): string {
    const opts = (foodsByGroup[group] ?? []).slice(0, 3);
    if (opts.length === 0) return "—";
    return opts
      .map((o) => {
        const name = locale === "en" ? o.en : o.es;
        const serving = locale === "en" ? o.serving_en : o.serving_es;
        return serving ? `${name} ${serving}` : name;
      })
      .join(sep);
  }

  function buildWhatsApp(): string {
    const lines: string[] = [];
    const name = `${patient.first_name} ${patient.last_name}`.trim().toUpperCase();
    lines.push(`🥗 *PLAN DE NUTRICIÓN — ${name}*`);
    lines.push(`📅 ${data.dateLabel}`);
    lines.push("");
    lines.push(
      `🎯 ${nf(req.kcal)} kcal · P ${nf(req.proteinG)}g · HC ${nf(
        req.carbsG,
      )}g · G ${nf(req.fatG)}g`,
    );
    lines.push("");

    if (activeGroups.length === 0) {
      lines.push("_Aún sin distribución de equivalentes._");
    } else {
      for (const { slot, rows, kcal } of meals) {
        if (rows.length === 0) continue;
        lines.push(
          `${slot.emoji} *${slot.es} (${slot.time}) — ~${nf(kcal)} kcal*`,
        );
        for (const r of rows) {
          const meta = CLINICAL_GROUP_META[r.group];
          lines.push(
            `${meta.emoji} ${meta.es} (${r.equiv} equiv): ${optionsText(
              r.group,
              " ó ",
            )}`,
          );
        }
        lines.push("");
      }
    }

    lines.push(`💧 Agua mínima: ${nf(req.waterMl)} ml/día`);
    lines.push("✅ Generado con Anthroscope Plan Builder");
    return lines.join("\n");
  }

  function copyWhatsApp() {
    const text = buildWhatsApp();
    navigator.clipboard
      ?.writeText(text)
      .then(() => setToast(t(locale, "✓ Copiado para WhatsApp", "✓ Copied for WhatsApp")))
      .catch(() => setToast(t(locale, "No se pudo copiar", "Could not copy")));
    setTimeout(() => setToast(null), 2600);
  }

  const goalText = patient.goal
    ? goalLabel[patient.goal]?.[locale] ?? patient.goal
    : "—";

  return (
    <div className="clinic-wrap">
      {/* Action bar — hidden when printing */}
      <div className="no-print mb-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => window.print()} className="btn btn-brand">
          🖨 {t(locale, "Imprimir", "Print")}
        </button>
        <button type="button" onClick={copyWhatsApp} className="btn btn-ghost">
          📋 {t(locale, "Copiar para WhatsApp", "Copy for WhatsApp")}
        </button>
        {toast && (
          <span className="text-xs" style={{ color: "var(--gold)" }}>
            {toast}
          </span>
        )}
      </div>

      {/* The printable clinical sheet */}
      <div className="clinic-sheet">
        {/* Header */}
        <div className="clinic-head">
          <div>
            <h1 className="clinic-title">PLAN DE NUTRICIÓN</h1>
            <p className="clinic-subtitle">{data.planTitle}</p>
          </div>
          <div className="clinic-logo">
            {data.nutritionistName ? (
              <span>{data.nutritionistName}</span>
            ) : (
              <span>Anthroscope</span>
            )}
          </div>
        </div>

        {/* Patient identity block */}
        <div className="clinic-section">
          <div className="clinic-grid">
            <Field label="Paciente" value={`${patient.first_name} ${patient.last_name}`} />
            <Field label="Fecha" value={data.dateLabel} />
            <Field
              label="Peso actual"
              value={patient.weight_kg != null ? `${patient.weight_kg} kg` : "—"}
            />
            <Field
              label="Talla"
              value={patient.height_cm != null ? `${patient.height_cm} cm` : "—"}
            />
            <Field
              label="% Grasa"
              value={patient.body_fat_pct != null ? `${patient.body_fat_pct}%` : "—"}
            />
            <Field
              label="Masa magra"
              value={patient.lean_mass_kg != null ? `${patient.lean_mass_kg} kg` : "—"}
            />
            <Field label="Objetivo" value={goalText} />
            <Field label="Deporte" value={patient.sport ?? "—"} />
          </div>
        </div>

        {/* Daily requirements */}
        <div className="clinic-section">
          <h2 className="clinic-h2">REQUERIMIENTOS DIARIOS</h2>
          <div className="clinic-req">
            <ReqItem label="Energía" value={`${nf(req.kcal)} kcal`} />
            <ReqItem
              label="Proteína"
              value={`${nf(req.proteinG)} g (${req.proteinPct}%)`}
            />
            <ReqItem
              label="Carbohidratos"
              value={`${nf(req.carbsG)} g (${req.carbsPct}%)`}
            />
            <ReqItem label="Grasa" value={`${nf(req.fatG)} g (${req.fatPct}%)`} />
            <ReqItem label="Agua" value={`${nf(req.waterMl)} ml/día`} />
          </div>
        </div>

        {/* Distribution per meal */}
        <div className="clinic-section">
          <h2 className="clinic-h2">DISTRIBUCIÓN POR TIEMPO DE COMIDA</h2>

          {activeGroups.length === 0 ? (
            <p className="clinic-empty">
              Este plan aún no tiene una distribución de equivalentes. Cámbiate a
              la Vista Normal para calcular los equivalentes del día.
            </p>
          ) : (
            <div className="clinic-meals">
              {meals.map(({ slot, rows, kcal }) => (
                <div key={slot.key} className="clinic-meal">
                  <div className="clinic-meal-head">
                    <span>
                      {slot.emoji} {slot.es.toUpperCase()} ({slot.time})
                    </span>
                    <span className="clinic-meal-kcal">
                      {nf(kcal)} kcal · {Math.round((kcal / totalMealKcal) * 100)}%
                      del total
                    </span>
                  </div>
                  {rows.length === 0 ? (
                    <p className="clinic-meal-empty">Libre / agua</p>
                  ) : (
                    <table className="clinic-table">
                      <thead>
                        <tr>
                          <th style={{ width: "26%" }}>Grupo</th>
                          <th style={{ width: "12%" }} className="tc">
                            Equiv.
                          </th>
                          <th>Opciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => {
                          const meta = CLINICAL_GROUP_META[r.group];
                          return (
                            <tr key={r.group}>
                              <td>
                                {meta.emoji} {meta.es}
                              </td>
                              <td className="tc clinic-num">{r.equiv}</td>
                              <td className="clinic-opts">
                                {optionsText(r.group, " / ")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Special instructions */}
        <div className="clinic-section">
          <h2 className="clinic-h2">INDICACIONES ESPECIALES</h2>
          <ul className="clinic-notes">
            <li>Consumir agua entre comidas, no durante.</li>
            <li>Pre-entreno: 1 equiv de cereal + 1 equiv de fruta.</li>
            <li>Post-entreno: 2 equiv de proteína + 1 equiv de cereal.</li>
            <li>Respetar los horarios de cada tiempo de comida.</li>
          </ul>
        </div>

        {/* Signature footer */}
        <div className="clinic-footer">
          <div className="clinic-sign">
            <span className="clinic-sign-line" />
            <span className="clinic-sign-label">Firma del nutriólogo</span>
          </div>
          <div className="clinic-sign">
            <input
              type="text"
              className="clinic-sign-input"
              value={signatureDate}
              onChange={(e) => setSignatureDate(e.target.value)}
              placeholder="dd / mm / aaaa"
            />
            <span className="clinic-sign-label">Fecha de próxima cita</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="clinic-field">
      <span className="clinic-field-label">{label}</span>
      <span className="clinic-field-value">{value}</span>
    </div>
  );
}

function ReqItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="clinic-req-item">
      <span className="clinic-req-label">{label}</span>
      <span className="clinic-req-value">{value}</span>
    </div>
  );
}

// Toggle between the normal (interactive) plan view and the clinical sheet.
export function ClinicToggle({
  clinical,
  children,
}: {
  clinical: ClinicData;
  children: ReactNode;
}) {
  const { locale } = useLocale();
  const [clinic, setClinic] = useState(false);

  return (
    <div>
      <div className="no-print mb-6 inline-flex rounded-full p-1"
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
      >
        {[
          { v: false, es: "Vista Normal", en: "Normal View" },
          { v: true, es: "Vista Clínica", en: "Clinical View" },
        ].map((opt) => {
          const active = clinic === opt.v;
          return (
            <button
              key={String(opt.v)}
              type="button"
              onClick={() => setClinic(opt.v)}
              className="rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: active ? "var(--gold)" : "transparent",
                color: active ? "#0a0a0a" : "var(--ink-muted)",
              }}
            >
              {locale === "en" ? opt.en : opt.es}
            </button>
          );
        })}
      </div>

      {clinic ? <PlanClinicView data={clinical} /> : <div>{children}</div>}
    </div>
  );
}

export default PlanClinicView;
