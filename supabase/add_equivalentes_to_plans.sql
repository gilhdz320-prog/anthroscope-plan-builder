-- =============================================================================
-- Add dual-mode (Macros / Equivalentes) support to plans
-- =============================================================================
-- Run via Supabase SQL Editor or: supabase db push
-- Stores the Mexican food equivalents distribution + the active planning mode.
-- =============================================================================

alter table public.plans
  add column if not exists equivalentes jsonb;

alter table public.plans
  add column if not exists plan_mode text default 'macros'
    check (plan_mode in ('macros', 'equivalentes'));
