/**
 * USDA FoodData Central → Supabase equivalents importer
 *
 * Usage:
 *   npx tsx scripts/import-usda.ts
 *
 * Reads data/food_catalog.json (curated bilingual food list)
 * Queries USDA FoodData Central for macros per 100g
 * Computes exchange portion that matches kcal target of each group
 * Outputs SQL to supabase/seed_usda_bilingual.sql for review + apply
 *
 * Env required: USDA_API_KEY (from .env.local)
 */

import * as fs from "node:fs";
import * as path from "node:path";

// Load .env.local manually (no dotenv dependency)
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

const API_KEY = process.env.USDA_API_KEY;
if (!API_KEY) {
  console.error("Missing USDA_API_KEY in .env.local");
  process.exit(1);
}

// ============================================================================
// Types
// ============================================================================

interface FoodEntry {
  es: string;
  en: string;
  query: string;
}

interface Catalog {
  [groupKey: string]: FoodEntry[] | undefined;
}

interface GroupTarget {
  key: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface USDAFood {
  fdcId: number;
  description: string;
  dataType: string;
  foodNutrients: Array<{
    nutrientId?: number;
    nutrientName?: string;
    nutrientNumber?: string;
    value?: number;
    unitName?: string;
  }>;
}

interface ResolvedFood {
  group_key: string;
  food_name_es: string;
  food_name_en: string;
  serving_g: number;
  serving_desc_es: string;
  serving_desc_en: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  fdc_id: number;
}

// ============================================================================
// Group exchange targets (kcal per exchange)
// Mirror of supabase.food_groups
// ============================================================================

const GROUP_TARGETS: Record<string, GroupTarget> = {
  cereales:            { key: "cereales",            kcal: 70,  protein_g: 2, carbs_g: 15, fat_g: 0 },
  cereales_grasa:      { key: "cereales_grasa",      kcal: 115, protein_g: 2, carbs_g: 15, fat_g: 5 },
  leguminosas:         { key: "leguminosas",         kcal: 120, protein_g: 8, carbs_g: 20, fat_g: 1 },
  verduras:            { key: "verduras",            kcal: 25,  protein_g: 2, carbs_g: 4,  fat_g: 0 },
  frutas:              { key: "frutas",              kcal: 60,  protein_g: 0, carbs_g: 15, fat_g: 0 },
  lacteos_descremados: { key: "lacteos_descremados", kcal: 95,  protein_g: 9, carbs_g: 12, fat_g: 0 },
  lacteos_semi:        { key: "lacteos_semi",        kcal: 110, protein_g: 9, carbs_g: 12, fat_g: 4 },
  lacteos_enteros:     { key: "lacteos_enteros",     kcal: 150, protein_g: 9, carbs_g: 12, fat_g: 8 },
  proteina_muy_baja:   { key: "proteina_muy_baja",   kcal: 40,  protein_g: 7, carbs_g: 0,  fat_g: 1 },
  proteina_baja:       { key: "proteina_baja",       kcal: 55,  protein_g: 7, carbs_g: 0,  fat_g: 3 },
  proteina_media:      { key: "proteina_media",      kcal: 75,  protein_g: 7, carbs_g: 0,  fat_g: 5 },
  proteina_alta:       { key: "proteina_alta",       kcal: 100, protein_g: 7, carbs_g: 0,  fat_g: 8 },
  grasas_mono:         { key: "grasas_mono",         kcal: 45,  protein_g: 0, carbs_g: 0,  fat_g: 5 },
  grasas_poli:         { key: "grasas_poli",         kcal: 45,  protein_g: 0, carbs_g: 0,  fat_g: 5 },
  grasas_saturadas:    { key: "grasas_saturadas",    kcal: 45,  protein_g: 0, carbs_g: 0,  fat_g: 5 },
  azucares:            { key: "azucares",            kcal: 40,  protein_g: 0, carbs_g: 10, fat_g: 0 },
  bebidas_deporte:     { key: "bebidas_deporte",     kcal: 50,  protein_g: 0, carbs_g: 14, fat_g: 0 },
};

// ============================================================================
// Helpers: format household serving
// ============================================================================

function formatServing(grams: number, groupKey: string): { es: string; en: string } {
  const g = Math.round(grams);
  // Liquids: lacteos + bebidas → ml ≈ g
  if (groupKey.startsWith("lacteos_") || groupKey === "bebidas_deporte") {
    const ml = Math.round(grams / 5) * 5;
    if (ml >= 240) {
      const cups = (ml / 240).toFixed(1);
      return { es: `${cups} taza (${ml} ml)`, en: `${cups} cup (${ml} ml)` };
    }
    if (ml >= 120) return { es: `1/2 taza (${ml} ml)`, en: `1/2 cup (${ml} ml)` };
    if (ml >= 60) return { es: `1/4 taza (${ml} ml)`, en: `1/4 cup (${ml} ml)` };
    return { es: `${ml} ml`, en: `${ml} ml` };
  }
  // Fats/oils: tsp ≈ 5 g, tbsp ≈ 15 g
  if (groupKey.startsWith("grasas_")) {
    if (grams <= 7) return { es: `1 cdta (${g} g)`, en: `1 tsp (${g} g)` };
    if (grams <= 18) return { es: `1 cda (${g} g)`, en: `1 tbsp (${g} g)` };
    return { es: `${g} g`, en: `${g} g` };
  }
  // Default: just show grams; for large portions add cup estimate
  if (g >= 100) return { es: `${g} g (~1 taza)`, en: `${g} g (~1 cup)` };
  if (g >= 60) return { es: `${g} g (~1/2 taza)`, en: `${g} g (~1/2 cup)` };
  return { es: `${g} g`, en: `${g} g` };
}

// ============================================================================
// USDA API
// ============================================================================

// USDA nutrient IDs vary by data type. We accept several aliases per nutrient.
const NUTRIENT_IDS = {
  kcal: ["208", "1008"],          // Energy (kcal)
  protein: ["203", "1003"],       // Protein
  fat: ["204", "1004"],           // Total lipid (fat)
  carbs: ["205", "1005"],         // Carbohydrate, by difference
  fiber: ["291", "1079"],         // Fiber, total dietary
};

function findNutrient(food: USDAFood, candidates: string[]): number {
  for (const cand of candidates) {
    const n = food.foodNutrients.find(
      (x) =>
        x.nutrientNumber === cand ||
        String(x.nutrientId) === cand,
    );
    if (n && typeof n.value === "number" && n.value > 0) return n.value;
  }
  // Also try by name as last resort
  const energy = food.foodNutrients.find(
    (x) => x.nutrientName?.toLowerCase().startsWith("energy") && x.unitName?.toUpperCase() === "KCAL",
  );
  if (candidates === NUTRIENT_IDS.kcal && energy && typeof energy.value === "number") return energy.value;
  return 0;
}

function scoreMatch(query: string, description: string): number {
  // Token-overlap score. We require at least one substantive token to match
  // so we don't fall back to wildly unrelated items.
  const q = query.toLowerCase().split(/[^a-z]+/).filter((t) => t.length >= 3);
  const d = description.toLowerCase();
  let score = 0;
  for (const tok of q) {
    if (d.includes(tok)) score++;
  }
  return score;
}

async function searchUSDA(query: string): Promise<USDAFood | null> {
  // Try data types in order; for each result set, score by token overlap with
  // the query so we don't accept totally unrelated matches.
  const tryTypes = ["Foundation", "SR Legacy", "Survey (FNDDS)", null];
  const queryTokenCount = query.toLowerCase().split(/[^a-z]+/).filter((t) => t.length >= 3).length;
  const minScore = Math.max(1, Math.ceil(queryTokenCount / 2));

  let bestOverall: { food: USDAFood; score: number } | null = null;

  for (const dt of tryTypes) {
    const params = new URLSearchParams({
      api_key: API_KEY!,
      query,
      pageSize: "10",
    });
    if (dt) params.append("dataType", dt);
    const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?${params.toString()}`);
    if (!res.ok) continue;
    const data: { foods?: USDAFood[] } = await res.json();
    if (!data.foods || data.foods.length === 0) continue;

    // Rank candidates: higher token-overlap + has kcal > 0
    const ranked = data.foods
      .map((f) => {
        const hasKcal = findNutrient(f, NUTRIENT_IDS.kcal) > 0;
        return { food: f, score: scoreMatch(query, f.description) + (hasKcal ? 0.5 : 0) };
      })
      .sort((a, b) => b.score - a.score);

    const top = ranked[0];
    if (top && top.score >= minScore) {
      return top.food;
    }
    if (top && (!bestOverall || top.score > bestOverall.score)) {
      bestOverall = top;
    }
  }

  // Fallback: use best partial match if we found something with at least 1 token
  return bestOverall && bestOverall.score >= 1 ? bestOverall.food : null;
}

// ============================================================================
// Resolve one food: search USDA + compute exchange portion
// ============================================================================

async function resolveFood(entry: FoodEntry, groupKey: string): Promise<ResolvedFood | null> {
  const usda = await searchUSDA(entry.query);
  if (!usda) {
    console.log(`  ❌ no match for "${entry.query}"`);
    return null;
  }

  const kcal100 = findNutrient(usda, NUTRIENT_IDS.kcal);
  const prot100 = findNutrient(usda, NUTRIENT_IDS.protein);
  const fat100  = findNutrient(usda, NUTRIENT_IDS.fat);
  const carb100 = findNutrient(usda, NUTRIENT_IDS.carbs);
  const fiber100 = findNutrient(usda, NUTRIENT_IDS.fiber);

  if (kcal100 <= 0) {
    console.log(`  ⚠️  kcal=0 for "${entry.es}", skipping`);
    return null;
  }

  // Compute grams that match target kcal
  const target = GROUP_TARGETS[groupKey];
  let grams: number;
  if (groupKey === "bebidas_deporte") {
    // Fixed standard 240 ml serving; macros reflect what that actually contains
    grams = 240;
  } else {
    grams = (target.kcal / kcal100) * 100;
  }

  // Sanity bounds (looser for bebidas)
  const maxGrams = groupKey === "bebidas_deporte" ? 500 : 350;
  if (grams < 2 || grams > maxGrams) {
    console.log(`  ⚠️  out-of-bounds portion (${grams.toFixed(0)} g) for "${entry.es}", skipping`);
    return null;
  }

  const serving = formatServing(grams, groupKey);

  // Scale macros to this portion
  const factor = grams / 100;
  return {
    group_key: groupKey,
    food_name_es: entry.es,
    food_name_en: entry.en,
    serving_g: Math.round(grams * 10) / 10,
    serving_desc_es: serving.es,
    serving_desc_en: serving.en,
    kcal: Math.round(kcal100 * factor),
    protein_g: Math.round(prot100 * factor * 10) / 10,
    carbs_g: Math.round(carb100 * factor * 10) / 10,
    fat_g: Math.round(fat100 * factor * 10) / 10,
    fiber_g: Math.round(fiber100 * factor * 10) / 10,
    fdc_id: usda.fdcId,
  };
}

// ============================================================================
// SQL generation
// ============================================================================

function escape(s: string): string {
  return s.replace(/'/g, "''");
}

function generateSQL(foods: ResolvedFood[]): string {
  const lines: string[] = [
    "-- ============================================================================",
    "-- USDA bilingual food catalog seed",
    `-- Generated: ${new Date().toISOString()}`,
    `-- Source: USDA FoodData Central (https://fdc.nal.usda.gov)`,
    `-- ${foods.length} foods across ${new Set(foods.map((f) => f.group_key)).size} groups`,
    "-- ============================================================================",
    "",
    "-- Wipe existing seed equivalents (user_id is null) to avoid duplicates",
    "delete from public.equivalents where user_id is null;",
    "",
    "-- Insert curated bilingual catalog",
    "insert into public.equivalents (",
    "  user_id, group_name, group_key,",
    "  food_name, food_name_es, food_name_en,",
    "  serving_desc, serving_desc_es, serving_desc_en,",
    "  serving_g, kcal, protein_g, carbs_g, fat_g, fiber_g,",
    "  source, fdc_id",
    ") values",
  ];

  const rows = foods.map((f, i) => {
    const isLast = i === foods.length - 1;
    return `  (null, '${escape(f.group_key)}', '${escape(f.group_key)}', ` +
      `'${escape(f.food_name_es)}', '${escape(f.food_name_es)}', '${escape(f.food_name_en)}', ` +
      `'${escape(f.serving_desc_es)}', '${escape(f.serving_desc_es)}', '${escape(f.serving_desc_en)}', ` +
      `${f.serving_g}, ${f.kcal}, ${f.protein_g}, ${f.carbs_g}, ${f.fat_g}, ${f.fiber_g}, ` +
      `'usda', ${f.fdc_id})${isLast ? ";" : ","}`;
  });

  return lines.concat(rows).join("\n") + "\n";
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const catalogPath = path.join(process.cwd(), "data", "food_catalog.json");
  const catalog: Catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

  const allFoods: ResolvedFood[] = [];
  let total = 0;
  let resolved = 0;

  for (const [groupKey, entries] of Object.entries(catalog)) {
    if (groupKey.startsWith("_") || !entries) continue;
    if (!GROUP_TARGETS[groupKey]) {
      console.warn(`Skipping unknown group: ${groupKey}`);
      continue;
    }
    console.log(`\n=== ${groupKey} (${entries.length} items) ===`);
    for (const entry of entries) {
      total++;
      try {
        const food = await resolveFood(entry, groupKey);
        if (food) {
          allFoods.push(food);
          resolved++;
          console.log(`  ✓ ${entry.es} → ${food.serving_desc_es} · ${food.kcal} kcal · P${food.protein_g} C${food.carbs_g} G${food.fat_g}`);
        }
      } catch (err) {
        console.error(`  ❌ error on "${entry.es}":`, err);
      }
      // Throttle: USDA allows 1000 req/hour, be conservative
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  const sql = generateSQL(allFoods);
  const outPath = path.join(process.cwd(), "supabase", "seed_usda_bilingual.sql");
  fs.writeFileSync(outPath, sql);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Resolved ${resolved}/${total} foods`);
  console.log(`SQL written to: ${outPath}`);
  console.log(`Next: paste the SQL into Supabase SQL Editor → Run`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
