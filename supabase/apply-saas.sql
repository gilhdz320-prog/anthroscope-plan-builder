-- ============================================================================
-- ANTHROSCOPE PLAN BUILDER — ACTIVAR SUSCRIPCIONES Y MÉTRICAS
-- ----------------------------------------------------------------------------
-- Archivo SEGURO para pegar sobre una base que YA TIENE DATOS.
-- No borra nada: solo crea tablas/funciones/trigger que faltan (IF NOT EXISTS
-- y CREATE OR REPLACE). Se puede ejecutar dos veces sin romper nada.
--
-- Orden interno:
--   1. access_codes.sql  (funciones user_has_paid_access / redeem_access_code)
--   2. subscriptions.sql (tabla, trial automático, user_has_app_access)
--   3. analytics.sql     (eventos del embudo)
--
-- GENERADO por scripts/build-apply-saas.mjs — no editar a mano.
-- ============================================================================


-- ============================================================================
-- ORIGEN: supabase/access_codes.sql
-- ============================================================================

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

-- ============================================================================
-- ORIGEN: supabase/subscriptions.sql
-- ============================================================================

-- ============================================================================
-- Anthroscope Plan Builder — Suscripciones (SaaS)
-- ----------------------------------------------------------------------------
-- Modelo: cada nutrióloga = un auth.user. Su acceso se resuelve con:
--   1) legacy: código de acceso comprado (pago único, acceso de por vida)
--   2) suscripción: fila en public.subscriptions (app trial o Stripe)
--
-- Depende de: access_codes.sql (función user_has_paid_access).
-- Ejecutar DESPUÉS de access_codes.sql — el bootstrap lo ordena.
-- ============================================================================

-- 1) Tabla de suscripciones (una por usuaria)
create table if not exists public.subscriptions (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text unique,
  plan                   text,                        -- 'monthly' | 'annual'
  status                 text not null default 'trialing',
  -- trialing | active | past_due | canceled | unpaid | incomplete | incomplete_expired | paused
  provider               text not null default 'app',  -- 'app' (trial local) | 'stripe'
  trial_end              timestamptz,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  trial_reminder_sent_at timestamptz,                  -- evita duplicar el aviso de fin de prueba
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists subscriptions_customer_idx
  on public.subscriptions (stripe_customer_id);
create index if not exists subscriptions_status_idx
  on public.subscriptions (status);
create index if not exists subscriptions_trial_end_idx
  on public.subscriptions (status, trial_end) where trial_end is not null;

-- 2) RLS: la usuaria puede LEER su propia fila. Nadie escribe desde el cliente:
--    solo service_role (webhook) y las server actions con admin client.
alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

revoke insert, update, delete on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;

-- 3) Trial automático al crear la cuenta (14 días, sin tarjeta).
--    Va por trigger para que funcione con cualquier flujo de alta
--    (email confirmado, magic link, invitación) sin depender del código.
create or replace function public.start_trial_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (
    user_id, status, provider, trial_end, current_period_end
  )
  values (
    new.id, 'trialing', 'app', now() + interval '14 days', now() + interval '14 days'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_trial on auth.users;
create trigger on_auth_user_created_trial
  after insert on auth.users
  for each row execute function public.start_trial_on_signup();

-- 4) Acceso efectivo: código legacy O suscripción vigente (con gracia por impago)
create or replace function public.user_has_app_access(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    public.user_has_paid_access(p_user_id)
    or exists (
      select 1
      from public.subscriptions s
      where s.user_id = p_user_id
        and (
          s.status in ('trialing', 'active')
          or (
            s.status = 'past_due'
            and coalesce(s.current_period_end, now()) + interval '5 days' > now()
          )
        )
    );
$$;

grant execute on function public.user_has_app_access(uuid) to anon, authenticated;

-- 5) Días de trial restantes (null si no aplica)
create or replace function public.trial_days_left(p_user_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  select greatest(
    0,
    ceil(extract(epoch from (s.trial_end - now())) / 86400)::integer
  )
  from public.subscriptions s
  where s.user_id = p_user_id
    and s.status = 'trialing'
    and s.trial_end is not null;
$$;

grant execute on function public.trial_days_left(uuid) to anon, authenticated;

-- ============================================================================
-- ORIGEN: supabase/analytics.sql
-- ============================================================================

-- ============================================================================
-- Anthroscope Plan Builder — Métricas del embudo
-- ----------------------------------------------------------------------------
-- Eventos mínimos para responder: ¿dónde se cae la gente?
--   visita → registro → paciente creado → plan creado → PDF → pago
--
-- Sin cookies de terceros ni datos de pacientes: solo el nombre del evento,
-- el id de la usuaria y propiedades no sensibles.
-- ============================================================================

create table if not exists public.analytics_events (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users (id) on delete set null,
  name        text not null,
  props       jsonb not null default '{}'::jsonb,
  path        text,
  created_at  timestamptz not null default now()
);

create index if not exists analytics_events_name_created_idx
  on public.analytics_events (name, created_at desc);
create index if not exists analytics_events_user_idx
  on public.analytics_events (user_id, created_at desc);

alter table public.analytics_events enable row level security;

-- Las usuarias no leen ni escriben la tabla directamente: todo pasa por
-- /api/track (server) y por las server actions con service role.
revoke all on public.analytics_events from anon, authenticated;

-- Vista del embudo de los últimos 30 días (para el panel de admin).
create or replace view public.funnel_30d as
select
  name,
  count(*)                                        as events,
  count(distinct user_id)                         as users,
  min(created_at)                                 as first_seen,
  max(created_at)                                 as last_seen
from public.analytics_events
where created_at > now() - interval '30 days'
group by name
order by events desc;

-- ============================================================================
-- 4) BACKFILL: cuentas existentes conservan acceso
-- ============================================================================
-- El trigger del trial solo aplica a usuarios NUEVOS. Quien ya tenía cuenta
-- (fundadoras, compradoras del pago único) se queda sin fila y el dashboard la
-- mandaría a /suscripcion. Esta inserción les da acceso permanente.
-- Idempotente: no toca a quien ya tiene fila.

insert into public.subscriptions (user_id, status, provider)
select u.id, 'active', 'legacy'
from auth.users u
where not exists (
  select 1 from public.subscriptions s where s.user_id = u.id
)
on conflict (user_id) do nothing;

-- Comprobación: cuántas cuentas tienen acceso
select
  (select count(*) from auth.users) as cuentas_totales,
  (select count(*) from public.subscriptions) as cuentas_con_acceso;
