-- =============================================================================
-- Anthroscope Plan Builder — Enhance template_meals with food references
-- =============================================================================
-- Adds equivalent_id and servings columns to template_meals so that templates
-- can store full meal content (not just meal names). When a plan is created
-- from a template, these rows are cloned into plan_meals for immediate editing.
-- Run via Supabase SQL Editor.
-- =============================================================================

-- Add equivalent_id column (nullable — existing rows without food are fine)
alter table public.template_meals
  add column if not exists equivalent_id uuid references public.equivalents (id) on delete set null;

-- Add servings column (default 1)
alter table public.template_meals
  add column if not exists servings numeric(6, 2) not null default 1;

-- =============================================================================
-- End
-- =============================================================================
