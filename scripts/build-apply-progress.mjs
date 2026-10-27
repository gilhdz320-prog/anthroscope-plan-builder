#!/usr/bin/env node
/**
 * Genera supabase/apply-progress.sql: crea la tabla patient_progress (si falta)
 * con RLS, y le añade las columnas ISAK.
 *
 * Se usa cuando la base se creó antes de que existiera el seguimiento de
 * progreso — que es el caso de producción hoy.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const supabase = join(root, "supabase");

const FILES = [
  "migrations/add_progress_tracking.sql",
  "add_isak_progress.sql",
];

const header = `-- ============================================================================
-- ANTHROSCOPE PLAN BUILDER — HABILITAR SEGUIMIENTO DE PROGRESO
-- ----------------------------------------------------------------------------
-- Crea public.patient_progress con sus políticas RLS y le añade las columnas
-- ISAK (pliegues y perímetros). Idempotente: se puede ejecutar varias veces.
--
-- Necesario si el panel decía "Registrar hoy" pero no guardaba nada, o si el
-- SQL Editor devolvió: relation "public.patient_progress" does not exist.
--
-- GENERADO por scripts/build-apply-progress.mjs — no editar a mano.
-- ============================================================================

`;

const parts = [header];
for (const file of FILES) {
  const sql = readFileSync(join(supabase, file), "utf8").trimEnd();
  parts.push(`\n-- ${"=".repeat(76)}\n-- ORIGEN: supabase/${file}\n-- ${"=".repeat(76)}\n\n${sql}\n`);
}

// Diagnóstico final: confirma tabla + columnas
parts.push(`
-- ${"=".repeat(76)}
-- Verificación
-- ${"=".repeat(76)}
select
  (to_regclass('public.patient_progress') is not null) as tabla_existe,
  (
    select count(*) from information_schema.columns
    where table_name = 'patient_progress'
      and (column_name like 'fold\\_%' or column_name like 'girth\\_%')
  ) as columnas_isak;
`);

writeFileSync(join(supabase, "apply-progress.sql"), parts.join(""), "utf8");
console.log("supabase/apply-progress.sql generado.");
