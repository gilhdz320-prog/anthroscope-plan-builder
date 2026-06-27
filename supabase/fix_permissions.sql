-- ============================================================================
-- FIX: permission denied for tables (templates, equivalents, etc.)
-- Run this in Supabase SQL Editor if you see "permission denied for table X"
-- ============================================================================
-- This grants the `authenticated` and `anon` roles access to public schema
-- tables. RLS policies still control which rows each user can see/modify.
-- ============================================================================

-- Grant usage on schema
grant usage on schema public to anon, authenticated;

-- Grant table-level privileges (RLS still enforces row-level access)
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

-- Grant access to sequences (for auto-generated IDs if any)
grant usage, select on all sequences in schema public to authenticated;

-- Make sure future tables also get these grants automatically
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;

-- ============================================================================
-- Verify policies exist on the key tables (no-op if they already exist)
-- ============================================================================

-- Templates: signed-in users can read public/seed templates + their own
drop policy if exists "templates_select_own_or_public" on public.templates;
create policy "templates_select_own_or_public"
  on public.templates for select
  to authenticated
  using (auth.uid() = user_id or is_public = true or is_seed = true);

-- Equivalents: signed-in users can read system equivalents + their own
drop policy if exists "equivalents_select" on public.equivalents;
create policy "equivalents_select"
  on public.equivalents for select
  to authenticated
  using (user_id is null or auth.uid() = user_id);

-- ============================================================================
-- Sanity check (optional): list how many rows each role can see right now
-- ============================================================================
-- You can run this separately after the grants above:
--   select count(*) from public.templates;
--   select count(*) from public.equivalents;
