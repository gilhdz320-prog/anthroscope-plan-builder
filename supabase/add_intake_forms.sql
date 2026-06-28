-- =============================================================================
-- Anthroscope Plan Builder — Client Intake Forms
-- =============================================================================
-- Shareable, token-based intake forms the nutritionist sends to a client.
-- The client fills the form (no auth) and the data feeds the caloric calculator.
-- Run via Supabase SQL Editor or `supabase db reset`.
-- =============================================================================

create table if not exists public.intake_forms (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid references public.profiles(id) on delete cascade,
  client_name text,
  token text unique not null default encode(gen_random_bytes(24), 'hex'),
  status text default 'pending' check (status in ('pending', 'completed')),
  -- Client-filled fields
  age integer,
  sex text check (sex in ('male', 'female')),
  height_cm numeric(5,1),
  weight_kg numeric(5,1),
  activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal text check (goal in ('lose_fat', 'maintain', 'gain_muscle')),
  -- Body composition (optional)
  has_body_comp boolean default false,
  body_fat_pct numeric(4,1),
  lean_mass_kg numeric(5,1),
  -- Notes
  client_notes text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create index if not exists intake_forms_nutritionist_idx
  on public.intake_forms (nutritionist_id);
create index if not exists intake_forms_token_idx
  on public.intake_forms (token);

alter table public.intake_forms enable row level security;

-- The nutritionist can fully manage their own intake forms.
drop policy if exists "intake_forms_owner_all" on public.intake_forms;
create policy "intake_forms_owner_all"
  on public.intake_forms for all
  using (auth.uid() = nutritionist_id)
  with check (auth.uid() = nutritionist_id);

-- Note: the public client-facing form does NOT use these policies. It reads and
-- writes through the service-role key inside the /api/intake/[token] route,
-- where the unguessable token is the security boundary. RLS therefore stays
-- locked to the owning nutritionist for all authenticated access.

-- =============================================================================
-- End
-- =============================================================================
