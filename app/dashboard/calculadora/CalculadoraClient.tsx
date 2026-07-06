"use client";

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  sex: string | null;
  birth_date: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  body_fat_pct: number | null;
  activity_level: string | null;
  goal: string | null;
  sport: string | null;
}

interface CalcInputs {
  sex: "male" | "female";
  age: number;
  weight_kg: number;
  height_cm: number;
  activity_level: string;
  goal: string;
  goal_intensity: string;
  // Body fat methods
  body_fat_method: "direct" | "jp3" | "jp4" | "jp7" | "durnin" | "navy" | "none";
  body_fat_pct: number;
  // JP3 (Jackson-Pollock 3 pliegues)
  jp3_chest: number;
  jp3_abdomen: number;
  jp3_thigh: number;
  jp3_tricep: number;
  jp3_suprailiac: number;
  // JP7 (Jackson-Pollock 7 pliegues)
  jp7_chest: number;
  jp7_midaxillary: number;
  jp7_tricep: number;
  jp7_subscapular: number;
  jp7_abdomen: number;
  jp7_suprailiac: number;
  jp7_thigh: number;
  // Durnin-Womersley (4 pliegues)
  dw_bicep: number;
  dw_tricep: number;
  dw_subscapular: number;
  dw_suprailiac: number;
  // Navy
  navy_waist: number;
  navy_neck: number;
  navy_hip: number;
  // Macro distribution method
  macro_method: "percentage" | "per_kg";
  protein_pct: number;
  carb_pct: number;
  fat_pct: number;
  protein_g_kg: number;
  carb_g_kg: number;
  fat_g_kg: number;
}

interface CalcResults {
  bmr_mifflin: number;
  bmr_cunningham: number | null;
  tdee: number;
  target_kcal: number;
  body_fat_pct: number | null;
  lean_mass_kg: number | null;
  fat_mass_kg: number | null;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  protein_kcal: number;
  carb_kcal: number;
  fat_kcal: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentario", desc: "Sin ejercicio / trabajo de escritorio", pal: 1.2 },
  { value: "light", label: "Ligero", desc: "Ejercicio 1–3 días/semana", pal: 1.375 },
  { value: "moderate", label: "Moderado", desc: "Ejercicio 3–5 días/semana", pal: 1.55 },
  { value: "active", label: "Activo", desc: "Ejercicio intenso 6–7 días/semana", pal: 1.725 },
  { value: "very_active", label: "Muy activo", desc: "Atleta de alto rendimiento / trabajo físico", pal: 1.9 },
];

const GOALS = [
  { value: "weight_loss", label: "Pérdida de peso", intensities: [
    { value: "mild", label: "Leve (−250 kcal)", delta: -250 },
    { value: "moderate", label: "Moderada (−500 kcal)", delta: -500 },
    { value: "aggressive", label: "Agresiva (−750 kcal)", delta: -750 },
  ]},
  { value: "maintenance", label: "Mantenimiento", intensities: [
    { value: "maintenance", label: "Mantenimiento exacto (0 kcal)", delta: 0 },
  ]},
  { value: "muscle_gain", label: "Ganancia muscular", intensities: [
    { value: "lean", label: "Lean bulk (+200 kcal)", delta: 200 },
    { value: "moderate", label: "Moderado (+350 kcal)", delta: 350 },
    { value: "aggressive", label: "Agresivo (+500 kcal)", delta: 500 },
  ]},
  { value: "performance", label: "Rendimiento deportivo", intensities: [
    { value: "maintenance", label: "Mantenimiento (+0 kcal)", delta: 0 },
    { value: "surplus", label: "Superávit (+300 kcal)", delta: 300 },
  ]},
];

const BF_METHODS = [
  { value: "none", label: "Sin medición de grasa" },
  { value: "direct", label: "% grasa directo (DEXA / BIA / conocido)" },
  { value: "jp3", label: "Jackson-Pollock 3 pliegues" },
  { value: "jp4", label: "Jackson-Pollock 4 pliegues" },
  { value: "jp7", label: "Jackson-Pollock 7 pliegues" },
  { value: "durnin", label: "Durnin-Womersley (4 pliegues)" },
  { value: "navy", label: "Fórmula de la Marina de EE.UU." },
];

