#!/usr/bin/env node
/**
 * Genera supabase/bootstrap.sql a partir de los archivos SQL existentes,
 * en el orden correcto y con cabeceras.
 *
 * Por qué: hoy hay 19 archivos sueltos + 4 migraciones y hay que recordar
 * el orden a mano. Un solo archivo reproducible evita el "funciona en mi
 * máquina" y permite levantar un proyecto nuevo en un paso.
 *
 * Uso:
 *   node scripts/build-sql-bootstrap.mjs          # genera
 *   node scripts/build-sql-bootstrap.mjs --check  # falla si está desactualizado
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const supabaseDir = join(root, "supabase");
const outFile = join(supabaseDir, "bootstrap.sql");

/** Orden de ejecución. Tocar esto = tocar el esquema de producción. */
const FILES = [
  // 1. Núcleo
  "schema.sql",
  // 2. Acceso y cobro
  "access_codes.sql",
  "subscriptions.sql",
  // 3. Métricas
  "analytics.sql",
  // 4. Extensiones del expediente
  "add_dietary_preferences.sql",
  "add_avatar_support.sql",
  "add_equivalentes_to_plans.sql",
  "add_intake_forms.sql",
  "add_missing_templates.sql",
  "add_neat_to_intake.sql",
  "add_patient_view.sql",
  "add_plan_view_function.sql",
  "add_template_meals_food.sql",
  "add_isak_measures.sql",
  "add_isak_progress.sql",
  "migration_bilingual.sql",
  // 5. Permisos y RLS (después de crear tablas)
  "fix_permissions.sql",
  "fix_template_meals_rls.sql",
  // 6. Migraciones incrementales
  "migrations/add_dietary_recalls.sql",
  "migrations/add_nutritionist_profile.sql",
  "migrations/add_progress_tracking.sql",
  "migrations/fix_plan_equivalentes_null.sql",
  // 7. Catálogos (datos)
  "apply_usda_combined.sql",
];

const HEADER = `-- ============================================================================
-- ANTHROSCOPE PLAN BUILDER — BOOTSTRAP ÚNICO
-- ----------------------------------------------------------------------------
-- GENERADO AUTOMÁTICAMENTE por scripts/build-sql-bootstrap.mjs
-- No editar este archivo a mano: edita el SQL de origen y regenera.
--
-- Uso: pegar completo en el SQL Editor de Supabase sobre un proyecto VACÍO,
-- o ejecutar con:  supabase db execute --file supabase/bootstrap.sql
--
-- Incluye: esquema, RLS, códigos de acceso legacy, suscripciones, métricas,
-- migraciones y catálogos de alimentos.
-- Idempotente en su mayor parte (IF NOT EXISTS / CREATE OR REPLACE), pero
-- pensado para ejecutarse sobre una base nueva: los ALTER TABLE de las
-- migraciones no son seguros de repetir.
-- ============================================================================

`;

function build() {
  const parts = [HEADER];
  const missing = [];

  for (const relative of FILES) {
    const path = join(supabaseDir, relative);
    if (!existsSync(path)) {
      missing.push(relative);
      continue;
    }
    const sql = readFileSync(path, "utf8").trimEnd();
    parts.push(
      `\n-- ${"=".repeat(76)}\n-- ORIGEN: supabase/${relative}\n-- ${"=".repeat(76)}\n\n${sql}\n`,
    );
  }

  return { content: parts.join(""), missing };
}

const check = process.argv.includes("--check");
const { content, missing } = build();

if (missing.length > 0) {
  console.error("Faltan archivos declarados en FILES:", missing.join(", "));
  process.exit(1);
}

if (check) {
  const current = existsSync(outFile) ? readFileSync(outFile, "utf8") : "";
  if (current !== content) {
    console.error(
      "supabase/bootstrap.sql está desactualizado. Ejecuta: node scripts/build-sql-bootstrap.mjs",
    );
    process.exit(1);
  }
  console.log("bootstrap.sql está al día.");
  process.exit(0);
}

writeFileSync(outFile, content, "utf8");
const lines = content.split("\n").length;
console.log(`supabase/bootstrap.sql generado: ${lines} líneas, ${FILES.length} archivos.`);
