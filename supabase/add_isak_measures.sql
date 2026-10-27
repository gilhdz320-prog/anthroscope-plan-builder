-- ============================================================================
-- Anthroscope Plan Builder — Medidas ISAK (pliegues y perímetros)
-- ----------------------------------------------------------------------------
-- Añade a `patients` los 8 pliegues del protocolo ISAK y 4 perímetros
-- adicionales. Son columnas opcionales: quien no los use no ve nada distinto.
--
-- Seguro de ejecutar sobre una base con datos: solo ALTER ... ADD COLUMN
-- IF NOT EXISTS, no borra ni reescribe nada.
--
-- Unidades: pliegues en milímetros (mm), perímetros en centímetros (cm).
-- ============================================================================

-- Pliegues ISAK (8 sitios)
alter table public.patients
  add column if not exists fold_triceps_mm     numeric(5, 1),
  add column if not exists fold_subscapular_mm numeric(5, 1),
  add column if not exists fold_biceps_mm      numeric(5, 1),
  add column if not exists fold_iliac_mm       numeric(5, 1),
  add column if not exists fold_supraspinal_mm numeric(5, 1),
  add column if not exists fold_abdominal_mm   numeric(5, 1),
  add column if not exists fold_thigh_mm       numeric(5, 1),
  add column if not exists fold_calf_mm        numeric(5, 1);

-- Perímetros adicionales
alter table public.patients
  add column if not exists girth_arm_cm      numeric(5, 1),
  add column if not exists girth_thigh_cm    numeric(5, 1),
  add column if not exists girth_calf_cm     numeric(5, 1),
  add column if not exists girth_chest_cm    numeric(5, 1);

comment on column public.patients.fold_triceps_mm is 'Pliegue tricipital (mm) — ISAK';
comment on column public.patients.fold_subscapular_mm is 'Pliegue subescapular (mm) — ISAK';
comment on column public.patients.fold_biceps_mm is 'Pliegue bicipital (mm) — ISAK';
comment on column public.patients.fold_iliac_mm is 'Pliegue cresta ilíaca (mm) — ISAK';
comment on column public.patients.fold_supraspinal_mm is 'Pliegue supraespinal (mm) — ISAK';
comment on column public.patients.fold_abdominal_mm is 'Pliegue abdominal (mm) — ISAK';
comment on column public.patients.fold_thigh_mm is 'Pliegue muslo frontal (mm) — ISAK';
comment on column public.patients.fold_calf_mm is 'Pliegue pantorrilla medial (mm) — ISAK';

-- Verificación
select column_name, data_type
from information_schema.columns
where table_name = 'patients'
  and (column_name like 'fold\_%' or column_name like 'girth\_%')
order by column_name;
