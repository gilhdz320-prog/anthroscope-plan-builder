-- =============================================================================
-- Anthroscope Plan Builder — Patient Plan View Tokens
-- =============================================================================
-- Shareable, token-based public view of a finished plan. The nutritionist
-- generates a link; the patient opens it (no auth) and can swap foods within
-- an exchange group while keeping the same macros.
--
-- Mirrors the intake_forms token pattern: the unguessable token is the security
-- boundary. RLS stays locked to the owning nutritionist for authenticated
-- access; the public page reads through the service-role key in the
-- /api/plan-view/[token] route.
-- Run via Supabase SQL Editor or `supabase db reset`.
-- =============================================================================

create table if not exists public.plan_view_tokens (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references public.plans (id) on delete cascade,
  token       text not null unique default encode(gen_random_bytes(32), 'hex'),
  expires_at  timestamptz default now() + interval '90 days',
  created_at  timestamptz default now()
);

create index if not exists plan_view_tokens_plan_idx
  on public.plan_view_tokens (plan_id);
create index if not exists plan_view_tokens_token_idx
  on public.plan_view_tokens (token);

alter table public.plan_view_tokens enable row level security;

-- The owning nutritionist can manage view tokens for their own plans.
drop policy if exists "plan_view_tokens_owner_all" on public.plan_view_tokens;
create policy "plan_view_tokens_owner_all"
  on public.plan_view_tokens for all
  using (
    exists (
      select 1 from public.plans p
      where p.id = plan_view_tokens.plan_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.plans p
      where p.id = plan_view_tokens.plan_id and p.user_id = auth.uid()
    )
  );

-- =============================================================================
-- End
-- =============================================================================
