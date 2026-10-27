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
