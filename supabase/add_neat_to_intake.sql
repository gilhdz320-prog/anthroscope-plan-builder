-- =============================================================================
-- Anthroscope Plan Builder — NEAT fields for intake forms
-- =============================================================================
-- Adds Non-Exercise Activity Thermogenesis (NEAT) inputs plus structured
-- exercise detail to the client intake form for a more precise caloric estimate.
-- Run via Supabase SQL Editor or `supabase db reset`.
-- =============================================================================

ALTER TABLE public.intake_forms ADD COLUMN IF NOT EXISTS steps_per_day text;
ALTER TABLE public.intake_forms ADD COLUMN IF NOT EXISTS job_type text;
ALTER TABLE public.intake_forms ADD COLUMN IF NOT EXISTS daily_activity text;
ALTER TABLE public.intake_forms ADD COLUMN IF NOT EXISTS sport_type text[];
ALTER TABLE public.intake_forms ADD COLUMN IF NOT EXISTS exercise_days_per_week integer;
ALTER TABLE public.intake_forms ADD COLUMN IF NOT EXISTS exercise_session_duration text;

-- =============================================================================
-- End
-- =============================================================================
