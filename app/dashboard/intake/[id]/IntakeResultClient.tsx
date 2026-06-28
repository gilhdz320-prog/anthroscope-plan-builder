"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CaloricResult } from "@/lib/caloric-calculator";

const cormorant = {
  fontFamily: "var(--font-cormorant), ui-serif, Georgia, serif",
};

const activityLabel: Record<string, string> = {
  sedentary: "Sedentario",
  light: "Ligero",
  moderate: "Moderado",
  active: "Activo",
  very_active: "Muy activo",
};

const goalLabel: Record<string, string> = {
  lose_fat: "Perder grasa",
  maintain: "Mantener peso",
  gain_muscle: "Ganar músculo",
};

const formulaName: Record<string, string> = {
  katch_mcardle: "Katch-McArdle",
  mifflin_st_jeor: "Mifflin-St Jeor",
};

const goalAdjustLabel: Record<string, string> = {
  lose_fat: "Pérdida de grasa",
  maintain: "Mantenimiento",
  gain_muscle: "Aumento muscular",
};

const formulaWhy: Record<string, string> = {
  katch_mcardle:
    "Se usó esta fórmula porque el cliente proporcionó su composición corporal (masa magra), lo que la hace la más precisa.",
  mifflin_st_jeor:
    "Se usó esta fórmula porque no hay datos de composición corporal. Es la ecuación mejor validada en ese caso.",
};

type ClientInfo = {
  age: number;
  sex: "male" | "female";
  height_cm: number;
  weight_kg: number;
  activity_level: string;
  goal: string;
  has_body_comp: boolean;
  body_fat_pct: number | null;
  lean_mass_kg: number | null;
  client_notes: string | null;
};

