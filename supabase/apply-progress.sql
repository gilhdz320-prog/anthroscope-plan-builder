-- ============================================================================
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


-- ============================================================================
-- ORIGEN: supabase/migrations/add_progress_tracking.sql
-- ============================================================================

-- Patient progress tracking: longitudinal anthropometry per patient.
-- Each row is one measurement date. Charts on the patient detail page read
-- the last N days from this table.

CREATE TABLE IF NOT EXISTS patient_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  recorded_at date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg decimal(5,2),
  body_fat_pct decimal(4,1),
  lean_mass_kg decimal(5,2),
  waist_cm decimal(5,1),
  hip_cm decimal(5,1),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(patient_id, recorded_at)
);

CREATE INDEX IF NOT EXISTS patient_progress_patient_date_idx
  ON patient_progress (patient_id, recorded_at DESC);

ALTER TABLE patient_progress ENABLE ROW LEVEL SECURITY;

-- Access is gated through ownership of the parent patient row.
DROP POLICY IF EXISTS "patient_progress_select_own" ON patient_progress;
CREATE POLICY "patient_progress_select_own"
  ON patient_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_progress.patient_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "patient_progress_insert_own" ON patient_progress;
CREATE POLICY "patient_progress_insert_own"
  ON patient_progress FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_progress.patient_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "patient_progress_update_own" ON patient_progress;
CREATE POLICY "patient_progress_update_own"
  ON patient_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_progress.patient_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "patient_progress_delete_own" ON patient_progress;
CREATE POLICY "patient_progress_delete_own"
  ON patient_progress FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_progress.patient_id AND p.user_id = auth.uid()
    )
  );

-- ============================================================================
-- ORIGEN: supabase/add_isak_progress.sql
-- ============================================================================

-- ============================================================================
-- Anthroscope Plan Builder — Historial de medidas ISAK
-- ----------------------------------------------------------------------------
-- Añade pliegues y perímetros a `patient_progress`, para poder seguir su
-- evolución en el tiempo (no solo la medida actual del paciente).
--
-- Seguro de ejecutar sobre una base con datos: solo ADD COLUMN IF NOT EXISTS.
-- Unidades: pliegues en mm, perímetros en cm.
-- ============================================================================

alter table public.patient_progress
  add column if not exists fold_triceps_mm     numeric(5, 1),
  add column if not exists fold_subscapular_mm numeric(5, 1),
  add column if not exists fold_biceps_mm      numeric(5, 1),
  add column if not exists fold_iliac_mm       numeric(5, 1),
  add column if not exists fold_supraspinal_mm numeric(5, 1),
  add column if not exists fold_abdominal_mm   numeric(5, 1),
  add column if not exists fold_thigh_mm       numeric(5, 1),
  add column if not exists fold_calf_mm        numeric(5, 1);

alter table public.patient_progress
  add column if not exists girth_arm_cm   numeric(5, 1),
  add column if not exists girth_thigh_cm numeric(5, 1),
  add column if not exists girth_calf_cm  numeric(5, 1),
  add column if not exists girth_chest_cm numeric(5, 1);

-- Verificación: deben salir 12 columnas
select column_name, data_type
from information_schema.columns
where table_name = 'patient_progress'
  and (column_name like 'fold\_%' or column_name like 'girth\_%')
order by column_name;

-- ============================================================================
-- Verificación
-- ============================================================================
select
  (to_regclass('public.patient_progress') is not null) as tabla_existe,
  (
    select count(*) from information_schema.columns
    where table_name = 'patient_progress'
      and (column_name like 'fold\_%' or column_name like 'girth\_%')
  ) as columnas_isak;
