#!/usr/bin/env node
/**
 * Genera supabase/apply-saas.sql: el archivo que se pega en Supabase para
 * activar suscripciones + métricas sobre una base que YA tiene datos.
 *
 * Solo incluye SQL idempotente (IF NOT EXISTS / CREATE OR REPLACE), por eso es
 * seguro ejecutarlo sobre producción sin tocar pacientes ni planes.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const supabase = join(root, "supabase");
const FILES = ["access_codes.sql", "subscriptions.sql", "analytics.sql"];

const header = `-- ============================================================================
-- ANTHROSCOPE PLAN BUILDER — ACTIVAR SUSCRIPCIONES Y MÉTRICAS
-- ----------------------------------------------------------------------------
-- Archivo SEGURO para pegar sobre una base que YA TIENE DATOS.
-- No borra nada: solo crea tablas/funciones/trigger que faltan (IF NOT EXISTS
-- y CREATE OR REPLACE). Se puede ejecutar dos veces sin romper nada.
--
-- Orden interno:
--   1. access_codes.sql  (funciones user_has_paid_access / redeem_access_code)
--   2. subscriptions.sql (tabla, trial automático, user_has_app_access)
--   3. analytics.sql     (eventos del embudo)
--
-- GENERADO por scripts/build-apply-saas.mjs — no editar a mano.
-- ============================================================================

`;

const parts = [header];
for (const file of FILES) {
  const sql = readFileSync(join(supabase, file), "utf8").trimEnd();
  parts.push(`\n-- ${"=".repeat(76)}\n-- ORIGEN: supabase/${file}\n-- ${"=".repeat(76)}\n\n${sql}\n`);
}

// 4) Cuentas que ya existían: conservan el acceso (fundadoras y compradoras del
//    pago único). Sin esto, el trigger no las cubre y quedarían bloqueadas.
const backfill = `\n-- ${"=".repeat(76)}
-- 4) BACKFILL: cuentas existentes conservan acceso
-- ${"=".repeat(76)}
-- El trigger del trial solo aplica a usuarios NUEVOS. Quien ya tenía cuenta
-- (fundadoras, compradoras del pago único) se queda sin fila y el dashboard la
-- mandaría a /suscripcion. Esta inserción les da acceso permanente.
-- Idempotente: no toca a quien ya tiene fila.

insert into public.subscriptions (user_id, status, provider)
select u.id, 'active', 'legacy'
from auth.users u
where not exists (
  select 1 from public.subscriptions s where s.user_id = u.id
)
on conflict (user_id) do nothing;

-- Comprobación: cuántas cuentas tienen acceso
select
  (select count(*) from auth.users) as cuentas_totales,
  (select count(*) from public.subscriptions) as cuentas_con_acceso;
`;

parts.push(backfill);

writeFileSync(join(supabase, "apply-saas.sql"), parts.join(""), "utf8");
console.log("supabase/apply-saas.sql generado.");
