-- =============================================================================
-- Anthroscope Plan Builder — Dietary Preferences & Allergies for Intake Forms
-- =============================================================================
-- Adds allergy, diet type, and food dislikes fields to intake_forms so the
-- nutritionist receives actionable dietary context before creating a plan.
-- Run via Supabase SQL Editor or `supabase db reset`.
-- =============================================================================

ALTER TABLE public.intake_forms ADD COLUMN IF NOT EXISTS allergies text[];
ALTER TABLE public.intake_forms ADD COLUMN IF NOT EXISTS diet_type text;
ALTER TABLE public.intake_forms ADD COLUMN IF NOT EXISTS food_dislikes text;

-- diet_type values: 'omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'gluten_free', 'other'

-- =============================================================================
-- End
-- =============================================================================
