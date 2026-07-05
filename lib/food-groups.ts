// Bilingual metadata for the food/equivalent groups used across the catalog,
// the food search UI and the patient exchange view.
//
// Two group vocabularies coexist in this project:
//   1. DB `equivalents.group_key` — 17 granular keys (e.g. `proteina_baja`).
//   2. The Sistema Mexicano de Equivalentes 9 clinical groups defined in
//      `lib/equivalentes.ts` (e.g. `proteinas_ao`), which the plan distribution
//      is expressed in.
// The patient exchange view swaps foods *within* a clinical group, so we map
// each clinical group to the DB group_keys whose foods share the same macros.

import type { GrupoKey } from "@/lib/equivalentes";
import type { Locale } from "@/components/LocaleProvider";

export interface GroupMeta {
  es: string;
  en: string;
  emoji: string;
}

// Labels + emoji for every DB group_key.
export const DB_GROUP_META: Record<string, GroupMeta> = {
  cereales: { es: "Cereales y tubérculos", en: "Grains & starches", emoji: "🌾" },
  cereales_grasa: { es: "Cereales con grasa", en: "Grains with fat", emoji: "🥐" },
  leguminosas: { es: "Leguminosas", en: "Legumes", emoji: "🫘" },
  verduras: { es: "Verduras", en: "Vegetables", emoji: "🥦" },
  frutas: { es: "Frutas", en: "Fruits", emoji: "🍎" },
  lacteos_descremados: { es: "Lácteos descremados", en: "Nonfat dairy", emoji: "🥛" },
  lacteos_semi: { es: "Lácteos semidescremados", en: "Low-fat dairy", emoji: "🥛" },
  lacteos_enteros: { es: "Lácteos enteros", en: "Whole dairy", emoji: "🧀" },
  proteina_muy_baja: { es: "Proteína muy baja en grasa", en: "Very lean protein", emoji: "🍗" },
  proteina_baja: { es: "Proteína baja en grasa", en: "Lean protein", emoji: "🍗" },
  proteina_media: { es: "Proteína grasa media", en: "Medium-fat protein", emoji: "🥩" },
  proteina_alta: { es: "Proteína alta en grasa", en: "High-fat protein", emoji: "🥓" },
  grasas_mono: { es: "Grasas monoinsaturadas", en: "Monounsaturated fats", emoji: "🥑" },
  grasas_poli: { es: "Grasas poliinsaturadas", en: "Polyunsaturated fats", emoji: "🌰" },
  grasas_saturadas: { es: "Grasas saturadas", en: "Saturated fats", emoji: "🧈" },
  azucares: { es: "Azúcares", en: "Sugars", emoji: "🍯" },
  bebidas_deporte: { es: "Bebidas deportivas", en: "Sports drinks", emoji: "🧃" },
};

// Labels + emoji for the 9 clinical (equivalentes) groups.
export const CLINICAL_GROUP_META: Record<GrupoKey, GroupMeta> = {
  cereales: { es: "Cereal", en: "Grain", emoji: "🌾" },
  leguminosas: { es: "Leguminosa", en: "Legume", emoji: "🫘" },
  verduras: { es: "Verdura", en: "Vegetable", emoji: "🥦" },
  frutas: { es: "Fruta", en: "Fruit", emoji: "🍎" },
  lacteos: { es: "Lácteo", en: "Dairy", emoji: "🥛" },
  proteinas_ao: { es: "Proteína animal", en: "Animal protein", emoji: "🍗" },
  proteinas_av: { es: "Proteína vegetal", en: "Plant protein", emoji: "🌱" },
  grasas: { es: "Grasa", en: "Fat", emoji: "🥑" },
  azucares: { es: "Azúcar", en: "Sugar", emoji: "🍯" },
};

// Which DB group_keys supply foods for each clinical group.
export const CLINICAL_TO_DB_GROUPS: Record<GrupoKey, string[]> = {
  cereales: ["cereales", "cereales_grasa"],
  leguminosas: ["leguminosas"],
  verduras: ["verduras"],
  frutas: ["frutas"],
  lacteos: ["lacteos_descremados", "lacteos_semi", "lacteos_enteros"],
  proteinas_ao: ["proteina_muy_baja", "proteina_baja", "proteina_media", "proteina_alta"],
  proteinas_av: ["leguminosas"],
  grasas: ["grasas_mono", "grasas_poli", "grasas_saturadas"],
  azucares: ["azucares", "bebidas_deporte"],
};

export function dbGroupLabel(groupKey: string, locale: Locale): string {
  const m = DB_GROUP_META[groupKey];
  return m ? m[locale] : groupKey;
}

export function dbGroupEmoji(groupKey: string): string {
  return DB_GROUP_META[groupKey]?.emoji ?? "🍽️";
}

export function clinicalGroupLabel(group: GrupoKey, locale: Locale): string {
  return CLINICAL_GROUP_META[group][locale];
}
