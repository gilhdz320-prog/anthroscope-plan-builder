-- ============================================================================
-- Anthroscope Plan Builder — Access Code gating
-- Run this in Supabase SQL Editor (project: vdajfetrigxgzcfjfcls)
-- ============================================================================

-- 1) Table to hold all redeemable access codes
create table if not exists public.access_codes (
  code               text primary key,
  stripe_session_id  text unique,
  customer_email     text not null,
  amount_paid_cents  integer,
  currency           text default 'usd',
  used_at            timestamptz,
  used_by            uuid references auth.users (id) on delete set null,
  created_at         timestamptz not null default now()
);

create index if not exists access_codes_email_idx on public.access_codes (customer_email);
create index if not exists access_codes_used_idx  on public.access_codes (used_at);

-- 2) RLS — codes are NEVER directly readable by users.
-- All validation/redemption goes through SECURITY DEFINER functions below.
alter table public.access_codes enable row level security;

drop policy if exists "access_codes_no_direct_access" on public.access_codes;
create policy "access_codes_no_direct_access"
  on public.access_codes for all
  using (false)
  with check (false);

-- Grant base table access ONLY to service_role (used by webhook).
revoke all on public.access_codes from anon, authenticated;
grant  all on public.access_codes to service_role;

-- 3) Public validator — checks if a code is valid & unused.
-- Returns boolean only; never leaks PII.
create or replace function public.is_valid_access_code(p_code text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.access_codes
    where code = upper(trim(p_code))
      and used_at is null
  );
$$;

grant execute on function public.is_valid_access_code(text) to anon, authenticated;

-- 4) Redemption — marks code as used, ties it to the user.
-- Returns true on success, false if invalid/already-used.
-- Called from signup server action AFTER the user is created.
create or replace function public.redeem_access_code(p_code text, p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  update public.access_codes
     set used_at = now(),
         used_by = p_user_id
   where code = upper(trim(p_code))
     and used_at is null;
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

grant execute on function public.redeem_access_code(text, uuid) to anon, authenticated;

-- 5) Helper: profiles.has_paid_access — quick boolean for UI gates
create or replace function public.user_has_paid_access(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.access_codes where used_by = p_user_id
  );
$$;

grant execute on function public.user_has_paid_access(uuid) to anon, authenticated;
