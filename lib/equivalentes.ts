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
 *
 * The algorithm accounts for cross-contributions (e.g. protein groups also
 * contribute fat, dairy contributes protein + carbs + fat) and applies a
 * normalization step to keep total kcal within ±5% of the target.
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

  // Fixed clinical anchors (minimum servings for micronutrient adequacy)
  const verduras = 3;
  const frutas = 3;
  const lacteos = 2;

  // Step 1: Protein — subtract contributions from fixed groups
  const fixedProteinG = verduras * EQUIVALENTES_GRUPOS.verduras.protein +
    lacteos * EQUIVALENTES_GRUPOS.lacteos.protein;
  const remainingProteinG = Math.max(0, proteinG - fixedProteinG);

  // Distribute remaining protein: 70% animal, 30% plant
  let proteinas_ao = round((remainingProteinG * 0.7) / 7);
  let proteinas_av = round((remainingProteinG * 0.3) / 7);
  let leguminosas = round(proteinas_av * 0.4);

  // Step 2: Fat — subtract fat contributed by protein-bearing groups and dairy
  const fatFromOther =
    proteinas_ao * EQUIVALENTES_GRUPOS.proteinas_ao.fat +
    proteinas_av * EQUIVALENTES_GRUPOS.proteinas_av.fat +
    lacteos * EQUIVALENTES_GRUPOS.lacteos.fat +
    leguminosas * EQUIVALENTES_GRUPOS.leguminosas.fat;
  const remainingFatG = Math.max(0, fatG - fatFromOther);
  let grasas = round(remainingFatG / 5);

  // Step 3: Carbs — subtract carbs from all carb-bearing groups
  const fixedCarbsG =
    verduras * EQUIVALENTES_GRUPOS.verduras.carbs +
    frutas * EQUIVALENTES_GRUPOS.frutas.carbs +
    lacteos * EQUIVALENTES_GRUPOS.lacteos.carbs +
    leguminosas * EQUIVALENTES_GRUPOS.leguminosas.carbs;
  const remainingCarbsG = Math.max(0, carbsG - fixedCarbsG);
  let cereales = round(remainingCarbsG / 15);

  // Step 4: Normalization — scale adjustable groups if total overshoots target
  let result: Equivalentes = {
    cereales,
    leguminosas,
    verduras,
    frutas,
    lacteos,
    proteinas_ao,
    proteinas_av,
    grasas,
    azucares: 0,
  };

  const { kcal: totalKcal } = equivalentesToMacros(result);
  const tolerance = kcal * 0.05;

  if (totalKcal > kcal + tolerance) {
    const excess = totalKcal - kcal;
    // Only scale the adjustable (non-fixed) groups
    const adjustableKcal =
      cereales * EQUIVALENTES_GRUPOS.cereales.kcal +
      proteinas_ao * EQUIVALENTES_GRUPOS.proteinas_ao.kcal +
      proteinas_av * EQUIVALENTES_GRUPOS.proteinas_av.kcal +
      grasas * EQUIVALENTES_GRUPOS.grasas.kcal +
      leguminosas * EQUIVALENTES_GRUPOS.leguminosas.kcal;

    if (adjustableKcal > 0) {
      const scale = Math.max(0, (adjustableKcal - excess) / adjustableKcal);
      result.cereales = round(cereales * scale);
      result.proteinas_ao = round(proteinas_ao * scale);
      result.proteinas_av = round(proteinas_av * scale);
      result.grasas = round(grasas * scale);
      result.leguminosas = round(leguminosas * scale);
    }
  }

  return result;
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
