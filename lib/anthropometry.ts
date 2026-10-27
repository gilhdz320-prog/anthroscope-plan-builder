/**
 * Índices antropométricos derivados.
 *
 * Todo se calcula a partir de lo que ya se captura (peso, talla, cintura,
 * cadera), así que no requiere migración ni campos nuevos.
 *
 * Referencias de los puntos de corte:
 * - IMC: OMS.
 * - ICC (cintura/cadera): OMS — riesgo elevado ≥0.90 en hombres, ≥0.85 en mujeres.
 * - ICT (cintura/altura): NICE/OMS — objetivo <0.5; 0.5–0.59 elevado; ≥0.6 muy alto.
 * - % grasa estimado: Deurenberg et al. (1991), solo como referencia cuando no
 *   hay medición directa.
 */

export type Sex = "masculino" | "femenino" | string | null | undefined;
export type Tone = "ok" | "warn" | "alert" | "neutral";

export type Metric = {
  key: string;
  label: string;
  value: string;
  hint?: string;
  tone: Tone;
};

function num(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** IMC = peso / talla² (kg, cm). */
export function bmi(weightKg: unknown, heightCm: unknown): number | null {
  const w = num(weightKg);
  const h = num(heightCm);
  if (!w || !h) return null;
  return w / Math.pow(h / 100, 2);
}

export function bmiCategory(value: number): { label: string; tone: Tone } {
  if (value < 18.5) return { label: "Bajo peso", tone: "warn" };
  if (value < 25) return { label: "Normopeso", tone: "ok" };
  if (value < 30) return { label: "Sobrepeso", tone: "warn" };
  if (value < 35) return { label: "Obesidad I", tone: "alert" };
  if (value < 40) return { label: "Obesidad II", tone: "alert" };
  return { label: "Obesidad III", tone: "alert" };
}

/** ICC = cintura / cadera. */
export function waistToHip(waistCm: unknown, hipCm: unknown): number | null {
  const waist = num(waistCm);
  const hip = num(hipCm);
  if (!waist || !hip) return null;
  return waist / hip;
}

export function whrRisk(
  value: number,
  sex: Sex,
): { label: string; tone: Tone } {
  const isMale = sex === "masculino" || sex === "male" || sex === "m";
  const isFemale = sex === "femenino" || sex === "female" || sex === "f";

  if (!isMale && !isFemale) {
    return { label: "Riesgo según sexo", tone: "neutral" };
  }
  const cutoff = isMale ? 0.9 : 0.85;
  return value >= cutoff
    ? { label: "Riesgo cardiometabólico elevado", tone: "alert" }
    : { label: "Dentro de rango", tone: "ok" };
}

/** ICT = cintura / talla (mejor predictor que el IMC en varios contextos). */
export function waistToHeight(waistCm: unknown, heightCm: unknown): number | null {
  const waist = num(waistCm);
  const height = num(heightCm);
  if (!waist || !height) return null;
  return waist / height;
}

export function whtrRisk(value: number): { label: string; tone: Tone } {
  if (value < 0.5) return { label: "Saludable (<0.50)", tone: "ok" };
  if (value < 0.6) return { label: "Elevado (0.50–0.59)", tone: "warn" };
  return { label: "Muy alto (≥0.60)", tone: "alert" };
}

/** Edad en años a partir de una fecha ISO (YYYY-MM-DD). */
export function ageFromBirthDate(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T12:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 && age < 120 ? age : null;
}

/**
 * % grasa estimado por Deurenberg (1991):
 *   %G = 1.20·IMC + 0.23·edad − 10.8·sexo(1 hombre, 0 mujer) − 5.4
 * Es una aproximación poblacional, no una medición.
 */
export function bodyFatDeurenberg(
  bmiValue: number | null,
  ageYears: number | null,
  sex: Sex,
): number | null {
  if (!bmiValue || ageYears === null) return null;
  const isMale = sex === "masculino" || sex === "male" || sex === "m";
  const isFemale = sex === "femenino" || sex === "female" || sex === "f";
  if (!isMale && !isFemale) return null;
  const estimate =
    1.2 * bmiValue + 0.23 * ageYears - 10.8 * (isMale ? 1 : 0) - 5.4;
  return estimate > 0 && estimate < 70 ? estimate : null;
}

/** Masa magra = peso × (1 − %grasa/100). */
export function leanMass(weightKg: unknown, bodyFatPct: unknown): number | null {
  const w = num(weightKg);
  const bf = typeof bodyFatPct === "string" ? Number(bodyFatPct) : Number(bodyFatPct);
  if (!w || !Number.isFinite(bf) || bf <= 0 || bf >= 70) return null;
  return w * (1 - bf / 100);
}

/**
 * Construye la lista de métricas derivadas para mostrar en la UI.
 * Omite silenciosamente las que no se pueden calcular (datos faltantes).
 */
export function deriveMetrics(input: {
  weightKg?: string | number | null;
  heightCm?: string | number | null;
  waistCm?: string | number | null;
  hipCm?: string | number | null;
  bodyFatPct?: string | number | null;
  birthDate?: string | null;
  sex?: Sex;
  folds?: FoldMap;
}): Metric[] {
  const metrics: Metric[] = [];

  const bmiValue = bmi(input.weightKg, input.heightCm);
  if (bmiValue) {
    const category = bmiCategory(bmiValue);
    metrics.push({
      key: "imc",
      label: "IMC",
      value: bmiValue.toFixed(1),
      hint: category.label,
      tone: category.tone,
    });
  }

  const whr = waistToHip(input.waistCm, input.hipCm);
  if (whr) {
    const risk = whrRisk(whr, input.sex);
    metrics.push({
      key: "icc",
      label: "Cintura/cadera",
      value: whr.toFixed(2),
      hint: risk.label,
      tone: risk.tone,
    });
  }

  const whtr = waistToHeight(input.waistCm, input.heightCm);
  if (whtr) {
    const risk = whtrRisk(whtr);
    metrics.push({
      key: "ict",
      label: "Cintura/altura",
      value: whtr.toFixed(2),
      hint: risk.label,
      tone: risk.tone,
    });
  }

  const measuredFat = num(input.bodyFatPct);
  const age = ageFromBirthDate(input.birthDate);

  // Pliegues: suma siempre visible si hay al menos uno.
  const foldsSum = input.folds ? sumFolds(input.folds) : null;
  const foldsCount = input.folds ? countFolds(input.folds) : 0;
  if (foldsSum) {
    metrics.push({
      key: "pliegues",
      label: "Suma pliegues",
      value: `${foldsSum.toFixed(1)} mm`,
      hint: `${foldsCount}/8 sitios ISAK`,
      tone: "neutral",
    });
  }

  const isakFat = input.folds ? bodyFatISAK(input.folds, input.sex) : null;

  // Prioridad: medición directa > ISAK > estimación por IMC.
  if (measuredFat) {
    metrics.push({
      key: "grasa",
      label: "% grasa (medido)",
      value: `${measuredFat.toFixed(1)}%`,
      tone: "neutral",
    });
  } else if (isakFat) {
    metrics.push({
      key: "grasa-isak",
      label: "% grasa (ISAK)",
      value: `${isakFat.pct.toFixed(1)}%`,
      hint: `${isakFat.equation} · 4 pliegues`,
      tone: "neutral",
    });
  } else {
    const estimated = bodyFatDeurenberg(bmiValue, age, input.sex);
    if (estimated) {
      metrics.push({
        key: "grasa-est",
        label: "% grasa (estimado)",
        value: `${estimated.toFixed(1)}%`,
        hint: "Deurenberg · referencia",
        tone: "neutral",
      });
    }
  }

  // Masa magra: con la grasa medida o la de ISAK (no con la estimada por IMC).
  const fatForLean = measuredFat ?? isakFat?.pct ?? null;
  if (fatForLean) {
    const lean = leanMass(input.weightKg, fatForLean);
    if (lean) {
      metrics.push({
        key: "magra",
        label: "Masa magra",
        value: `${lean.toFixed(1)} kg`,
        tone: "neutral",
      });
    }
  }

  return metrics;
}

// ─────────────────────────────────────────────────────────────────────────────
// ISAK: pliegues cutáneos
// ─────────────────────────────────────────────────────────────────────────────

export type FoldKey =
  | "triceps"
  | "subscapular"
  | "biceps"
  | "iliac"
  | "supraspinal"
  | "abdominal"
  | "thigh"
  | "calf";

export const ISAK_FOLDS: Array<{ key: FoldKey; label: string; hint: string }> = [
  { key: "triceps", label: "Tríceps", hint: "Punto medio acromion-radial" },
  { key: "subscapular", label: "Subescapular", hint: "Bajo el ángulo inferior de la escápula" },
  { key: "biceps", label: "Bíceps", hint: "Punto medio acromion-radial, cara anterior" },
  { key: "iliac", label: "Cresta ilíaca", hint: "Sobre la cresta, línea axilar media" },
  { key: "supraspinal", label: "Supraespinal", hint: "Punto iliocrestal, línea axilar" },
  { key: "abdominal", label: "Abdominal", hint: "2 cm a la derecha del ombligo" },
  { key: "thigh", label: "Muslo frontal", hint: "Punto medio trocánter-rotuliano" },
  { key: "calf", label: "Pantorrilla medial", hint: "Perímetro máximo, cara medial" },
];

export const ISAK_GIRTHS: Array<{ key: string; label: string }> = [
  { key: "girth_arm_cm", label: "Brazo relajado" },
  { key: "girth_thigh_cm", label: "Muslo medio" },
  { key: "girth_calf_cm", label: "Pantorrilla" },
  { key: "girth_chest_cm", label: "Tórax" },
];

export type FoldMap = Partial<Record<FoldKey, unknown>>;

/** Suma de los pliegues capturados (mm). Null si no hay ninguno. */
export function sumFolds(folds: FoldMap): number | null {
  const values = Object.values(folds)
    .map((value) => (typeof value === "string" ? Number(value.replace(",", ".")) : Number(value)))
    .filter((value) => Number.isFinite(value) && value > 0) as number[];
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0);
}

