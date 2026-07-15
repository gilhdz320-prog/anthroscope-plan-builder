-- =============================================================================
-- Anthroscope Plan Builder — Backfill `plans.equivalentes` for existing plans
-- =============================================================================
-- Background:
--   Prior to the fix in app/dashboard/plans/actions.ts, the `equivalentes`
--   JSONB column was left NULL on every newly created plan. The kcal target
--   and macro split were only persisted as a text summary inside `notes`
--   (e.g. "Meta: 2000 kcal · P150/C200/G67"). This caused:
--     • EquivalentesEditor to default to 2000 kcal on every plan
--     • "Remaining equivalents" panel to show 0/done for every group
--     • SaveAsTemplateButton to create templates with kcal_target = NULL
--
-- This migration backfills the `equivalentes` JSONB for every plan that
-- currently has it NULL, parsing the macro summary out of `notes` (or, when
-- `notes` has no parseable macros, falling back to the template's kcal_target
-- and a default 30/40/30 split).
--
-- Safe to re-run: uses WHERE equivalentes IS NULL.
-- Run via: Supabase SQL Editor (Dashboard) OR `supabase db push`
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: parse "P<digits>/C<digits>/G<digits>" out of a text column.
-- Returns NULL if the pattern isn't found.
-- ---------------------------------------------------------------------------
create or replace function public._parse_macros_from_notes(n text)
returns table (protein_g int, carbs_g int, fat_g int)
language sql
immutable
as $$
  select
    coalesce((regexp_match(n, 'P\s*(\d+)\s*/\s*C\s*\d+\s*/\s*[GF]\s*\d+', 'i'))[1]::int, 0)::int as protein_g,
    coalesce((regexp_match(n, 'P\s*\d+\s*/\s*C\s*(\d+)\s*/\s*[GF]\s*\d+', 'i'))[1]::int, 0)::int as carbs_g,
    coalesce((regexp_match(n, 'P\s*\d+\s*/\s*C\s*\d+\s*/\s*[GF]\s*(\d+)', 'i'))[1]::int, 0)::int as fat_g;
$$;

-- ---------------------------------------------------------------------------
-- Step 1: Backfill plans that have kcal target + macros parseable from notes
-- ---------------------------------------------------------------------------
with parsed as (
  select
    p.id as plan_id,
    p.notes,
    p.plan_mode,
    -- Extract "Meta: <number> kcal" from notes
    coalesce(
      nullif(
        (regexp_match(coalesce(p.notes, ''), 'Meta:\s*(\d+(?:\.\d+)?)\s*kcal', 'i'))[1],
        ''
      ),
      t.kcal_target::text,
      '0'
    )::numeric as kcal_target,
    pm.protein_g,
    pm.carbs_g,
    pm.fat_g
  from public.plans p
  left join public.templates t on t.id = p.template_id
  left join lateral public._parse_macros_from_notes(p.notes) pm on true
  where p.equivalentes is null
)
update public.plans
set equivalentes = jsonb_build_object(
  'mode', parsed.plan_mode,
  'kcalTarget', parsed.kcal_target::int,
  'proteinPct',
    case when (parsed.protein_g * 4 + parsed.carbs_g * 4 + parsed.fat_g * 9) > 0
         then round((parsed.protein_g * 4.0 / (parsed.protein_g * 4 + parsed.carbs_g * 4 + parsed.fat_g * 9)) * 100)::int
         else 30 end,
  'carbsPct',
    case when (parsed.protein_g * 4 + parsed.carbs_g * 4 + parsed.fat_g * 9) > 0
         then round((parsed.carbs_g * 4.0 / (parsed.protein_g * 4 + parsed.carbs_g * 4 + parsed.fat_g * 9)) * 100)::int
         else 40 end,
  'fatPct',
    case when (parsed.protein_g * 4 + parsed.carbs_g * 4 + parsed.fat_g * 9) > 0
         then round((parsed.fat_g * 9.0 / (parsed.protein_g * 4 + parsed.carbs_g * 4 + parsed.fat_g * 9)) * 100)::int
         else 30 end,
  'proteinG', parsed.protein_g,
  'carbsG', parsed.carbs_g,
  'fatG', parsed.fat_g,
  'groups', jsonb_build_object(
    'cereales', 0,
    'leguminosas', 0,
    'verduras', 0,
    'frutas', 0,
    'lacteos', 0,
    'proteinas_ao', 0,
    'proteinas_av', 0,
    'grasas', 0,
    'azucares', 0
  )
)
from parsed
where public.plans.id = parsed.plan_id
  and parsed.kcal_target > 0;

-- ---------------------------------------------------------------------------
-- Step 2: For plans that still have no kcal target (truly empty), default to
-- 2000 kcal + 30/40/30 split so the editor doesn't show 0/blank.
-- ---------------------------------------------------------------------------
update public.plans
set equivalentes = jsonb_build_object(
  'mode', coalesce(plan_mode, 'macros'),
  'kcalTarget', 2000,
  'proteinPct', 30,
  'carbsPct', 40,
  'fatPct', 30,
  'proteinG', 150,
  'carbsG', 200,
  'fatG', 67,
  'groups', jsonb_build_object(
    'cereales', 0,
    'leguminosas', 0,
    'verduras', 0,
    'frutas', 0,
    'lacteos', 0,
    'proteinas_ao', 0,
    'proteinas_av', 0,
    'grasas', 0,
    'azucares', 0
  )
)
where equivalentes is null;

-- ---------------------------------------------------------------------------
-- Step 3: Also repair templates that were saved from buggy plans (kcal_target
-- is NULL but a description with "Meta: <n> kcal" or "P\d/C\d/G\d" exists).
-- ---------------------------------------------------------------------------
update public.templates
set kcal_target = coalesce(
  kcal_target,
  nullif(
    (regexp_match(coalesce(description, ''), 'Meta:\s*(\d+(?:\.\d+)?)\s*kcal', 'i'))[1],
    ''
  )::numeric
)
where kcal_target is null
  and description is not null;

-- ---------------------------------------------------------------------------
-- Cleanup: drop the helper function (it was only needed for this migration)
-- ---------------------------------------------------------------------------
drop function if exists public._parse_macros_from_notes(text);

-- =============================================================================
-- End of migration
-- =============================================================================
