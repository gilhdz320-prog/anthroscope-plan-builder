-- ============================================================================
-- MIGRATION: bilingual equivalents (en/es) + canonical group keys + USDA source
-- ============================================================================
-- Apply in Supabase SQL Editor AFTER schema.sql and fix_permissions.sql.
-- Safe to run multiple times (idempotent).
-- ============================================================================

-- 1. Add locale to profiles (per-user UI language preference)
alter table public.profiles
  add column if not exists locale text not null default 'es' check (locale in ('es', 'en'));

-- 2. Extend equivalents with bilingual fields + canonical group + USDA source
alter table public.equivalents
  add column if not exists food_name_en text,
  add column if not exists food_name_es text,
  add column if not exists serving_desc_en text,
  add column if not exists serving_desc_es text,
  add column if not exists group_key text,
  add column if not exists fiber_g numeric(7, 2),
  add column if not exists source text default 'manual' check (source in ('manual', 'usda', 'mexico_inn', 'custom')),
  add column if not exists fdc_id integer;

-- Index for fast filtering by group_key
create index if not exists equivalents_group_key_idx on public.equivalents (group_key);
create index if not exists equivalents_source_idx on public.equivalents (source);
create index if not exists equivalents_fdc_id_idx on public.equivalents (fdc_id) where fdc_id is not null;

-- 3. Canonical food groups (single source of truth for category labels)
create table if not exists public.food_groups (
  key            text primary key,
  name_es        text not null,
  name_en        text not null,
  display_order  smallint not null default 0,
  exchange_kcal  numeric(5, 1),
  exchange_protein_g numeric(5, 1),
  exchange_carbs_g numeric(5, 1),
  exchange_fat_g numeric(5, 1),
  notes_es       text,
  notes_en       text
);

alter table public.food_groups enable row level security;

drop policy if exists "food_groups_select_all" on public.food_groups;
create policy "food_groups_select_all"
  on public.food_groups for select
  to authenticated
  using (true);

-- Seed canonical groups (Sistema Mexicano de Equivalentes + ADA Exchanges)
insert into public.food_groups (key, name_es, name_en, display_order, exchange_kcal, exchange_protein_g, exchange_carbs_g, exchange_fat_g, notes_es, notes_en) values
  ('cereales',        'Cereales y tubérculos',  'Grains & starches',     1, 70,  2, 15, 0,  'Sin grasa adicional', 'Without added fat'),
  ('cereales_grasa',  'Cereales con grasa',     'Grains with fat',       2, 115, 2, 15, 5,  'Con grasa añadida',   'With added fat'),
  ('leguminosas',     'Leguminosas',            'Legumes',               3, 120, 8, 20, 1,  'Frijol, lenteja, garbanzo', 'Beans, lentils, chickpeas'),
  ('verduras',        'Verduras',               'Vegetables',            4, 25,  2, 4,  0,  'No incluye almidonadas', 'Non-starchy'),
  ('frutas',          'Frutas',                 'Fruits',                5, 60,  0, 15, 0,  null, null),
  ('lacteos_descremados', 'Lácteos descremados', 'Skim dairy',           6, 95,  9, 12, 0,  null, null),
  ('lacteos_semi',    'Lácteos semidescremados', 'Reduced-fat dairy',    7, 110, 9, 12, 4,  null, null),
  ('lacteos_enteros', 'Lácteos enteros',        'Whole dairy',           8, 150, 9, 12, 8,  null, null),
  ('proteina_muy_baja', 'Proteínas muy bajas en grasa', 'Very lean protein', 9, 40, 7, 0, 1, '~3 g grasa o menos', '~3 g fat or less'),
  ('proteina_baja',   'Proteínas bajas en grasa', 'Lean protein',        10, 55, 7, 0, 3, null, null),
  ('proteina_media',  'Proteínas moderadas en grasa', 'Medium-fat protein', 11, 75, 7, 0, 5, null, null),
  ('proteina_alta',   'Proteínas altas en grasa', 'High-fat protein',    12, 100, 7, 0, 8, null, null),
  ('grasas_mono',     'Grasas monoinsaturadas', 'Monounsaturated fats',  13, 45, 0, 0, 5, 'Aceite oliva, aguacate', 'Olive oil, avocado'),
  ('grasas_poli',     'Grasas poliinsaturadas', 'Polyunsaturated fats',  14, 45, 0, 0, 5, null, null),
  ('grasas_saturadas', 'Grasas saturadas',       'Saturated fats',        15, 45, 0, 0, 5, 'Mantequilla, manteca', 'Butter, lard'),
  ('azucares',        'Azúcares libres',        'Free sugars',           16, 40, 0, 10, 0, 'Mermelada, miel, azúcar', 'Jam, honey, sugar'),
  ('bebidas_deporte', 'Bebidas deportivas',     'Sports drinks',         17, 50, 0, 14, 0, 'Por porción de 240 ml', 'Per 240 ml serving')
on conflict (key) do update set
  name_es = excluded.name_es,
  name_en = excluded.name_en,
  display_order = excluded.display_order,
  exchange_kcal = excluded.exchange_kcal,
  exchange_protein_g = excluded.exchange_protein_g,
  exchange_carbs_g = excluded.exchange_carbs_g,
  exchange_fat_g = excluded.exchange_fat_g,
  notes_es = excluded.notes_es,
  notes_en = excluded.notes_en;

-- 4. Backfill existing rows: copy food_name -> food_name_es, infer group_key from group_name
update public.equivalents
set food_name_es = coalesce(food_name_es, food_name),
    serving_desc_es = coalesce(serving_desc_es, serving_desc)
where food_name_es is null;

-- Best-effort group_key inference from old group_name (Spanish or English)
update public.equivalents set group_key = case
  when lower(group_name) in ('almidones', 'cereals', 'cereales', 'cereales y tuberculos') then 'cereales'
  when lower(group_name) in ('leguminosas', 'legumes') then 'leguminosas'
  when lower(group_name) in ('verduras', 'vegetables') then 'verduras'
  when lower(group_name) in ('frutas', 'fruits') then 'frutas'
  when lower(group_name) in ('lacteos', 'lácteos', 'dairy') then 'lacteos_descremados'
  when lower(group_name) in ('proteins', 'proteinas', 'proteínas') then 'proteina_baja'
  when lower(group_name) in ('grasas', 'fats') then 'grasas_mono'
  when lower(group_name) in ('azucares', 'azúcares', 'sugars') then 'azucares'
  else group_key
end
where group_key is null;