export function IntakeResultClient({
  intakeId,
  clientName,
  client,
  result,
}: {
  intakeId: string;
  clientName: string | null;
  client: ClientInfo;
  result: CaloricResult;
}) {
  const router = useRouter();
  const [kcal, setKcal] = useState(result.target_kcal);
  const [protein, setProtein] = useState(result.suggested_macros.protein_g);
  const [carbs, setCarbs] = useState(result.suggested_macros.carbs_g);
  const [fat, setFat] = useState(result.suggested_macros.fat_g);
  const [navigating, setNavigating] = useState<string | null>(null);

  function createPlan(mode: "macros" | "equivalentes") {
    setNavigating(mode);
    const qs = new URLSearchParams({
      from_intake: intakeId,
      mode,
      kcal: String(kcal),
      protein: String(protein),
      carbs: String(carbs),
      fat: String(fat),
    });
    router.push(`/dashboard/plans/new?${qs.toString()}`);
  }

  return (
    <div className="space-y-6 rise rise-1">
      {/* Client data */}
      <div className="card-luxe p-6">
        <p className="eyebrow" style={{ color: "var(--gold)" }}>
          Datos del cliente
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Edad" value={`${client.age} años`} />
          <Stat label="Sexo" value={client.sex === "male" ? "Hombre" : "Mujer"} />
          <Stat label="Estatura" value={`${client.height_cm} cm`} />
          <Stat label="Peso" value={`${client.weight_kg} kg`} />
          <Stat label="Actividad" value={activityLabel[client.activity_level] ?? client.activity_level} />
          <Stat label="Objetivo" value={goalLabel[client.goal] ?? client.goal} />
          {client.has_body_comp && client.body_fat_pct != null && (
            <Stat label="% grasa" value={`${client.body_fat_pct}%`} />
          )}
          {client.has_body_comp && client.lean_mass_kg != null && (
            <Stat label="Masa magra" value={`${client.lean_mass_kg} kg`} />
          )}
        </div>
        {client.client_notes && (
          <p className="mt-4 text-sm" style={{ color: "var(--ink-muted)" }}>
            <span className="font-medium" style={{ color: "var(--ink-strong)" }}>
              Notas:
            </span>{" "}
            {client.client_notes}
          </p>
        )}
      </div>

      {/* Calculation */}
      <div className="card-luxe p-6">
        <p className="eyebrow" style={{ color: "var(--gold)" }}>
          Cálculo energético
        </p>
        <div
          className="mt-3 rounded-md p-3 text-xs"
          style={{ background: "rgba(201,169,97,0.08)", color: "var(--gold-soft)" }}
        >
          Fórmula: <strong>{formulaName[result.formula_used]}</strong>.{" "}
          {formulaWhy[result.formula_used]}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4">
          <Stat label="BMR" value={`${result.bmr} kcal`} big />
          <Stat label="TDEE" value={`${result.tdee} kcal`} big />
          <Stat label="Meta sugerida" value={`${result.target_kcal} kcal`} big gold />
        </div>
      </div>

      {/* NEAT breakdown */}
      <div
        className="rounded-lg p-6"
        style={{
          background: "#0a0a0a",
          border: "1px solid var(--gold)",
        }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--gold)" }}
        >
          Composición del gasto calórico
        </p>
        <div className="mt-4 font-mono-tabular text-[13px]">
          <BreakdownRow
            label="TMB (Metabolismo basal)"
            value={`${fmt(result.bmr)} kcal`}
            note={formulaName[result.formula_used]}
          />
          <BreakdownRow
            label="Ejercicio estructurado"
            value={`+${fmt(result.breakdown.exercise_kcal)} kcal`}
            note={`Factor x${result.breakdown.base_multiplier}`}
          />
          <BreakdownRow
            label="NEAT (Actividad diaria)"
            value={`+${fmt(result.breakdown.neat_kcal)} kcal`}
            note="Pasos + Trabajo + Casa"
          />
          <Divider />
          <BreakdownRow
            label="GET Total (TDEE)"
            value={`${fmt(result.tdee)} kcal`}
            strong
          />
          <BreakdownRow
            label="Ajuste por objetivo"
            value={`${result.breakdown.goal_adjustment >= 0 ? "+" : ""}${fmt(result.breakdown.goal_adjustment)} kcal`}
            note={goalAdjustLabel[client.goal] ?? client.goal}
          />
          <Divider />
          <BreakdownRow
            label="Meta calórica"
            value={`${fmt(result.target_kcal)} kcal`}
            gold
            strong
          />
        </div>
      </div>

      {/* Editable target + macros */}
      <div className="card-luxe p-6">
        <p className="eyebrow" style={{ color: "var(--gold)" }}>
          Ajustes finales (editable)
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--ink-subtle)" }}>
          Puedes ajustar estos valores antes de crear el plan.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <NumField label="Meta (kcal)" value={kcal} onChange={setKcal} />
          <NumField label="Proteína (g)" value={protein} onChange={setProtein} />
          <NumField label="Carbos (g)" value={carbs} onChange={setCarbs} />
          <NumField label="Grasa (g)" value={fat} onChange={setFat} />
        </div>
        <div className="mt-3 flex gap-2 text-xs" style={{ color: "var(--ink-muted)" }}>
          <span>P {result.suggested_macros.protein_pct}%</span>
          <span>·</span>
          <span>C {result.suggested_macros.carbs_pct}%</span>
          <span>·</span>
          <span>G {result.suggested_macros.fat_pct}%</span>
          <span style={{ color: "var(--ink-subtle)" }}>(distribución sugerida)</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => createPlan("macros")}
          disabled={navigating !== null}
          className="btn btn-brand"
        >
          {navigating === "macros" && <span className="spinner" />}
          Crear plan con Macros/Kcal
        </button>
        <button
          type="button"
          onClick={() => createPlan("equivalentes")}
          disabled={navigating !== null}
          className="btn btn-primary"
        >
          {navigating === "equivalentes" && <span className="spinner" />}
          Crear plan con Equivalentes
        </button>
      </div>
      {clientName && (
        <p className="text-xs" style={{ color: "var(--ink-subtle)" }}>
          El plan se creará a partir del intake de {clientName}.
        </p>
      )}
    </div>
  );
}

function fmt(n: number): string {
  return n.toLocaleString("es-MX");
}

function Divider() {
  return (
    <div
      className="my-2 border-t border-dashed"
      style={{ borderColor: "rgba(201,169,97,0.35)" }}
    />
  );
}

function BreakdownRow({
  label,
  value,
  note,
  gold,
  strong,
}: {
  label: string;
  value: string;
  note?: string;
  gold?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2 py-1">
      <span
        style={{
          color: gold ? "var(--gold)" : "var(--ink-muted)",
          fontWeight: strong ? 600 : 400,
        }}
      >
        {label}
      </span>
      <span
        className="flex-1 border-b border-dotted"
        style={{ borderColor: "#2a2a2a", transform: "translateY(-3px)" }}
      />
      <span
        className="whitespace-nowrap text-right"
        style={{
          color: gold ? "var(--gold)" : "var(--ink-strong)",
          fontWeight: strong ? 700 : 500,
        }}
      >
        {value}
      </span>
      {note && (
        <span
          className="whitespace-nowrap text-[11px]"
          style={{ color: "var(--ink-subtle)" }}
        >
          [{note}]
        </span>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  big,
  gold,
}: {
  label: string;
  value: string;
  big?: boolean;
  gold?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--ink-subtle)" }}>
        {label}
      </p>
      <p
        className="mt-1 font-mono-tabular"
        style={{
          ...(big ? cormorant : {}),
          fontSize: big ? "26px" : "15px",
          color: gold ? "var(--gold)" : "var(--ink-strong)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        className="input"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}
