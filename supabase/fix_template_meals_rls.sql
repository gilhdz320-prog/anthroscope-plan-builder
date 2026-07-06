-- =============================================================================
-- Fix: Apply RLS policy for template_meals so authenticated users can read
-- seed/public templates' meals.
-- Run in Supabase SQL Editor.
-- =============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.template_meals ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the SELECT policy
DROP POLICY IF EXISTS "template_meals_select" ON public.template_meals;
CREATE POLICY "template_meals_select"
  ON public.template_meals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = template_meals.template_id
        AND (t.user_id = auth.uid() OR t.is_public = true OR t.is_seed = true)
    )
  );

-- Also allow anon to read seed/public template meals (for public plan views)
DROP POLICY IF EXISTS "template_meals_select_anon" ON public.template_meals;
CREATE POLICY "template_meals_select_anon"
  ON public.template_meals FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = template_meals.template_id
        AND (t.is_public = true OR t.is_seed = true)
    )
  );

-- Drop and recreate the modify policy (only own templates)
DROP POLICY IF EXISTS "template_meals_modify" ON public.template_meals;
CREATE POLICY "template_meals_modify"
  ON public.template_meals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = template_meals.template_id AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = template_meals.template_id AND t.user_id = auth.uid()
    )
  );

-- Grant table access
GRANT SELECT ON public.template_meals TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.template_meals TO authenticated;
GRANT ALL ON public.template_meals TO service_role;

-- =============================================================================
-- Verify: should return 808 rows when run as postgres role
-- =============================================================================
-- SELECT count(*) FROM public.template_meals;