export function countFolds(folds: FoldMap): number {
  return Object.values(folds).filter((value) => {
    const n = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value);
    return Number.isFinite(n) && n > 0;
  }).length;
}

function num2(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Densidad corporal por Durnin & Womersley (1974), 4 pliegues:
 * bíceps, tríceps, subescapular y cresta ilíaca (suma en mm).
 *
 *   hombres: D = 1.1765 − 0.0744 · log10(Σ4)
 *   mujeres: D = 1.1567 − 0.0720 · log10(Σ4)
 *
 * Es una de las ecuaciones con más uso clínico y encaja con los 8 sitios ISAK.
 */
export function bodyDensityDW(
  folds: FoldMap,
  sex: Sex,
): number | null {
  const isMale = sex === "masculino" || sex === "male" || sex === "m";
  const isFemale = sex === "femenino" || sex === "female" || sex === "f";
  if (!isMale && !isFemale) return null;

  const sites = ["biceps", "triceps", "subscapular", "iliac"] as const;
  const values = sites.map((site) => num2(folds[site]));
  if (values.some((value) => value === null)) return null;

  const sum4 = (values as number[]).reduce((total, value) => total + value, 0);
  if (sum4 <= 0) return null;

  const density = isMale
    ? 1.1765 - 0.0744 * Math.log10(sum4)
    : 1.1567 - 0.072 * Math.log10(sum4);

  return density > 0.9 && density < 1.15 ? density : null;
}

/** Ecuación de Siri: %grasa = (495 / densidad) − 450. */
export function siriFromDensity(density: number | null): number | null {
  if (!density || density <= 0) return null;
  const pct = 495 / density - 450;
  return pct > 0 && pct < 70 ? pct : null;
}

/**
 * % de grasa a partir de pliegues ISAK.
 * Devuelve null si faltan los 4 sitios de Durnin-Womersley o el sexo.
 */
export function bodyFatISAK(
  folds: FoldMap,
  sex: Sex,
): { pct: number; equation: string; sites: number } | null {
  const density = bodyDensityDW(folds, sex);
  const pct = siriFromDensity(density);
  if (pct === null) return null;
  return { pct, equation: "Durnin-Womersley · Siri", sites: 4 };
}

/** Color de cada tono, alineado con el tema del panel. */
export const TONE_COLORS: Record<Tone, string> = {
  ok: "#7FC8A0",
  warn: "#E2C77E",
  alert: "#E08C86",
  neutral: "#9a9a93",
};
