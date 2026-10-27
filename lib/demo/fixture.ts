import {
  calcularEquivalentes,
  EQUIVALENTES_GRUPOS,
  equivalentesToMacros,
  type Equivalentes,
  type GrupoKey,
} from "@/lib/equivalentes";
import { deriveMetrics, type Metric } from "@/lib/anthropometry";

/**
 * Datos de la demo pública (/demo).
 *
 * Todo se calcula con el motor real del producto:
 *   - `calcularEquivalentes` reparte kcal y macros en los 9 grupos SMAE.
 *   - `equivalentesToMacros` verifica que la suma cuadre con el objetivo.
 *   - `deriveMetrics` calcula IMC, cintura/altura, etc.
 *
 * No consulta la base: la demo tiene que funcionar sin login y sin datos reales.
 */

const TARGET_KCAL = 1650;
const MACROS = { proteinPct: 30, carbsPct: 40, fatPct: 30 };

export const DEMO_PATIENT = {
  first_name: "Ana",
  last_name: "Pérez",
  sex: "femenino",
  age: 32,
  height_cm: 162,
  weight_kg: 68.4,
  body_fat_pct: 28.5,
  waist_cm: 82,
  hip_cm: 98,
  goal: "weight_loss",
  sport: "Corredora amateur",
  notes: "Intolerancia a la lactosa · trabaja de oficina, entrena 3×/semana",
};

/** Nombres de alimentos típicos por grupo, solo para ilustrar el plan. */
const SAMPLE_FOODS: Record<GrupoKey, string> = {
  cereales: "tortilla de maíz, arroz, avena",
  leguminosas: "frijol, lenteja, haba",
  verduras: "nopal, calabacita, jitomate",
  frutas: "papaya, manzana, guayaba",
  lacteos: "leche descremada, yogur griego",
  proteinas_ao: "pollo, huevo, pescado",
  proteinas_av: "soya, quinoa, chícharo",
  grasas: "aguacate, aceite de oliva, almendra",
  azucares: "miel, azúcar morena",
};

const MEAL_SPLIT: Array<{ name: string; pct: number }> = [
  { name: "Desayuno", pct: 0.25 },
  { name: "Colación AM", pct: 0.1 },
  { name: "Comida", pct: 0.35 },
  { name: "Colación PM", pct: 0.1 },
  { name: "Cena", pct: 0.2 },
];

export type DemoMeal = {
  name: string;
  items: Array<{ grupo: GrupoKey; label: string; count: number; kcal: number; foods: string }>;
  kcal: number;
};

export type Demo = {
  patient: typeof DEMO_PATIENT;
  targetKcal: number;
  macros: typeof MACROS;
  totals: Equivalentes;
  totalsMacros: ReturnType<typeof equivalentesToMacros>;
  meals: DemoMeal[];
  metrics: Metric[];
  progress: Array<{ date: string; weight: number; waist: number }>;
  summary: { grupo: GrupoKey; label: string; count: number; kcal: number }[];
};

/** Reparte el total de cada grupo entre comidas sin perder ni inventar unidades. */
function splitByMeal(totals: Equivalentes): DemoMeal[] {
  const meals: DemoMeal[] = MEAL_SPLIT.map((meal) => ({
    name: meal.name,
    items: [],
    kcal: 0,
  }));

  for (const grupo of Object.keys(totals) as GrupoKey[]) {
    const total = totals[grupo] ?? 0;
    if (total <= 0) continue;

    // Reparto proporcional con suelo, y el residuo va a la comida principal.
    const raw = MEAL_SPLIT.map((meal) => total * meal.pct);
    const base = raw.map((value) => Math.floor(value));
    let remainder = total - base.reduce((sum, value) => sum + value, 0);

    const mainIndex = MEAL_SPLIT.findIndex((meal) => meal.name === "Comida");
    let cursor = 0;
    while (remainder > 0) {
      base[cursor % base.length] += 1;
      remainder -= 1;
      cursor += 1;
    }
    // Si sobró y la comida principal no recibió nada, se lo damos a ella.
    if (total > 0 && base[mainIndex] === 0) {
      const donor = base.findIndex((value) => value > 1);
      if (donor >= 0) {
        base[donor] -= 1;
        base[mainIndex] += 1;
      }
    }

    base.forEach((count, index) => {
      if (count <= 0) return;
      const meta = EQUIVALENTES_GRUPOS[grupo];
      meals[index].items.push({
        grupo,
        label: meta.label.es,
        count,
        kcal: meta.kcal * count,
        foods: SAMPLE_FOODS[grupo],
      });
      meals[index].kcal += meta.kcal * count;
    });
  }

  return ensureEveryMealHasItems(meals);
}

/**
 * Con objetivos bajos, un 10% de una comida puede redondear a 0 equivalentes.
 * Para que la demo se vea realista, movemos una unidad desde la comida con más
 * ítems (sin alterar el total del día, que es lo que se audita).
 */
function ensureEveryMealHasItems(meals: DemoMeal[]): DemoMeal[] {
  for (const meal of meals) {
    if (meal.items.length > 0) continue;

    const donor = meals
      .filter((candidate) => candidate.items.some((item) => item.count >= 2))
      .sort((a, b) => b.items.length - a.items.length)[0];
    if (!donor) continue;

    const item = donor.items.find((candidate) => candidate.count >= 2);
    if (!item) continue;

    const unitKcal = EQUIVALENTES_GRUPOS[item.grupo].kcal;
    item.count -= 1;
    item.kcal -= unitKcal;
    donor.kcal -= unitKcal;
    if (item.count === 0) {
      donor.items = donor.items.filter((candidate) => candidate !== item);
    }

    meal.items.push({
      grupo: item.grupo,
      label: item.label,
      count: 1,
      kcal: unitKcal,
      foods: item.foods,
    });
    meal.kcal += unitKcal;
  }

  return meals;
}

export function buildDemo(): Demo {
  const totals = calcularEquivalentes(
    TARGET_KCAL,
    MACROS.proteinPct,
    MACROS.carbsPct,
    MACROS.fatPct,
  );

  const meals = splitByMeal(totals);

  const metrics = deriveMetrics({
    weightKg: DEMO_PATIENT.weight_kg,
    heightCm: DEMO_PATIENT.height_cm,
    waistCm: DEMO_PATIENT.waist_cm,
    hipCm: DEMO_PATIENT.hip_cm,
    bodyFatPct: DEMO_PATIENT.body_fat_pct,
    birthDate: "1994-03-12",
    sex: DEMO_PATIENT.sex,
  });

  // 8 semanas de seguimiento (semanal), con pérdida de ~0.4 kg/semana.
  const progress = Array.from({ length: 8 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (7 - index) * 7);
    return {
      date: date.toISOString().slice(0, 10),
      weight: Math.round((71.2 - index * 0.4) * 10) / 10,
      waist: Math.round((86 - index * 0.55) * 10) / 10,
    };
  });

  const summary = (Object.keys(totals) as GrupoKey[])
    .filter((grupo) => (totals[grupo] ?? 0) > 0)
    .map((grupo) => ({
      grupo,
      label: EQUIVALENTES_GRUPOS[grupo].label.es,
      count: totals[grupo] ?? 0,
      kcal: (totals[grupo] ?? 0) * EQUIVALENTES_GRUPOS[grupo].kcal,
    }));

  return {
    patient: DEMO_PATIENT,
    targetKcal: TARGET_KCAL,
    macros: MACROS,
    totals,
    totalsMacros: equivalentesToMacros(totals),
    meals,
    metrics,
    progress,
    summary,
  };
}