// ─── Calculation helpers ──────────────────────────────────────────────────────

function calcBMR_Mifflin(sex: "male" | "female", weight: number, height: number, age: number): number {
  if (sex === "male") return 10 * weight + 6.25 * height - 5 * age + 5;
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

function calcBMR_Cunningham(leanMass: number): number {
  return 500 + 22 * leanMass;
}

function calcBodyDensity_JP3_male(chest: number, abdomen: number, thigh: number, age: number): number {
  const sum = chest + abdomen + thigh;
  return 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * age;
}

function calcBodyDensity_JP3_female(tricep: number, suprailiac: number, thigh: number, age: number): number {
  const sum = tricep + suprailiac + thigh;
  return 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * age;
}

function calcBodyDensity_JP7(chest: number, midaxillary: number, tricep: number, subscapular: number, abdomen: number, suprailiac: number, thigh: number, age: number, sex: "male" | "female"): number {
  const sum = chest + midaxillary + tricep + subscapular + abdomen + suprailiac + thigh;
  if (sex === "male") return 1.112 - 0.00043499 * sum + 0.00000055 * sum * sum - 0.00028826 * age;
  return 1.097 - 0.00046971 * sum + 0.00000056 * sum * sum - 0.00012828 * age;
}

function calcBodyDensity_Durnin(bicep: number, tricep: number, subscapular: number, suprailiac: number, age: number, sex: "male" | "female"): number {
  const logSum = Math.log10(bicep + tricep + subscapular + suprailiac);
  // Durnin-Womersley coefficients by age and sex
  let c: number, m: number;
  if (sex === "male") {
    if (age < 17) { c = 1.1533; m = 0.0643; }
    else if (age < 20) { c = 1.1620; m = 0.0630; }
    else if (age < 30) { c = 1.1631; m = 0.0632; }
    else if (age < 40) { c = 1.1422; m = 0.0544; }
    else if (age < 50) { c = 1.1620; m = 0.0700; }
    else { c = 1.1715; m = 0.0779; }
  } else {
    if (age < 17) { c = 1.1369; m = 0.0598; }
    else if (age < 20) { c = 1.1549; m = 0.0678; }
    else if (age < 30) { c = 1.1599; m = 0.0717; }
    else if (age < 40) { c = 1.1423; m = 0.0632; }
    else if (age < 50) { c = 1.1333; m = 0.0612; }
    else { c = 1.1339; m = 0.0645; }
  }
  return c - m * logSum;
}

function densityToFatPct(density: number): number {
  // Siri equation
  return (4.95 / density - 4.5) * 100;
}

function calcNavyBF(sex: "male" | "female", waist: number, neck: number, hip: number, height: number): number {
  if (sex === "male") {
    return 86.010 * Math.log10(waist - neck) - 70.041 * Math.log10(height) + 36.76;
  }
  return 163.205 * Math.log10(waist + hip - neck) - 97.684 * Math.log10(height) - 78.387;
}

function calcBodyFat(inputs: CalcInputs): number | null {
  const { sex, age, body_fat_method } = inputs;
  switch (body_fat_method) {
    case "direct":
      return inputs.body_fat_pct > 0 ? inputs.body_fat_pct : null;
    case "jp3": {
      let density: number;
      if (sex === "male") density = calcBodyDensity_JP3_male(inputs.jp3_chest, inputs.jp3_abdomen, inputs.jp3_thigh, age);
      else density = calcBodyDensity_JP3_female(inputs.jp3_tricep, inputs.jp3_suprailiac, inputs.jp3_thigh, age);
      return Math.max(0, densityToFatPct(density));
    }
    case "jp4": {
      // JP4: use tricep + suprailiac + abdomen + thigh for both sexes (Pollock 1984)
      const sum = inputs.jp3_tricep + inputs.jp3_suprailiac + inputs.jp3_abdomen + inputs.jp3_thigh;
      const density = sex === "male"
        ? 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * age
        : 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * age;
      return Math.max(0, densityToFatPct(density));
    }
    case "jp7": {
      const density = calcBodyDensity_JP7(inputs.jp7_chest, inputs.jp7_midaxillary, inputs.jp7_tricep, inputs.jp7_subscapular, inputs.jp7_abdomen, inputs.jp7_suprailiac, inputs.jp7_thigh, age, sex);
      return Math.max(0, densityToFatPct(density));
    }
    case "durnin": {
      const density = calcBodyDensity_Durnin(inputs.dw_bicep, inputs.dw_tricep, inputs.dw_subscapular, inputs.dw_suprailiac, age, sex);
      return Math.max(0, densityToFatPct(density));
    }
    case "navy":
      return Math.max(0, calcNavyBF(sex, inputs.navy_waist, inputs.navy_neck, inputs.navy_hip, inputs.height_cm));
    default:
      return null;
  }
}

function calculate(inputs: CalcInputs): CalcResults {
  const { sex, age, weight_kg, height_cm, activity_level, goal, goal_intensity, macro_method } = inputs;
  const pal = ACTIVITY_LEVELS.find(a => a.value === activity_level)?.pal ?? 1.55;
  const goalObj = GOALS.find(g => g.value === goal);
  const intensityObj = goalObj?.intensities.find(i => i.value === goal_intensity);
  const delta = intensityObj?.delta ?? 0;

  const bf = calcBodyFat(inputs);
  const leanMass = bf != null ? weight_kg * (1 - bf / 100) : null;
  const fatMass = bf != null ? weight_kg * (bf / 100) : null;

  const bmr_mifflin = calcBMR_Mifflin(sex, weight_kg, height_cm, age);
  const bmr_cunningham = leanMass != null ? calcBMR_Cunningham(leanMass) : null;

  // Use Cunningham if lean mass is available (more accurate for athletes)
  const bmr_base = bmr_cunningham ?? bmr_mifflin;
  const tdee = Math.round(bmr_base * pal);
  const target_kcal = Math.round(tdee + delta);

  // Macros
  let protein_g: number, carb_g: number, fat_g: number;
  const refWeight = leanMass ?? weight_kg;

  if (macro_method === "per_kg") {
    protein_g = Math.round(inputs.protein_g_kg * refWeight);
    carb_g = Math.round(inputs.carb_g_kg * refWeight);
    fat_g = Math.round(inputs.fat_g_kg * refWeight);
  } else {
    protein_g = Math.round((target_kcal * inputs.protein_pct / 100) / 4);
    carb_g = Math.round((target_kcal * inputs.carb_pct / 100) / 4);
    fat_g = Math.round((target_kcal * inputs.fat_pct / 100) / 9);
  }

  return {
    bmr_mifflin: Math.round(bmr_mifflin),
    bmr_cunningham: bmr_cunningham != null ? Math.round(bmr_cunningham) : null,
    tdee,
    target_kcal,
    body_fat_pct: bf != null ? Math.round(bf * 10) / 10 : null,
    lean_mass_kg: leanMass != null ? Math.round(leanMass * 10) / 10 : null,
    fat_mass_kg: fatMass != null ? Math.round(fatMass * 10) / 10 : null,
    protein_g,
    carb_g,
    fat_g,
    protein_kcal: protein_g * 4,
    carb_kcal: carb_g * 4,
    fat_kcal: fat_g * 9,
  };
}

function ageFrom(birth: string | null): number {
  if (!birth) return 30;
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return 30;
  return Math.floor((Date.now() - b.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

// ─── Default macro presets by goal ───────────────────────────────────────────
function defaultMacros(goal: string): { protein_pct: number; carb_pct: number; fat_pct: number; protein_g_kg: number; carb_g_kg: number; fat_g_kg: number } {
  switch (goal) {
    case "weight_loss": return { protein_pct: 35, carb_pct: 35, fat_pct: 30, protein_g_kg: 2.2, carb_g_kg: 2.0, fat_g_kg: 0.8 };
    case "muscle_gain": return { protein_pct: 30, carb_pct: 45, fat_pct: 25, protein_g_kg: 2.0, carb_g_kg: 4.0, fat_g_kg: 1.0 };
    case "performance": return { protein_pct: 25, carb_pct: 55, fat_pct: 20, protein_g_kg: 1.8, carb_g_kg: 6.0, fat_g_kg: 1.0 };
    default: return { protein_pct: 30, carb_pct: 40, fat_pct: 30, protein_g_kg: 1.8, carb_g_kg: 3.5, fat_g_kg: 1.0 };
  }
}

const DEFAULT_INPUTS: CalcInputs = {
  sex: "male", age: 30, weight_kg: 75, height_cm: 175,
  activity_level: "moderate", goal: "maintenance", goal_intensity: "maintenance",
  body_fat_method: "none", body_fat_pct: 0,
  jp3_chest: 0, jp3_abdomen: 0, jp3_thigh: 0, jp3_tricep: 0, jp3_suprailiac: 0,
  jp7_chest: 0, jp7_midaxillary: 0, jp7_tricep: 0, jp7_subscapular: 0, jp7_abdomen: 0, jp7_suprailiac: 0, jp7_thigh: 0,
  dw_bicep: 0, dw_tricep: 0, dw_subscapular: 0, dw_suprailiac: 0,
  navy_waist: 0, navy_neck: 0, navy_hip: 0,
  macro_method: "percentage",
  ...defaultMacros("maintenance"),
};

// ─── UI helpers ───────────────────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>{label}</label>
      {children}
      {hint && <p className="text-xs" style={{ color: "var(--ink-subtle)" }}>{hint}</p>}
    </div>
  );
}

function NumInput({ value, onChange, min, max, step }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <input
      type="number"
      value={value || ""}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      min={min} max={max} step={step ?? 0.1}
      className="w-full rounded-md border px-3 py-2 text-sm"
      style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)", color: "var(--ink-strong)" }}
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-md border px-3 py-2 text-sm"
      style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)", color: "var(--ink-strong)" }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function ResultCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl p-4" style={{ background: highlight ? "var(--brand-50)" : "var(--surface-raised)", border: `1px solid ${highlight ? "var(--brand-200)" : "var(--border-subtle)"}` }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: highlight ? "var(--brand-700)" : "var(--ink-muted)" }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: highlight ? "var(--brand-700)" : "var(--ink-strong)" }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>{sub}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CalculadoraClient({ patients }: { patients: Patient[] }) {
  const [inputs, setInputs] = useState<CalcInputs>(DEFAULT_INPUTS);
  const [results, setResults] = useState<CalcResults | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string>("");

  const set = useCallback(<K extends keyof CalcInputs>(key: K, value: CalcInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  const loadPatient = (patientId: string) => {
    setSelectedPatient(patientId);
    if (!patientId) return;
    const p = patients.find(pt => pt.id === patientId);
    if (!p) return;
    const age = ageFrom(p.birth_date);
    const macros = defaultMacros(p.goal ?? "maintenance");
    setInputs(prev => ({
      ...prev,
      sex: (p.sex === "female" ? "female" : "male") as "male" | "female",
      age,
      weight_kg: p.weight_kg ?? prev.weight_kg,
      height_cm: p.height_cm ?? prev.height_cm,
      activity_level: p.activity_level ?? prev.activity_level,
      goal: p.goal ?? prev.goal,
      goal_intensity: GOALS.find(g => g.value === (p.goal ?? "maintenance"))?.intensities[0]?.value ?? "maintenance",
      body_fat_method: p.body_fat_pct ? "direct" : "none",
      body_fat_pct: p.body_fat_pct ?? 0,
      ...macros,
    }));
    setResults(null);
  };

  const handleGoalChange = (goal: string) => {
    const macros = defaultMacros(goal);
    const firstIntensity = GOALS.find(g => g.value === goal)?.intensities[0]?.value ?? "maintenance";
    setInputs(prev => ({ ...prev, goal, goal_intensity: firstIntensity, ...macros }));
  };

  const handleCalculate = () => {
    setResults(calculate(inputs));
  };

  const currentGoal = GOALS.find(g => g.value === inputs.goal);
  const totalPct = inputs.protein_pct + inputs.carb_pct + inputs.fat_pct;

  const showJP3Male = inputs.body_fat_method === "jp3" && inputs.sex === "male";
  const showJP3Female = inputs.body_fat_method === "jp3" && inputs.sex === "female";
  const showJP4 = inputs.body_fat_method === "jp4";
  const showJP7 = inputs.body_fat_method === "jp7";
  const showDurnin = inputs.body_fat_method === "durnin";
  const showNavy = inputs.body_fat_method === "navy";

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* ── Left: Inputs ── */}
      <div className="space-y-6">
        {/* Patient loader */}
        {patients.length > 0 && (
          <div className="rounded-xl p-5 space-y-3" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--ink-strong)" }}>Cargar datos de paciente</p>
            <Select
              value={selectedPatient}
              onChange={loadPatient}
              options={[{ value: "", label: "— Seleccionar paciente —" }, ...patients.map(p => ({ value: p.id, label: `${p.first_name} ${p.last_name}` }))]}
            />
          </div>
        )}

        {/* Basic data */}
        <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--ink-strong)" }}>Datos básicos</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sexo">
              <Select value={inputs.sex} onChange={v => set("sex", v as "male" | "female")} options={[{ value: "male", label: "Masculino" }, { value: "female", label: "Femenino" }]} />
            </Field>
            <Field label="Edad (años)">
              <NumInput value={inputs.age} onChange={v => set("age", v)} min={10} max={100} step={1} />
            </Field>
            <Field label="Peso (kg)">
              <NumInput value={inputs.weight_kg} onChange={v => set("weight_kg", v)} min={20} max={300} />
            </Field>
            <Field label="Estatura (cm)">
              <NumInput value={inputs.height_cm} onChange={v => set("height_cm", v)} min={100} max={250} />
            </Field>
          </div>
        </div>

        {/* Activity & Goal */}
        <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--ink-strong)" }}>Actividad y objetivo</p>
          <Field label="Nivel de actividad física">
            <Select
              value={inputs.activity_level}
              onChange={v => set("activity_level", v)}
              options={ACTIVITY_LEVELS.map(a => ({ value: a.value, label: `${a.label} — ${a.desc}` }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Objetivo">
              <Select value={inputs.goal} onChange={handleGoalChange} options={GOALS.map(g => ({ value: g.value, label: g.label }))} />
            </Field>
            <Field label="Intensidad">
              <Select
                value={inputs.goal_intensity}
                onChange={v => set("goal_intensity", v)}
                options={currentGoal?.intensities.map(i => ({ value: i.value, label: i.label })) ?? []}
              />
            </Field>
          </div>
        </div>

        {/* Body fat */}
        <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--ink-strong)" }}>% Grasa corporal</p>
          <Field label="Método de medición">
            <Select value={inputs.body_fat_method} onChange={v => set("body_fat_method", v as CalcInputs["body_fat_method"])} options={BF_METHODS} />
          </Field>

          {inputs.body_fat_method === "direct" && (
            <Field label="% Grasa corporal conocido">
              <NumInput value={inputs.body_fat_pct} onChange={v => set("body_fat_pct", v)} min={2} max={60} />
            </Field>
          )}

          {(showJP3Male) && (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: "var(--ink-muted)" }}>JP3 Masculino: pecho, abdomen, muslo</p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Pecho (mm)"><NumInput value={inputs.jp3_chest} onChange={v => set("jp3_chest", v)} min={0} max={100} /></Field>
                <Field label="Abdomen (mm)"><NumInput value={inputs.jp3_abdomen} onChange={v => set("jp3_abdomen", v)} min={0} max={100} /></Field>
                <Field label="Muslo (mm)"><NumInput value={inputs.jp3_thigh} onChange={v => set("jp3_thigh", v)} min={0} max={100} /></Field>
              </div>
            </div>
          )}

          {(showJP3Female) && (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: "var(--ink-muted)" }}>JP3 Femenino: tríceps, suprailíaco, muslo</p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Tríceps (mm)"><NumInput value={inputs.jp3_tricep} onChange={v => set("jp3_tricep", v)} min={0} max={100} /></Field>
                <Field label="Suprailíaco (mm)"><NumInput value={inputs.jp3_suprailiac} onChange={v => set("jp3_suprailiac", v)} min={0} max={100} /></Field>
                <Field label="Muslo (mm)"><NumInput value={inputs.jp3_thigh} onChange={v => set("jp3_thigh", v)} min={0} max={100} /></Field>
              </div>
            </div>
          )}

          {showJP4 && (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: "var(--ink-muted)" }}>JP4: tríceps, suprailíaco, abdomen, muslo</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tríceps (mm)"><NumInput value={inputs.jp3_tricep} onChange={v => set("jp3_tricep", v)} min={0} max={100} /></Field>
                <Field label="Suprailíaco (mm)"><NumInput value={inputs.jp3_suprailiac} onChange={v => set("jp3_suprailiac", v)} min={0} max={100} /></Field>
                <Field label="Abdomen (mm)"><NumInput value={inputs.jp3_abdomen} onChange={v => set("jp3_abdomen", v)} min={0} max={100} /></Field>
                <Field label="Muslo (mm)"><NumInput value={inputs.jp3_thigh} onChange={v => set("jp3_thigh", v)} min={0} max={100} /></Field>
              </div>
            </div>
          )}

          {showJP7 && (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: "var(--ink-muted)" }}>JP7: 7 sitios de pliegue</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "jp7_chest" as const, label: "Pecho" },
                  { key: "jp7_midaxillary" as const, label: "Axila media" },
                  { key: "jp7_tricep" as const, label: "Tríceps" },
                  { key: "jp7_subscapular" as const, label: "Subescapular" },
                  { key: "jp7_abdomen" as const, label: "Abdomen" },
                  { key: "jp7_suprailiac" as const, label: "Suprailíaco" },
                  { key: "jp7_thigh" as const, label: "Muslo" },
                ].map(f => (
                  <Field key={f.key} label={`${f.label} (mm)`}>
                    <NumInput value={inputs[f.key]} onChange={v => set(f.key, v)} min={0} max={100} />
                  </Field>
                ))}
              </div>
            </div>
          )}

          {showDurnin && (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: "var(--ink-muted)" }}>Durnin-Womersley: bíceps, tríceps, subescapular, suprailíaco</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Bíceps (mm)"><NumInput value={inputs.dw_bicep} onChange={v => set("dw_bicep", v)} min={0} max={100} /></Field>
                <Field label="Tríceps (mm)"><NumInput value={inputs.dw_tricep} onChange={v => set("dw_tricep", v)} min={0} max={100} /></Field>
                <Field label="Subescapular (mm)"><NumInput value={inputs.dw_subscapular} onChange={v => set("dw_subscapular", v)} min={0} max={100} /></Field>
                <Field label="Suprailíaco (mm)"><NumInput value={inputs.dw_suprailiac} onChange={v => set("dw_suprailiac", v)} min={0} max={100} /></Field>
              </div>
            </div>
          )}

          {showNavy && (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: "var(--ink-muted)" }}>Marina EE.UU.: circunferencias en cm</p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Cintura (cm)"><NumInput value={inputs.navy_waist} onChange={v => set("navy_waist", v)} min={0} max={200} /></Field>
                <Field label="Cuello (cm)"><NumInput value={inputs.navy_neck} onChange={v => set("navy_neck", v)} min={0} max={100} /></Field>
                {inputs.sex === "female" && <Field label="Cadera (cm)"><NumInput value={inputs.navy_hip} onChange={v => set("navy_hip", v)} min={0} max={200} /></Field>}
              </div>
            </div>
          )}
        </div>

        {/* Macros */}
        <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--ink-strong)" }}>Distribución de macros</p>
          <Field label="Método">
            <Select
              value={inputs.macro_method}
              onChange={v => set("macro_method", v as "percentage" | "per_kg")}
              options={[
                { value: "percentage", label: "Por porcentaje de calorías" },
                { value: "per_kg", label: "Por g/kg de peso (o masa magra si disponible)" },
              ]}
            />
          </Field>

          {inputs.macro_method === "percentage" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Proteína (%)">
                  <NumInput value={inputs.protein_pct} onChange={v => set("protein_pct", v)} min={0} max={100} step={1} />
                </Field>
                <Field label="Carbos (%)">
                  <NumInput value={inputs.carb_pct} onChange={v => set("carb_pct", v)} min={0} max={100} step={1} />
                </Field>
                <Field label="Grasas (%)">
                  <NumInput value={inputs.fat_pct} onChange={v => set("fat_pct", v)} min={0} max={100} step={1} />
                </Field>
              </div>
              {Math.abs(totalPct - 100) > 1 && (
                <p className="text-xs font-medium" style={{ color: "#e57373" }}>
                  Los porcentajes suman {totalPct}% — deben sumar 100%
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <Field label="Proteína (g/kg)">
                <NumInput value={inputs.protein_g_kg} onChange={v => set("protein_g_kg", v)} min={0} max={5} step={0.1} />
              </Field>
              <Field label="Carbos (g/kg)">
                <NumInput value={inputs.carb_g_kg} onChange={v => set("carb_g_kg", v)} min={0} max={15} step={0.1} />
              </Field>
              <Field label="Grasas (g/kg)">
                <NumInput value={inputs.fat_g_kg} onChange={v => set("fat_g_kg", v)} min={0} max={5} step={0.1} />
              </Field>
            </div>
          )}
        </div>

        <button
          onClick={handleCalculate}
          className="btn btn-brand w-full py-3 text-base font-semibold"
        >
          Calcular
        </button>
      </div>

      {/* ── Right: Results ── */}
      <div className="space-y-6">
        {!results ? (
          <div className="rounded-xl p-10 text-center" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
            <p className="text-4xl mb-3">🧮</p>
            <p className="text-sm" style={{ color: "var(--ink-muted)" }}>Completa los datos y haz clic en <strong>Calcular</strong> para ver los resultados.</p>
          </div>
        ) : (
          <>
            {/* BMR */}
            <div className="rounded-xl p-5 space-y-3" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--ink-strong)" }}>Tasa Metabólica Basal (TMB)</p>
              <div className="grid grid-cols-2 gap-3">
                <ResultCard label="Mifflin-St Jeor" value={`${results.bmr_mifflin} kcal`} sub="Recomendado en general" />
                {results.bmr_cunningham != null
                  ? <ResultCard label="Cunningham" value={`${results.bmr_cunningham} kcal`} sub="Basado en masa magra — más preciso para atletas" highlight />
                  : <div className="rounded-xl p-4 flex items-center justify-center" style={{ background: "var(--surface-raised)", border: "1px dashed var(--border-subtle)" }}>
                      <p className="text-xs text-center" style={{ color: "var(--ink-muted)" }}>Cunningham requiere % grasa corporal</p>
                    </div>
                }
              </div>
            </div>

            {/* TDEE & Target */}
            <div className="rounded-xl p-5 space-y-3" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--ink-strong)" }}>Gasto energético y meta</p>
              <div className="grid grid-cols-2 gap-3">
                <ResultCard label="TDEE" value={`${results.tdee} kcal`} sub={`PAL: ${ACTIVITY_LEVELS.find(a => a.value === inputs.activity_level)?.pal}`} />
                <ResultCard label="Meta calórica" value={`${results.target_kcal} kcal`} sub={currentGoal?.intensities.find(i => i.value === inputs.goal_intensity)?.label} highlight />
              </div>
            </div>

            {/* Body composition */}
            {results.body_fat_pct != null && (
              <div className="rounded-xl p-5 space-y-3" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--ink-strong)" }}>Composición corporal</p>
                <div className="grid grid-cols-3 gap-3">
                  <ResultCard label="% Grasa" value={`${results.body_fat_pct}%`} />
                  <ResultCard label="Masa magra" value={`${results.lean_mass_kg} kg`} />
                  <ResultCard label="Masa grasa" value={`${results.fat_mass_kg} kg`} />
                </div>
                {/* Visual bar */}
                <div className="mt-2">
                  <div className="h-3 rounded-full overflow-hidden flex" style={{ background: "var(--border-subtle)" }}>
                    <div style={{ width: `${results.body_fat_pct}%`, background: "var(--brand-400)" }} />
                    <div style={{ width: `${100 - results.body_fat_pct}%`, background: "var(--brand-700)" }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs" style={{ color: "var(--ink-muted)" }}>Grasa {results.body_fat_pct}%</span>
                    <span className="text-xs" style={{ color: "var(--ink-muted)" }}>Masa magra {(100 - results.body_fat_pct).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Macros */}
            <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--ink-strong)" }}>Distribución de macros</p>
              <div className="grid grid-cols-3 gap-3">
                <ResultCard label="Proteína" value={`${results.protein_g} g`} sub={`${results.protein_kcal} kcal`} />
                <ResultCard label="Carbohidratos" value={`${results.carb_g} g`} sub={`${results.carb_kcal} kcal`} />
                <ResultCard label="Grasas" value={`${results.fat_g} g`} sub={`${results.fat_kcal} kcal`} />
              </div>
              {/* Macro bar */}
              <div>
                <div className="h-3 rounded-full overflow-hidden flex">
                  <div style={{ width: `${(results.protein_kcal / (results.protein_kcal + results.carb_kcal + results.fat_kcal)) * 100}%`, background: "#4ade80" }} />
                  <div style={{ width: `${(results.carb_kcal / (results.protein_kcal + results.carb_kcal + results.fat_kcal)) * 100}%`, background: "var(--brand-400)" }} />
                  <div style={{ width: `${(results.fat_kcal / (results.protein_kcal + results.carb_kcal + results.fat_kcal)) * 100}%`, background: "#f59e0b" }} />
                </div>
                <div className="flex gap-4 mt-2">
                  <span className="text-xs flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: "#4ade80" }} />Proteína</span>
                  <span className="text-xs flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: "var(--brand-400)" }} />Carbos</span>
                  <span className="text-xs flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} />Grasas</span>
                </div>
              </div>
              <div className="rounded-lg p-3 mt-2" style={{ background: "var(--brand-50)", border: "1px solid var(--brand-100)" }}>
                <p className="text-xs" style={{ color: "var(--brand-700)" }}>
                  Total calculado: <strong>{results.protein_kcal + results.carb_kcal + results.fat_kcal} kcal</strong>
                  {" "}&nbsp;·&nbsp; Meta: <strong>{results.target_kcal} kcal</strong>
                  {" "}&nbsp;·&nbsp; Diferencia: <strong>{(results.protein_kcal + results.carb_kcal + results.fat_kcal) - results.target_kcal} kcal</strong>
                </p>
              </div>
            </div>

            {/* Methodology note */}
            <div className="rounded-xl p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                <strong>Metodología:</strong> TMB calculada con Mifflin-St Jeor (1990) y Cunningham (1980) cuando hay masa magra disponible.
                TDEE = TMB × PAL (Harris 1919 revisado). % grasa por Siri (1956) a partir de densidad corporal.
                Pliegues: Jackson-Pollock (1978, 1980), Durnin-Womersley (1974), Marina EE.UU. (Hodgdon-Beckett 1984).
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
