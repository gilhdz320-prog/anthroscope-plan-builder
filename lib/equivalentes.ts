// Sistema Mexicano de Equivalentes (NOM-051 / INCMNSZ)
// Caloric and macro values are fixed per equivalent ("equivalente") for each group.

export const EQUIVALENTES_GRUPOS = {
  cereales:     { kcal: 70,  protein: 2, carbs: 15, fat: 0, label: { es: 'Cereales y tubérculos', en: 'Cereals & Starches' } },
  leguminosas:  { kcal: 120, protein: 8, carbs: 20, fat: 1, label: { es: 'Leguminosas', en: 'Legumes' } },
  verduras:     { kcal: 25,  protein: 2, carbs: 4,  fat: 0, label: { es: 'Verduras', en: 'Vegetables' } },
  frutas:       { kcal: 60,  protein: 0, carbs: 15, fat: 0, label: { es: 'Frutas', en: 'Fruits' } },
  lacteos:      { kcal: 110, protein: 9, carbs: 12, fat: 2, label: { es: 'Lácteos descremados', en: 'Low-fat Dairy' } },
  proteinas_ao: { kcal: 75,  protein: 7, carbs: 0,  fat: 5, label: { es: 'Proteínas de origen animal', en: 'Animal Proteins' } },
  proteinas_av: { kcal: 55,  protein: 7, carbs: 0,  fat: 2, label: { es: 'Proteínas de origen vegetal', en: 'Plant Proteins' } },
  grasas:       { kcal: 45,  protein: 0, carbs: 0,  fat: 5, label: { es: 'Grasas y aceites', en: 'Fats & Oils' } },
  azucares:     { kcal: 40,  protein: 0, carbs: 10, fat: 0, label: { es: 'Azúcares', en: 'Sugars' } },
} as const;

export type GrupoKey = keyof typeof EQUIVALENTES_GRUPOS;

export type Equivalentes = Record<GrupoKey, number>;

export const GRUPO_KEYS = Object.keys(EQUIVALENTES_GRUPOS) as GrupoKey[];

function round(n: number): number {
  return Math.max(0, Math.round(n));
}

/**
 * Convert a kcal target + macro percentage distribution into a clinical
 * distribution of Mexican food equivalents per group.
 */
export function calcularEquivalentes(
  kcal: number,
  proteinPct: number,
  carbsPct: number,
  fatPct: number,
): Equivalentes {
  const proteinG = (kcal * proteinPct) / 100 / 4;
  const carbsG = (kcal * carbsPct) / 100 / 4;
  const fatG = (kcal * fatPct) / 100 / 9;

  // Fixed clinical anchors
  const verduras = 3;
  const frutas = 3;
  const lacteos = 2;

  const proteinas_ao = round((proteinG * 0.7) / 7); // 70% animal protein
  const proteinas_av = round((proteinG * 0.3) / 7); // 30% plant protein
  const grasas = round(fatG / 5);
  const leguminosas = round(proteinas_av / 2); // legumes count as both protein & carb

  // Remaining carbohydrate kcal once fixed carb-bearing groups are accounted for.
  const carbKcalTarget = carbsG * 4;
  const fixedCarbKcal =
    (verduras * EQUIVALENTES_GRUPOS.verduras.carbs +
      frutas * EQUIVALENTES_GRUPOS.frutas.carbs +
      lacteos * EQUIVALENTES_GRUPOS.lacteos.carbs +
      leguminosas * EQUIVALENTES_GRUPOS.leguminosas.carbs) *
    4;
  const remainingCarbKcal = Math.max(0, carbKcalTarget - fixedCarbKcal);
  const cereales = round(remainingCarbKcal / 70);

  return {
    cereales,
    leguminosas,
    verduras,
    frutas,
    lacteos,
    proteinas_ao,
    proteinas_av,
    grasas,
    azucares: 0, // nutritionist adjusts manually
  };
}

/**
 * Sum every group's contribution into total kcal and macro grams.
 */
export function equivalentesToMacros(equivalentes: Equivalentes): {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
} {
  let kcal = 0;
  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;

  for (const key of GRUPO_KEYS) {
    const n = equivalentes[key] ?? 0;
    const g = EQUIVALENTES_GRUPOS[key];
    kcal += g.kcal * n;
    proteinG += g.protein * n;
    carbsG += g.carbs * n;
    fatG += g.fat * n;
  }

  return {
    kcal: Math.round(kcal),
    proteinG: Math.round(proteinG),
    carbsG: Math.round(carbsG),
    fatG: Math.round(fatG),
  };
}
