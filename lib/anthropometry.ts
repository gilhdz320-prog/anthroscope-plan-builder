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
  if (measuredFat) {
    metrics.push({
      key: "grasa",
      label: "% grasa (medido)",
      value: `${measuredFat.toFixed(1)}%`,
      tone: "neutral",
    });
    const lean = leanMass(input.weightKg, measuredFat);
    if (lean) {
      metrics.push({
        key: "magra",
        label: "Masa magra",
        value: `${lean.toFixed(1)} kg`,
        tone: "neutral",
      });
    }
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

  return metrics;
}

/** Color de cada tono, alineado con el tema del panel. */
export const TONE_COLORS: Record<Tone, string> = {
  ok: "#7FC8A0",
  warn: "#E2C77E",
  alert: "#E08C86",
  neutral: "#9a9a93",
};
