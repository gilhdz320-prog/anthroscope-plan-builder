-- ============================================================================
-- ANTHROSCOPE PLAN BUILDER — BOOTSTRAP ÚNICO
-- ----------------------------------------------------------------------------
-- GENERADO AUTOMÁTICAMENTE por scripts/build-sql-bootstrap.mjs
-- No editar este archivo a mano: edita el SQL de origen y regenera.
--
-- Uso: pegar completo en el SQL Editor de Supabase sobre un proyecto VACÍO,
-- o ejecutar con:  supabase db execute --file supabase/bootstrap.sql
--
-- Incluye: esquema, RLS, códigos de acceso legacy, suscripciones, métricas,
-- migraciones y catálogos de alimentos.
-- Idempotente en su mayor parte (IF NOT EXISTS / CREATE OR REPLACE), pero
-- pensado para ejecutarse sobre una base nueva: los ALTER TABLE de las
-- migraciones no son seguros de repetir.
-- ============================================================================


-- ============================================================================
-- ORIGEN: supabase/schema.sql
-- ============================================================================

-- =============================================================================
-- Anthroscope Plan Builder — Schema (v2: with RLS policies + extended patient fields)
-- =============================================================================
-- Run via: supabase db reset (local) OR paste in Supabase SQL Editor (cloud)
-- All tables live in the `public` schema.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  role        text not null default 'nutritionist',
  locale      text not null default 'es',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Trigger: auto-create profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. purchases
-- ---------------------------------------------------------------------------
create table if not exists public.purchases (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  product_id   text,
  status       text not null default 'active',
  started_at   timestamptz not null default now(),
  expires_at   timestamptz,
  created_at   timestamptz not null default now()
);

alter table public.purchases enable row level security;

drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own"
  on public.purchases for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. patients  (EXTENDED: anthropometry + sport)
-- ---------------------------------------------------------------------------
create table if not exists public.patients (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  -- Basics
  first_name      text not null,
  last_name       text not null,
  email           text,
  birth_date      date,
  sex             text,
  phone           text,
  notes           text,
  -- Anthropometry (optional)
  weight_kg       numeric(6, 2),
  height_cm       numeric(6, 2),
  body_fat_pct    numeric(5, 2),       -- optional, not everyone has access
  waist_cm        numeric(6, 2),
  hip_cm          numeric(6, 2),
  -- Sport / activity
  sport           text,
  activity_level  text,                 -- 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  goal            text,                 -- 'weight_loss' | 'maintenance' | 'muscle_gain' | 'performance'
  -- Meta
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.patients enable row level security;

drop policy if exists "patients_select_own" on public.patients;
create policy "patients_select_own"
  on public.patients for select
  using (auth.uid() = user_id);

drop policy if exists "patients_insert_own" on public.patients;
create policy "patients_insert_own"
  on public.patients for insert
  with check (auth.uid() = user_id);

drop policy if exists "patients_update_own" on public.patients;
create policy "patients_update_own"
  on public.patients for update
  using (auth.uid() = user_id);

drop policy if exists "patients_delete_own" on public.patients;
create policy "patients_delete_own"
  on public.patients for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. intakes
-- ---------------------------------------------------------------------------
create table if not exists public.intakes (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references public.patients (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  visit_date      date not null default current_date,
  weight_kg       numeric(6, 2),
  height_cm       numeric(6, 2),
  body_fat_pct    numeric(5, 2),
  activity_level  text,
  goal            text,
  notes           text,
  created_at      timestamptz not null default now()
);

alter table public.intakes enable row level security;

drop policy if exists "intakes_all_own" on public.intakes;
create policy "intakes_all_own"
  on public.intakes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5. calculations
-- ---------------------------------------------------------------------------
create table if not exists public.calculations (
  id              uuid primary key default gen_random_uuid(),
  intake_id       uuid not null references public.intakes (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  bmr_kcal        numeric(8, 2),
  tdee_kcal       numeric(8, 2),
  target_kcal     numeric(8, 2),
  protein_g       numeric(7, 2),
  carbs_g         numeric(7, 2),
  fat_g           numeric(7, 2),
  formula         text,
  notes           text,
  created_at      timestamptz not null default now()
);

alter table public.calculations enable row level security;

drop policy if exists "calculations_all_own" on public.calculations;
create policy "calculations_all_own"
  on public.calculations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. templates
-- ---------------------------------------------------------------------------
create table if not exists public.templates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles (id) on delete cascade,
  name         text not null,
  description  text,
  goal         text,
  kcal_target  numeric(8, 2),
  is_public    boolean not null default false,
  is_seed      boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.templates enable row level security;

-- Users see their own templates + public/seed templates
drop policy if exists "templates_select_own_or_public" on public.templates;
create policy "templates_select_own_or_public"
  on public.templates for select
  using (auth.uid() = user_id or is_public = true or is_seed = true);

drop policy if exists "templates_insert_own" on public.templates;
create policy "templates_insert_own"
  on public.templates for insert
  with check (auth.uid() = user_id);

drop policy if exists "templates_update_own" on public.templates;
create policy "templates_update_own"
  on public.templates for update
  using (auth.uid() = user_id);

drop policy if exists "templates_delete_own" on public.templates;
create policy "templates_delete_own"
  on public.templates for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7. template_meals
-- ---------------------------------------------------------------------------
create table if not exists public.template_meals (
  id           uuid primary key default gen_random_uuid(),
  template_id  uuid not null references public.templates (id) on delete cascade,
  meal_name    text not null,
  meal_order   smallint not null default 1,
  notes        text,
  created_at   timestamptz not null default now()
);

alter table public.template_meals enable row level security;

drop policy if exists "template_meals_select" on public.template_meals;
create policy "template_meals_select"
  on public.template_meals for select
  using (
    exists (
      select 1 from public.templates t
      where t.id = template_meals.template_id
        and (t.user_id = auth.uid() or t.is_public = true or t.is_seed = true)
    )
  );

drop policy if exists "template_meals_modify" on public.template_meals;
create policy "template_meals_modify"
  on public.template_meals for all
  using (
    exists (
      select 1 from public.templates t
      where t.id = template_meals.template_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.templates t
      where t.id = template_meals.template_id and t.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 8. equivalents (null user_id = system/global)
-- ---------------------------------------------------------------------------
create table if not exists public.equivalents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles (id) on delete set null,
  group_name   text not null,
  food_name    text not null,
  serving_desc text,
  serving_g    numeric(7, 2),
  kcal         numeric(7, 2),
  protein_g    numeric(7, 2),
  carbs_g      numeric(7, 2),
  fat_g        numeric(7, 2),
  notes        text,
  created_at   timestamptz not null default now()
);

alter table public.equivalents enable row level security;

-- Everyone can read system equivalents (user_id is null) + their own
drop policy if exists "equivalents_select" on public.equivalents;
create policy "equivalents_select"
  on public.equivalents for select
  using (user_id is null or auth.uid() = user_id);

drop policy if exists "equivalents_insert_own" on public.equivalents;
create policy "equivalents_insert_own"
  on public.equivalents for insert
  with check (auth.uid() = user_id);

drop policy if exists "equivalents_update_own" on public.equivalents;
create policy "equivalents_update_own"
  on public.equivalents for update
  using (auth.uid() = user_id);

drop policy if exists "equivalents_delete_own" on public.equivalents;
create policy "equivalents_delete_own"
  on public.equivalents for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 9. plans
-- ---------------------------------------------------------------------------
create table if not exists public.plans (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  patient_id      uuid not null references public.patients (id) on delete cascade,
  calculation_id  uuid references public.calculations (id) on delete set null,
  template_id     uuid references public.templates (id) on delete set null,
  title           text not null,
  status          text not null default 'draft',
  valid_from      date,
  valid_until     date,
  notes           text,
  plan_mode       text not null default 'macros' check (plan_mode in ('macros', 'equivalentes')),
  equivalentes    jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.plans enable row level security;

drop policy if exists "plans_all_own" on public.plans;
create policy "plans_all_own"
  on public.plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 10. plan_meals
-- ---------------------------------------------------------------------------
create table if not exists public.plan_meals (
  id             uuid primary key default gen_random_uuid(),
  plan_id        uuid not null references public.plans (id) on delete cascade,
  meal_name      text not null,
  meal_order     smallint not null default 1,
  equivalent_id  uuid references public.equivalents (id) on delete set null,
  servings       numeric(6, 2) not null default 1,
  notes          text,
  created_at     timestamptz not null default now()
);

alter table public.plan_meals enable row level security;

drop policy if exists "plan_meals_all_own" on public.plan_meals;
create policy "plan_meals_all_own"
  on public.plan_meals for all
  using (
    exists (
      select 1 from public.plans p
      where p.id = plan_meals.plan_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.plans p
      where p.id = plan_meals.plan_id and p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 11. alerts
-- ---------------------------------------------------------------------------
create table if not exists public.alerts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  patient_id   uuid references public.patients (id) on delete cascade,
  plan_id      uuid references public.plans (id) on delete cascade,
  alert_type   text not null,
  message      text,
  is_resolved  boolean not null default false,
  resolved_at  timestamptz,
  created_at   timestamptz not null default now()
);

alter table public.alerts enable row level security;

drop policy if exists "alerts_all_own" on public.alerts;
create policy "alerts_all_own"
  on public.alerts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================================================
-- Seed: public templates (visible to all signed-in users)
-- =============================================================================
-- 15 seed templates. name/description are bilingual (ES · EN). goal stores the
-- category; kcal_target the daily energy. Macro targets (P/C/G grams) are noted
-- in the description so they survive in the current single-description schema.
insert into public.templates (id, user_id, name, description, goal, kcal_target, is_public, is_seed)
values
  ('a0000000-0000-0000-0000-000000000001', null, 'Volumen limpio · Clean bulk', 'Excedente calórico limpio para ganancia muscular. P200/C400/G90. · Clean caloric surplus for muscle gain. P200/C400/F90.', 'bulk', 3200, true, true),
  ('a0000000-0000-0000-0000-000000000002', null, 'Volumen agresivo · Aggressive bulk', 'Excedente alto para máxima ganancia de masa. P220/C480/G110. · High surplus for maximum mass gain. P220/C480/F110.', 'bulk', 3800, true, true),
  ('a0000000-0000-0000-0000-000000000003', null, 'Definición moderada · Moderate cut', 'Déficit moderado preservando músculo. P200/C200/G65. · Moderate deficit preserving muscle. P200/C200/F65.', 'cut', 2200, true, true),
  ('a0000000-0000-0000-0000-000000000004', null, 'Definición agresiva · Aggressive cut', 'Déficit agresivo con proteína alta. P180/C150/G55. · Aggressive deficit with high protein. P180/C150/F55.', 'cut', 1800, true, true),
  ('a0000000-0000-0000-0000-000000000005', null, 'Mantenimiento · Maintenance', 'Energía de mantenimiento equilibrada. P160/C290/G75. · Balanced maintenance energy. P160/C290/F75.', 'maintenance', 2600, true, true),
  ('a0000000-0000-0000-0000-000000000006', null, 'Recomposición · Body recomp', 'Recomposición corporal con proteína alta. P190/C240/G70. · Body recomposition with high protein. P190/C240/F70.', 'recomp', 2400, true, true),
  ('a0000000-0000-0000-0000-000000000007', null, 'Resistencia · Endurance performance', 'Alto aporte de carbohidratos para resistencia. P170/C480/G90. · High carbohydrate intake for endurance. P170/C480/F90.', 'performance', 3500, true, true),
  ('a0000000-0000-0000-0000-000000000008', null, 'Fuerza · Strength performance', 'Soporte de fuerza con proteína elevada. P220/C360/G95. · Strength support with elevated protein. P220/C360/F95.', 'performance', 3300, true, true),
  ('a0000000-0000-0000-0000-000000000009', null, 'Vegetariano balanceado · Balanced vegetarian', 'Plan vegetariano equilibrado. P130/C300/G75. · Balanced vegetarian plan. P130/C300/F75.', 'vegetarian', 2400, true, true),
  ('a0000000-0000-0000-0000-000000000010', null, 'Vegano alto en proteína · High-protein vegan', 'Plan vegano con énfasis en proteína. P150/C290/G80. · Vegan plan with protein emphasis. P150/C290/F80.', 'vegan', 2500, true, true),
  ('a0000000-0000-0000-0000-000000000011', null, 'Keto / baja en carbs · Keto / low-carb', 'Cetogénico bajo en carbohidratos. P150/C50/G165. · Ketogenic low-carbohydrate. P150/C50/F165.', 'keto', 2200, true, true),
  ('a0000000-0000-0000-0000-000000000012', null, 'Mediterránea · Mediterranean', 'Patrón mediterráneo rico en grasas saludables. P140/C260/G90. · Mediterranean pattern rich in healthy fats. P140/C260/F90.', 'mediterranean', 2400, true, true),
  ('a0000000-0000-0000-0000-000000000013', null, 'Pérdida de grasa mujeres · Female fat loss', 'Pérdida de grasa enfocada en mujeres. P130/C140/G50. · Fat loss focused for women. P130/C140/F50.', 'cut', 1600, true, true),
  ('a0000000-0000-0000-0000-000000000014', null, 'Volumen mujeres · Female lean gain', 'Ganancia magra enfocada en mujeres. P140/C240/G70. · Lean gain focused for women. P140/C240/F70.', 'bulk', 2200, true, true),
  ('a0000000-0000-0000-0000-000000000015', null, 'Atleta adolescente · Teen athlete', 'Soporte energético para atletas adolescentes. P140/C360/G80. · Energy support for teen athletes. P140/C360/F80.', 'performance', 2800, true, true)
on conflict (id) do nothing;

-- =============================================================================
-- End of schema
-- =============================================================================

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
-- ORIGEN: supabase/add_dietary_preferences.sql
-- ============================================================================

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

-- ============================================================================
-- ORIGEN: supabase/add_avatar_support.sql
-- ============================================================================

-- Run in Supabase SQL Editor
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
-- Also create a public storage bucket called 'avatars' in Supabase Dashboard > Storage

-- ============================================================================
-- ORIGEN: supabase/add_equivalentes_to_plans.sql
-- ============================================================================

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

-- ============================================================================
-- ORIGEN: supabase/add_intake_forms.sql
-- ============================================================================

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

-- ============================================================================
-- ORIGEN: supabase/add_missing_templates.sql
-- ============================================================================

-- Run in Supabase SQL Editor for planbuilder.anthroscope.pro
-- Project: vdajfetrigxgzcfjfcls
-- Inserts 11 missing seed templates (4 already exist)

INSERT INTO public.templates (name, description, goal, kcal_target, is_public, is_seed) VALUES
('Resistencia Aeróbica Elite', 'P180/C520/G70 — High-carb endurance protocol for marathon/triathlon athletes', 'endurance', 3200, true, true),
('Definición Competitiva', 'P220/C180/G55 — Pre-competition cut with muscle retention priority', 'cut', 1900, true, true),
('Hipertrofia Máxima', 'P240/C380/G90 — Aggressive mass gain for off-season strength athletes', 'bulk', 3800, true, true),
('Fuerza Funcional', 'P190/C300/G80 — CrossFit & functional fitness periodization', 'performance', 2800, true, true),
('Recuperación Activa', 'P160/C280/G70 — Anti-inflammatory focus with omega-3 emphasis', 'recovery', 2400, true, true),
('Ciclismo de Cargas', 'P200/C400/G60 — Carb cycling: high/medium/low day rotation', 'performance', 2900, true, true),
('Atleta Vegetariana', 'P150/C350/G75 — Plant-based complete proteins + B12/Iron/Zinc protocol', 'maintenance', 2600, true, true),
('Velocidad y Potencia', 'P210/C320/G75 — Sprinters/explosive athletes — creatine + caffeine protocol', 'performance', 3100, true, true),
('Control de Peso Femenino', 'P170/C220/G65 — Hormonal cycle-aware female athlete nutrition', 'cut', 2100, true, true),
('Ganancia Limpia', 'P200/C350/G80 — Lean bulk — caloric surplus +300 kcal above TDEE', 'bulk', 3200, true, true),
('Alto Rendimiento Juvenil', 'P160/C380/G70 — Youth athlete 14-18 yr growth-optimized protocol', 'performance', 2900, true, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ORIGEN: supabase/add_neat_to_intake.sql
-- ============================================================================

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

-- ============================================================================
-- ORIGEN: supabase/add_patient_view.sql
-- ============================================================================

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

-- ============================================================================
-- ORIGEN: supabase/add_plan_view_function.sql
-- ============================================================================

-- =============================================================================
-- Anthroscope Plan Builder — Public plan view function
-- =============================================================================
-- This SECURITY DEFINER function allows the anon role to read plan data
-- when a valid, unexpired token is provided. It replaces the need for the
-- service_role key in the /api/plan-view/[token] route.
-- Run via Supabase SQL Editor.
-- =============================================================================

create or replace function public.get_plan_by_token(p_token text)
returns table (
  plan_id       uuid,
  title         text,
  valid_from    date,
  valid_until   date,
  plan_mode     text,
  equivalentes  jsonb,
  notes         text,
  patient_first_name text,
  expired       boolean,
  meals         jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_id   uuid;
  v_expires   timestamptz;
begin
  -- Validate token
  select pvt.plan_id, pvt.expires_at
  into v_plan_id, v_expires
  from public.plan_view_tokens pvt
  where pvt.token = p_token
  limit 1;

  if v_plan_id is null then
    return; -- empty result = not found
  end if;

  -- Return plan data with expired flag
  return query
  select
    p.id                                                    as plan_id,
    p.title                                                 as title,
    p.valid_from                                            as valid_from,
    p.valid_until                                           as valid_until,
    p.plan_mode                                             as plan_mode,
    p.equivalentes                                          as equivalentes,
    p.notes                                                 as notes,
    pat.first_name                                          as patient_first_name,
    (v_expires is not null and v_expires < now())           as expired,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'meal_name',  pm.meal_name,
            'meal_order', pm.meal_order,
            'servings',   pm.servings,
            'group_key',  eq.group_key
          )
          order by pm.meal_order
        )
        from public.plan_meals pm
        left join public.equivalents eq on eq.id = pm.equivalent_id
        where pm.plan_id = p.id
      ),
      '[]'::jsonb
    )                                                       as meals
  from public.plans p
  left join public.patients pat on pat.id = p.patient_id
  where p.id = v_plan_id;
end;
$$;

-- Grant execute to anon and authenticated roles
grant execute on function public.get_plan_by_token(text) to anon, authenticated;

-- Also allow anon to read system equivalents (user_id IS NULL) for the swap catalog
drop policy if exists "equivalents_select_anon" on public.equivalents;
create policy "equivalents_select_anon"
  on public.equivalents for select
  to anon
  using (user_id is null);

-- =============================================================================
-- End
-- =============================================================================

-- ============================================================================
-- ORIGEN: supabase/add_template_meals_food.sql
-- ============================================================================

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

-- ============================================================================
-- ORIGEN: supabase/add_isak_measures.sql
-- ============================================================================

-- ============================================================================
-- Anthroscope Plan Builder — Medidas ISAK (pliegues y perímetros)
-- ----------------------------------------------------------------------------
-- Añade a `patients` los 8 pliegues del protocolo ISAK y 4 perímetros
-- adicionales. Son columnas opcionales: quien no los use no ve nada distinto.
--
-- Seguro de ejecutar sobre una base con datos: solo ALTER ... ADD COLUMN
-- IF NOT EXISTS, no borra ni reescribe nada.
--
-- Unidades: pliegues en milímetros (mm), perímetros en centímetros (cm).
-- ============================================================================

-- Pliegues ISAK (8 sitios)
alter table public.patients
  add column if not exists fold_triceps_mm     numeric(5, 1),
  add column if not exists fold_subscapular_mm numeric(5, 1),
  add column if not exists fold_biceps_mm      numeric(5, 1),
  add column if not exists fold_iliac_mm       numeric(5, 1),
  add column if not exists fold_supraspinal_mm numeric(5, 1),
  add column if not exists fold_abdominal_mm   numeric(5, 1),
  add column if not exists fold_thigh_mm       numeric(5, 1),
  add column if not exists fold_calf_mm        numeric(5, 1);

-- Perímetros adicionales
alter table public.patients
  add column if not exists girth_arm_cm      numeric(5, 1),
  add column if not exists girth_thigh_cm    numeric(5, 1),
  add column if not exists girth_calf_cm     numeric(5, 1),
  add column if not exists girth_chest_cm    numeric(5, 1);

comment on column public.patients.fold_triceps_mm is 'Pliegue tricipital (mm) — ISAK';
comment on column public.patients.fold_subscapular_mm is 'Pliegue subescapular (mm) — ISAK';
comment on column public.patients.fold_biceps_mm is 'Pliegue bicipital (mm) — ISAK';
comment on column public.patients.fold_iliac_mm is 'Pliegue cresta ilíaca (mm) — ISAK';
comment on column public.patients.fold_supraspinal_mm is 'Pliegue supraespinal (mm) — ISAK';
comment on column public.patients.fold_abdominal_mm is 'Pliegue abdominal (mm) — ISAK';
comment on column public.patients.fold_thigh_mm is 'Pliegue muslo frontal (mm) — ISAK';
comment on column public.patients.fold_calf_mm is 'Pliegue pantorrilla medial (mm) — ISAK';

-- Verificación
select column_name, data_type
from information_schema.columns
where table_name = 'patients'
  and (column_name like 'fold\_%' or column_name like 'girth\_%')
order by column_name;

-- ============================================================================
-- ORIGEN: supabase/migration_bilingual.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: bilingual equivalents (en/es) + canonical group keys + USDA source
-- ============================================================================
-- Apply in Supabase SQL Editor AFTER schema.sql and fix_permissions.sql.
-- Safe to run multiple times (idempotent).
-- ============================================================================

-- 1. Add locale to profiles (per-user UI language preference)
alter table public.profiles
  add column if not exists locale text not null default 'es' check (locale in ('es', 'en'));

-- 2. Extend equivalents with bilingual fields + canonical group + USDA source
alter table public.equivalents
  add column if not exists food_name_en text,
  add column if not exists food_name_es text,
  add column if not exists serving_desc_en text,
  add column if not exists serving_desc_es text,
  add column if not exists group_key text,
  add column if not exists fiber_g numeric(7, 2),
  add column if not exists source text default 'manual' check (source in ('manual', 'usda', 'mexico_inn', 'custom')),
  add column if not exists fdc_id integer;

-- Index for fast filtering by group_key
create index if not exists equivalents_group_key_idx on public.equivalents (group_key);
create index if not exists equivalents_source_idx on public.equivalents (source);
create index if not exists equivalents_fdc_id_idx on public.equivalents (fdc_id) where fdc_id is not null;

-- 3. Canonical food groups (single source of truth for category labels)
create table if not exists public.food_groups (
  key            text primary key,
  name_es        text not null,
  name_en        text not null,
  display_order  smallint not null default 0,
  exchange_kcal  numeric(5, 1),
  exchange_protein_g numeric(5, 1),
  exchange_carbs_g numeric(5, 1),
  exchange_fat_g numeric(5, 1),
  notes_es       text,
  notes_en       text
);

alter table public.food_groups enable row level security;

drop policy if exists "food_groups_select_all" on public.food_groups;
create policy "food_groups_select_all"
  on public.food_groups for select
  to authenticated
  using (true);

-- Seed canonical groups (Sistema Mexicano de Equivalentes + ADA Exchanges)
insert into public.food_groups (key, name_es, name_en, display_order, exchange_kcal, exchange_protein_g, exchange_carbs_g, exchange_fat_g, notes_es, notes_en) values
  ('cereales',        'Cereales y tubérculos',  'Grains & starches',     1, 70,  2, 15, 0,  'Sin grasa adicional', 'Without added fat'),
  ('cereales_grasa',  'Cereales con grasa',     'Grains with fat',       2, 115, 2, 15, 5,  'Con grasa añadida',   'With added fat'),
  ('leguminosas',     'Leguminosas',            'Legumes',               3, 120, 8, 20, 1,  'Frijol, lenteja, garbanzo', 'Beans, lentils, chickpeas'),
  ('verduras',        'Verduras',               'Vegetables',            4, 25,  2, 4,  0,  'No incluye almidonadas', 'Non-starchy'),
  ('frutas',          'Frutas',                 'Fruits',                5, 60,  0, 15, 0,  null, null),
  ('lacteos_descremados', 'Lácteos descremados', 'Skim dairy',           6, 95,  9, 12, 0,  null, null),
  ('lacteos_semi',    'Lácteos semidescremados', 'Reduced-fat dairy',    7, 110, 9, 12, 4,  null, null),
  ('lacteos_enteros', 'Lácteos enteros',        'Whole dairy',           8, 150, 9, 12, 8,  null, null),
  ('proteina_muy_baja', 'Proteínas muy bajas en grasa', 'Very lean protein', 9, 40, 7, 0, 1, '~3 g grasa o menos', '~3 g fat or less'),
  ('proteina_baja',   'Proteínas bajas en grasa', 'Lean protein',        10, 55, 7, 0, 3, null, null),
  ('proteina_media',  'Proteínas moderadas en grasa', 'Medium-fat protein', 11, 75, 7, 0, 5, null, null),
  ('proteina_alta',   'Proteínas altas en grasa', 'High-fat protein',    12, 100, 7, 0, 8, null, null),
  ('grasas_mono',     'Grasas monoinsaturadas', 'Monounsaturated fats',  13, 45, 0, 0, 5, 'Aceite oliva, aguacate', 'Olive oil, avocado'),
  ('grasas_poli',     'Grasas poliinsaturadas', 'Polyunsaturated fats',  14, 45, 0, 0, 5, null, null),
  ('grasas_saturadas', 'Grasas saturadas',       'Saturated fats',        15, 45, 0, 0, 5, 'Mantequilla, manteca', 'Butter, lard'),
  ('azucares',        'Azúcares libres',        'Free sugars',           16, 40, 0, 10, 0, 'Mermelada, miel, azúcar', 'Jam, honey, sugar'),
  ('bebidas_deporte', 'Bebidas deportivas',     'Sports drinks',         17, 50, 0, 14, 0, 'Por porción de 240 ml', 'Per 240 ml serving')
on conflict (key) do update set
  name_es = excluded.name_es,
  name_en = excluded.name_en,
  display_order = excluded.display_order,
  exchange_kcal = excluded.exchange_kcal,
  exchange_protein_g = excluded.exchange_protein_g,
  exchange_carbs_g = excluded.exchange_carbs_g,
  exchange_fat_g = excluded.exchange_fat_g,
  notes_es = excluded.notes_es,
  notes_en = excluded.notes_en;

-- 4. Backfill existing rows: copy food_name -> food_name_es, infer group_key from group_name
update public.equivalents
set food_name_es = coalesce(food_name_es, food_name),
    serving_desc_es = coalesce(serving_desc_es, serving_desc)
where food_name_es is null;

-- Best-effort group_key inference from old group_name (Spanish or English)
update public.equivalents set group_key = case
  when lower(group_name) in ('almidones', 'cereals', 'cereales', 'cereales y tuberculos') then 'cereales'
  when lower(group_name) in ('leguminosas', 'legumes') then 'leguminosas'
  when lower(group_name) in ('verduras', 'vegetables') then 'verduras'
  when lower(group_name) in ('frutas', 'fruits') then 'frutas'
  when lower(group_name) in ('lacteos', 'lácteos', 'dairy') then 'lacteos_descremados'
  when lower(group_name) in ('proteins', 'proteinas', 'proteínas') then 'proteina_baja'
  when lower(group_name) in ('grasas', 'fats') then 'grasas_mono'
  when lower(group_name) in ('azucares', 'azúcares', 'sugars') then 'azucares'
  else group_key
end
where group_key is null;

-- ============================================================================
-- ORIGEN: supabase/fix_permissions.sql
-- ============================================================================

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

-- ============================================================================
-- ORIGEN: supabase/fix_template_meals_rls.sql
-- ============================================================================

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

-- ============================================================================
-- ORIGEN: supabase/migrations/add_dietary_recalls.sql
-- ============================================================================

-- Dietary Recalls table for 24h, 3-day, and 7-day food recall forms
CREATE TABLE IF NOT EXISTS dietary_recalls (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nutritionist_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name text,
  client_email text,
  token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex') UNIQUE,
  recall_type text NOT NULL DEFAULT '24h' CHECK (recall_type IN ('24h', '3day', '7day')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  responses jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Index for fast token lookups (public form access)
CREATE INDEX IF NOT EXISTS idx_dietary_recalls_token ON dietary_recalls(token);

-- Index for nutritionist queries
CREATE INDEX IF NOT EXISTS idx_dietary_recalls_nutritionist ON dietary_recalls(nutritionist_id);

-- RLS policies
ALTER TABLE dietary_recalls ENABLE ROW LEVEL SECURITY;

-- Nutritionists can see their own recalls
CREATE POLICY "Users can view own recalls"
  ON dietary_recalls FOR SELECT
  USING (auth.uid() = nutritionist_id);

-- Nutritionists can create recalls
CREATE POLICY "Users can insert own recalls"
  ON dietary_recalls FOR INSERT
  WITH CHECK (auth.uid() = nutritionist_id);

-- Nutritionists can delete their own recalls
CREATE POLICY "Users can delete own recalls"
  ON dietary_recalls FOR DELETE
  USING (auth.uid() = nutritionist_id);

-- Public update policy (for token-based form submission)
CREATE POLICY "Anyone can update via token"
  ON dietary_recalls FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- ORIGEN: supabase/migrations/add_nutritionist_profile.sql
-- ============================================================================

-- Nutritionist branding profile: powers the premium PDF header, footer and
-- accent color. One row per user; upserted from the settings page.

CREATE TABLE IF NOT EXISTS nutritionist_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  clinic_name text,
  professional_name text,
  license_number text,
  specialty text,
  phone text,
  address text,
  website text,
  accent_color text DEFAULT '#c9a961',
  logo_url text,
  signature_url text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE nutritionist_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own profile" ON nutritionist_profiles;
CREATE POLICY "own profile" ON nutritionist_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ORIGEN: supabase/migrations/add_progress_tracking.sql
-- ============================================================================

-- Patient progress tracking: longitudinal anthropometry per patient.
-- Each row is one measurement date. Charts on the patient detail page read
-- the last N days from this table.

CREATE TABLE IF NOT EXISTS patient_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  recorded_at date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg decimal(5,2),
  body_fat_pct decimal(4,1),
  lean_mass_kg decimal(5,2),
  waist_cm decimal(5,1),
  hip_cm decimal(5,1),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(patient_id, recorded_at)
);

CREATE INDEX IF NOT EXISTS patient_progress_patient_date_idx
  ON patient_progress (patient_id, recorded_at DESC);

ALTER TABLE patient_progress ENABLE ROW LEVEL SECURITY;

-- Access is gated through ownership of the parent patient row.
DROP POLICY IF EXISTS "patient_progress_select_own" ON patient_progress;
CREATE POLICY "patient_progress_select_own"
  ON patient_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_progress.patient_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "patient_progress_insert_own" ON patient_progress;
CREATE POLICY "patient_progress_insert_own"
  ON patient_progress FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_progress.patient_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "patient_progress_update_own" ON patient_progress;
CREATE POLICY "patient_progress_update_own"
  ON patient_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_progress.patient_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "patient_progress_delete_own" ON patient_progress;
CREATE POLICY "patient_progress_delete_own"
  ON patient_progress FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_progress.patient_id AND p.user_id = auth.uid()
    )
  );

-- ============================================================================
-- ORIGEN: supabase/migrations/fix_plan_equivalentes_null.sql
-- ============================================================================

-- =============================================================================
-- Anthroscope Plan Builder — Backfill `plans.equivalentes` for existing plans
-- =============================================================================
-- Background:
--   Prior to the fix in app/dashboard/plans/actions.ts, the `equivalentes`
--   JSONB column was left NULL on every newly created plan. The kcal target
--   and macro split were only persisted as a text summary inside `notes`
--   (e.g. "Meta: 2000 kcal · P150/C200/G67"). This caused:
--     • EquivalentesEditor to default to 2000 kcal on every plan
--     • "Remaining equivalents" panel to show 0/done for every group
--     • SaveAsTemplateButton to create templates with kcal_target = NULL
--
-- This migration backfills the `equivalentes` JSONB for every plan that
-- currently has it NULL, parsing the macro summary out of `notes` (or, when
-- `notes` has no parseable macros, falling back to the template's kcal_target
-- and a default 30/40/30 split).
--
-- Safe to re-run: uses WHERE equivalentes IS NULL.
-- Run via: Supabase SQL Editor (Dashboard) OR `supabase db push`
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: parse "P<digits>/C<digits>/G<digits>" out of a text column.
-- Returns NULL if the pattern isn't found.
-- ---------------------------------------------------------------------------
create or replace function public._parse_macros_from_notes(n text)
returns table (protein_g int, carbs_g int, fat_g int)
language sql
immutable
as $$
  select
    coalesce((regexp_match(n, 'P\s*(\d+)\s*/\s*C\s*\d+\s*/\s*[GF]\s*\d+', 'i'))[1]::int, 0)::int as protein_g,
    coalesce((regexp_match(n, 'P\s*\d+\s*/\s*C\s*(\d+)\s*/\s*[GF]\s*\d+', 'i'))[1]::int, 0)::int as carbs_g,
    coalesce((regexp_match(n, 'P\s*\d+\s*/\s*C\s*\d+\s*/\s*[GF]\s*(\d+)', 'i'))[1]::int, 0)::int as fat_g;
$$;

-- ---------------------------------------------------------------------------
-- Step 1: Backfill plans that have kcal target + macros parseable from notes
-- ---------------------------------------------------------------------------
with parsed as (
  select
    p.id as plan_id,
    p.notes,
    p.plan_mode,
    -- Extract "Meta: <number> kcal" from notes
    coalesce(
      nullif(
        (regexp_match(coalesce(p.notes, ''), 'Meta:\s*(\d+(?:\.\d+)?)\s*kcal', 'i'))[1],
        ''
      ),
      t.kcal_target::text,
      '0'
    )::numeric as kcal_target,
    pm.protein_g,
    pm.carbs_g,
    pm.fat_g
  from public.plans p
  left join public.templates t on t.id = p.template_id
  left join lateral public._parse_macros_from_notes(p.notes) pm on true
  where p.equivalentes is null
)
update public.plans
set equivalentes = jsonb_build_object(
  'mode', parsed.plan_mode,
  'kcalTarget', parsed.kcal_target::int,
  'proteinPct',
    case when (parsed.protein_g * 4 + parsed.carbs_g * 4 + parsed.fat_g * 9) > 0
         then round((parsed.protein_g * 4.0 / (parsed.protein_g * 4 + parsed.carbs_g * 4 + parsed.fat_g * 9)) * 100)::int
         else 30 end,
  'carbsPct',
    case when (parsed.protein_g * 4 + parsed.carbs_g * 4 + parsed.fat_g * 9) > 0
         then round((parsed.carbs_g * 4.0 / (parsed.protein_g * 4 + parsed.carbs_g * 4 + parsed.fat_g * 9)) * 100)::int
         else 40 end,
  'fatPct',
    case when (parsed.protein_g * 4 + parsed.carbs_g * 4 + parsed.fat_g * 9) > 0
         then round((parsed.fat_g * 9.0 / (parsed.protein_g * 4 + parsed.carbs_g * 4 + parsed.fat_g * 9)) * 100)::int
         else 30 end,
  'proteinG', parsed.protein_g,
  'carbsG', parsed.carbs_g,
  'fatG', parsed.fat_g,
  'groups', jsonb_build_object(
    'cereales', 0,
    'leguminosas', 0,
    'verduras', 0,
    'frutas', 0,
    'lacteos', 0,
    'proteinas_ao', 0,
    'proteinas_av', 0,
    'grasas', 0,
    'azucares', 0
  )
)
from parsed
where public.plans.id = parsed.plan_id
  and parsed.kcal_target > 0;

-- ---------------------------------------------------------------------------
-- Step 2: For plans that still have no kcal target (truly empty), default to
-- 2000 kcal + 30/40/30 split so the editor doesn't show 0/blank.
-- ---------------------------------------------------------------------------
update public.plans
set equivalentes = jsonb_build_object(
  'mode', coalesce(plan_mode, 'macros'),
  'kcalTarget', 2000,
  'proteinPct', 30,
  'carbsPct', 40,
  'fatPct', 30,
  'proteinG', 150,
  'carbsG', 200,
  'fatG', 67,
  'groups', jsonb_build_object(
    'cereales', 0,
    'leguminosas', 0,
    'verduras', 0,
    'frutas', 0,
    'lacteos', 0,
    'proteinas_ao', 0,
    'proteinas_av', 0,
    'grasas', 0,
    'azucares', 0
  )
)
where equivalentes is null;

-- ---------------------------------------------------------------------------
-- Step 3: Also repair templates that were saved from buggy plans (kcal_target
-- is NULL but a description with "Meta: <n> kcal" or "P\d/C\d/G\d" exists).
-- ---------------------------------------------------------------------------
update public.templates
set kcal_target = coalesce(
  kcal_target,
  nullif(
    (regexp_match(coalesce(description, ''), 'Meta:\s*(\d+(?:\.\d+)?)\s*kcal', 'i'))[1],
    ''
  )::numeric
)
where kcal_target is null
  and description is not null;

-- ---------------------------------------------------------------------------
-- Cleanup: drop the helper function (it was only needed for this migration)
-- ---------------------------------------------------------------------------
drop function if exists public._parse_macros_from_notes(text);

-- =============================================================================
-- End of migration
-- =============================================================================

-- ============================================================================
-- ORIGEN: supabase/apply_usda_combined.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION: bilingual equivalents (en/es) + canonical group keys + USDA source
-- ============================================================================
-- Apply in Supabase SQL Editor AFTER schema.sql and fix_permissions.sql.
-- Safe to run multiple times (idempotent).
-- ============================================================================

-- 1. Add locale to profiles (per-user UI language preference)
alter table public.profiles
  add column if not exists locale text not null default 'es' check (locale in ('es', 'en'));

-- 2. Extend equivalents with bilingual fields + canonical group + USDA source
alter table public.equivalents
  add column if not exists food_name_en text,
  add column if not exists food_name_es text,
  add column if not exists serving_desc_en text,
  add column if not exists serving_desc_es text,
  add column if not exists group_key text,
  add column if not exists fiber_g numeric(7, 2),
  add column if not exists source text default 'manual' check (source in ('manual', 'usda', 'mexico_inn', 'custom')),
  add column if not exists fdc_id integer;

-- Index for fast filtering by group_key
create index if not exists equivalents_group_key_idx on public.equivalents (group_key);
create index if not exists equivalents_source_idx on public.equivalents (source);
create index if not exists equivalents_fdc_id_idx on public.equivalents (fdc_id) where fdc_id is not null;

-- 3. Canonical food groups (single source of truth for category labels)
create table if not exists public.food_groups (
  key            text primary key,
  name_es        text not null,
  name_en        text not null,
  display_order  smallint not null default 0,
  exchange_kcal  numeric(5, 1),
  exchange_protein_g numeric(5, 1),
  exchange_carbs_g numeric(5, 1),
  exchange_fat_g numeric(5, 1),
  notes_es       text,
  notes_en       text
);

alter table public.food_groups enable row level security;

drop policy if exists "food_groups_select_all" on public.food_groups;
create policy "food_groups_select_all"
  on public.food_groups for select
  to authenticated
  using (true);

-- Seed canonical groups (Sistema Mexicano de Equivalentes + ADA Exchanges)
insert into public.food_groups (key, name_es, name_en, display_order, exchange_kcal, exchange_protein_g, exchange_carbs_g, exchange_fat_g, notes_es, notes_en) values
  ('cereales',        'Cereales y tubérculos',  'Grains & starches',     1, 70,  2, 15, 0,  'Sin grasa adicional', 'Without added fat'),
  ('cereales_grasa',  'Cereales con grasa',     'Grains with fat',       2, 115, 2, 15, 5,  'Con grasa añadida',   'With added fat'),
  ('leguminosas',     'Leguminosas',            'Legumes',               3, 120, 8, 20, 1,  'Frijol, lenteja, garbanzo', 'Beans, lentils, chickpeas'),
  ('verduras',        'Verduras',               'Vegetables',            4, 25,  2, 4,  0,  'No incluye almidonadas', 'Non-starchy'),
  ('frutas',          'Frutas',                 'Fruits',                5, 60,  0, 15, 0,  null, null),
  ('lacteos_descremados', 'Lácteos descremados', 'Skim dairy',           6, 95,  9, 12, 0,  null, null),
  ('lacteos_semi',    'Lácteos semidescremados', 'Reduced-fat dairy',    7, 110, 9, 12, 4,  null, null),
  ('lacteos_enteros', 'Lácteos enteros',        'Whole dairy',           8, 150, 9, 12, 8,  null, null),
  ('proteina_muy_baja', 'Proteínas muy bajas en grasa', 'Very lean protein', 9, 40, 7, 0, 1, '~3 g grasa o menos', '~3 g fat or less'),
  ('proteina_baja',   'Proteínas bajas en grasa', 'Lean protein',        10, 55, 7, 0, 3, null, null),
  ('proteina_media',  'Proteínas moderadas en grasa', 'Medium-fat protein', 11, 75, 7, 0, 5, null, null),
  ('proteina_alta',   'Proteínas altas en grasa', 'High-fat protein',    12, 100, 7, 0, 8, null, null),
  ('grasas_mono',     'Grasas monoinsaturadas', 'Monounsaturated fats',  13, 45, 0, 0, 5, 'Aceite oliva, aguacate', 'Olive oil, avocado'),
  ('grasas_poli',     'Grasas poliinsaturadas', 'Polyunsaturated fats',  14, 45, 0, 0, 5, null, null),
  ('grasas_saturadas', 'Grasas saturadas',       'Saturated fats',        15, 45, 0, 0, 5, 'Mantequilla, manteca', 'Butter, lard'),
  ('azucares',        'Azúcares libres',        'Free sugars',           16, 40, 0, 10, 0, 'Mermelada, miel, azúcar', 'Jam, honey, sugar'),
  ('bebidas_deporte', 'Bebidas deportivas',     'Sports drinks',         17, 50, 0, 14, 0, 'Por porción de 240 ml', 'Per 240 ml serving')
on conflict (key) do update set
  name_es = excluded.name_es,
  name_en = excluded.name_en,
  display_order = excluded.display_order,
  exchange_kcal = excluded.exchange_kcal,
  exchange_protein_g = excluded.exchange_protein_g,
  exchange_carbs_g = excluded.exchange_carbs_g,
  exchange_fat_g = excluded.exchange_fat_g,
  notes_es = excluded.notes_es,
  notes_en = excluded.notes_en;

-- 4. Backfill existing rows: copy food_name -> food_name_es, infer group_key from group_name
update public.equivalents
set food_name_es = coalesce(food_name_es, food_name),
    serving_desc_es = coalesce(serving_desc_es, serving_desc)
where food_name_es is null;

-- Best-effort group_key inference from old group_name (Spanish or English)
update public.equivalents set group_key = case
  when lower(group_name) in ('almidones', 'cereals', 'cereales', 'cereales y tuberculos') then 'cereales'
  when lower(group_name) in ('leguminosas', 'legumes') then 'leguminosas'
  when lower(group_name) in ('verduras', 'vegetables') then 'verduras'
  when lower(group_name) in ('frutas', 'fruits') then 'frutas'
  when lower(group_name) in ('lacteos', 'lácteos', 'dairy') then 'lacteos_descremados'
  when lower(group_name) in ('proteins', 'proteinas', 'proteínas') then 'proteina_baja'
  when lower(group_name) in ('grasas', 'fats') then 'grasas_mono'
  when lower(group_name) in ('azucares', 'azúcares', 'sugars') then 'azucares'
  else group_key
end
where group_key is null;
-- ============================================================================
-- USDA bilingual food catalog seed
-- Generated: 2026-06-27T08:56:12.583Z
-- Source: USDA FoodData Central (https://fdc.nal.usda.gov)
-- 224 foods across 17 groups
-- ============================================================================

-- Wipe existing seed equivalents (user_id is null) to avoid duplicates
delete from public.equivalents where user_id is null;

-- Insert curated bilingual catalog
insert into public.equivalents (
  user_id, group_name, group_key,
  food_name, food_name_es, food_name_en,
  serving_desc, serving_desc_es, serving_desc_en,
  serving_g, kcal, protein_g, carbs_g, fat_g, fiber_g,
  source, fdc_id
) values
  (null, 'cereales', 'cereales', 'Arroz blanco cocido', 'Arroz blanco cocido', 'White rice, cooked', '19 g', '19 g', '19 g', 19.5, 70, 1.4, 15.6, 0.3, 0.1, 'usda', 790214),
  (null, 'cereales', 'cereales', 'Arroz integral cocido', 'Arroz integral cocido', 'Brown rice, cooked', '19 g', '19 g', '19 g', 19.2, 70, 1.4, 14.5, 0.7, 0, 'usda', 1104812),
  (null, 'cereales', 'cereales', 'Pasta cocida', 'Pasta cocida', 'Pasta, cooked', '14 g', '14 g', '14 g', 14, 70, 5.7, 0.3, 5.1, 0, 'usda', 749420),
  (null, 'cereales', 'cereales', 'Pasta integral cocida', 'Pasta integral cocida', 'Whole wheat pasta, cooked', '19 g', '19 g', '19 g', 18.9, 70, 2.9, 13.5, 0.5, 2, 'usda', 790085),
  (null, 'cereales', 'cereales', 'Avena en hojuelas seca', 'Avena en hojuelas seca', 'Rolled oats, dry', '18 g', '18 g', '18 g', 18.3, 70, 2.5, 12.6, 1.1, 0, 'usda', 2346396),
  (null, 'cereales', 'cereales', 'Quinoa cocida', 'Quinoa cocida', 'Quinoa, cooked', '18 g', '18 g', '18 g', 18.2, 70, 2.2, 12.6, 1.2, 1.1, 'usda', 2512372),
  (null, 'cereales', 'cereales', 'Cebada cocida', 'Cebada cocida', 'Barley, cooked', '19 g', '19 g', '19 g', 19.1, 70, 1.7, 14.8, 0.5, 2.4, 'usda', 2512376),
  (null, 'cereales', 'cereales', 'Cuscús cocido', 'Cuscús cocido', 'Couscous, cooked', '14 g', '14 g', '14 g', 14, 70, 5.7, 0.3, 5.1, 0, 'usda', 749420),
  (null, 'cereales', 'cereales', 'Bulgur cocido', 'Bulgur cocido', 'Bulgur, cooked', '19 g', '19 g', '19 g', 18.8, 70, 2.2, 14.3, 0.5, 2.2, 'usda', 2710820),
  (null, 'cereales', 'cereales', 'Pan blanco', 'Pan blanco', 'White bread', '19 g', '19 g', '19 g', 19.3, 70, 2.8, 14, 0.3, 0, 'usda', 790146),
  (null, 'cereales', 'cereales', 'Pan de centeno', 'Pan de centeno', 'Rye bread', '19 g', '19 g', '19 g', 19.5, 70, 1.6, 15.1, 0.4, 2.7, 'usda', 2512375),
  (null, 'cereales', 'cereales', 'Pan pita integral', 'Pan pita integral', 'Whole wheat pita', '19 g', '19 g', '19 g', 18.9, 70, 2.9, 13.5, 0.5, 2, 'usda', 790085),
  (null, 'cereales', 'cereales', 'Bolillo', 'Bolillo', 'Mexican bread roll', '19 g', '19 g', '19 g', 19.3, 70, 2.8, 14, 0.3, 0, 'usda', 790146),
  (null, 'cereales', 'cereales', 'Bagel simple', 'Bagel simple', 'Plain bagel', '140 g (~1 taza)', '140 g (~1 taza)', '140 g (~1 cup)', 140, 70, 5.9, 11.3, 0.1, 0, 'usda', 2647437),
  (null, 'cereales', 'cereales', 'Tostada de maíz', 'Tostada de maíz', 'Corn tostada', '19 g', '19 g', '19 g', 19.2, 70, 1.2, 15.5, 0.3, 0.8, 'usda', 790276),
  (null, 'cereales', 'cereales', 'Galleta María', 'Galleta María', 'Maria cookie', '17 g', '17 g', '17 g', 17.2, 70, 1.2, 12.2, 1.8, 0.6, 'usda', 171867),
  (null, 'cereales', 'cereales', 'Galletas saladas', 'Galletas saladas', 'Saltine crackers', '17 g', '17 g', '17 g', 16.7, 70, 1.6, 12.4, 1.4, 0.5, 'usda', 172746),
  (null, 'cereales', 'cereales', 'Hot cake simple', 'Hot cake simple', 'Pancake plain', '140 g (~1 taza)', '140 g (~1 taza)', '140 g (~1 cup)', 140, 70, 5.9, 11.3, 0.1, 0, 'usda', 2647437),
  (null, 'cereales', 'cereales', 'Waffle simple', 'Waffle simple', 'Waffle plain', '140 g (~1 taza)', '140 g (~1 taza)', '140 g (~1 cup)', 140, 70, 5.9, 11.3, 0.1, 0, 'usda', 2647437),
  (null, 'cereales', 'cereales', 'Cereal corn flakes', 'Cereal corn flakes', 'Corn flakes cereal', '18 g', '18 g', '18 g', 18.2, 70, 1.1, 16, 0.2, 0.5, 'usda', 174648),
  (null, 'cereales', 'cereales', 'Cereal de salvado', 'Cereal de salvado', 'Bran flakes cereal', '17 g', '17 g', '17 g', 17.4, 70, 1.9, 11.9, 1.6, 6.1, 'usda', 2710839),
  (null, 'cereales', 'cereales', 'Papa cocida', 'Papa cocida', 'Potato, boiled', '194 g (~1 taza)', '194 g (~1 taza)', '194 g (~1 cup)', 194.4, 70, 5.7, 10.3, 2.4, 0, 'usda', 326196),
  (null, 'cereales', 'cereales', 'Papa horneada', 'Papa horneada', 'Potato, baked', '19 g', '19 g', '19 g', 19.4, 70, 1.6, 15.5, 0.2, 1, 'usda', 2261422),
  (null, 'cereales', 'cereales', 'Camote cocido', 'Camote cocido', 'Sweet potato, cooked', '89 g (~1/2 taza)', '89 g (~1/2 taza)', '89 g (~1/2 cup)', 88.6, 70, 1.4, 15.3, 0.3, 0, 'usda', 2346404),
  (null, 'cereales', 'cereales', 'Yuca cocida', 'Yuca cocida', 'Cassava, cooked', '20 g', '20 g', '20 g', 19.6, 70, 0.2, 17.1, 0.1, 0.9, 'usda', 2512377),
  (null, 'cereales', 'cereales', 'Plátano macho cocido', 'Plátano macho cocido', 'Plantain, cooked', '54 g', '54 g', '54 g', 53.8, 70, 0.6, 15.7, 0.5, 1, 'usda', 2710843),
  (null, 'cereales', 'cereales', 'Elote desgranado', 'Elote desgranado', 'Corn kernels', '83 g (~1/2 taza)', '83 g (~1/2 taza)', '83 g (~1/2 cup)', 82.7, 70, 2.3, 12.2, 1.3, 2, 'usda', 2710826),
  (null, 'cereales', 'cereales', 'Elote en mazorca', 'Elote en mazorca', 'Corn on the cob', '71 g (~1/2 taza)', '71 g (~1/2 taza)', '71 g (~1/2 cup)', 71.4, 70, 2.3, 16.8, 0.6, 2, 'usda', 169365),
  (null, 'cereales', 'cereales', 'Maíz pozolero', 'Maíz pozolero', 'Hominy', '97 g (~1/2 taza)', '97 g (~1/2 taza)', '97 g (~1/2 cup)', 97.2, 70, 1.4, 13.9, 0.9, 2.4, 'usda', 169701),
  (null, 'cereales', 'cereales', 'Calabaza de Castilla cocida', 'Calabaza de Castilla cocida', 'Winter squash, cooked', '144 g (~1 taza)', '144 g (~1 taza)', '144 g (~1 cup)', 144, 70, 1.8, 15.1, 0.3, 3.8, 'usda', 2685571),
  (null, 'cereales', 'cereales', 'Chícharos cocidos', 'Chícharos cocidos', 'Green peas, cooked', '87 g (~1/2 taza)', '87 g (~1/2 taza)', '87 g (~1/2 cup)', 87.4, 70, 4.1, 11.1, 1, 0, 'usda', 2644291),
  (null, 'cereales', 'cereales', 'Harina de maíz', 'Harina de maíz', 'Cornmeal', '115 g (~1 taza)', '115 g (~1 taza)', '115 g (~1 cup)', 114.8, 70, 4.9, 6.1, 3.9, 4.9, 'usda', 326698),
  (null, 'cereales', 'cereales', 'Harina de avena', 'Harina de avena', 'Oat flour', '18 g', '18 g', '18 g', 18, 70, 2.4, 12.6, 1.1, 1.9, 'usda', 2261421),
  (null, 'cereales', 'cereales', 'Tapioca cocida', 'Tapioca cocida', 'Tapioca, cooked', '14 g', '14 g', '14 g', 14, 70, 5.7, 0.3, 5.1, 0, 'usda', 749420),
  (null, 'cereales', 'cereales', 'Polenta cocida', 'Polenta cocida', 'Polenta, cooked', '14 g', '14 g', '14 g', 14, 70, 5.7, 0.3, 5.1, 0, 'usda', 749420),
  (null, 'cereales', 'cereales', 'Arroz salvaje cocido', 'Arroz salvaje cocido', 'Wild rice, cooked', '19 g', '19 g', '19 g', 19, 70, 2.4, 14.4, 0.3, 0.8, 'usda', 2710821),
  (null, 'cereales_grasa', 'cereales_grasa', 'Donut glaseada', 'Donut glaseada', 'Glazed donut', '23 g', '23 g', '23 g', 23, 115, 1.9, 10.9, 8.2, 0.8, 'usda', 170593),
  (null, 'cereales_grasa', 'cereales_grasa', 'Croissant', 'Croissant', 'Croissant', '18 g', '18 g', '18 g', 17.8, 115, 3.7, 3.8, 9.4, 1.7, 'usda', 2262074),
  (null, 'cereales_grasa', 'cereales_grasa', 'Pan dulce', 'Pan dulce', 'Sweet bread', '36 g', '36 g', '36 g', 35.7, 115, 6.5, 0.8, 9.4, 0, 'usda', 746780),
  (null, 'cereales_grasa', 'cereales_grasa', 'Muffin de arándano', 'Muffin de arándano', 'Blueberry muffin', '39 g', '39 g', '39 g', 39.2, 115, 1.4, 23.9, 1.3, 0.5, 'usda', 172766),
  (null, 'cereales_grasa', 'cereales_grasa', 'Pan tostado con mantequilla', 'Pan tostado con mantequilla', 'Toast with butter', '37 g', '37 g', '37 g', 36.5, 115, 3.8, 19.2, 2.4, 0.9, 'usda', 172674),
  (null, 'cereales_grasa', 'cereales_grasa', 'Galletas con chispas de chocolate', 'Galletas con chispas de chocolate', 'Chocolate chip cookies', '23 g', '23 g', '23 g', 23.1, 115, 1.1, 15.3, 5.8, 0, 'usda', 174952),
  (null, 'cereales_grasa', 'cereales_grasa', 'Papas a la francesa', 'Papas a la francesa', 'French fries', '40 g', '40 g', '40 g', 39.7, 115, 1.3, 15.7, 5.2, 1.5, 'usda', 169009),
  (null, 'cereales_grasa', 'cereales_grasa', 'Palomitas con mantequilla', 'Palomitas con mantequilla', 'Buttered popcorn', '21 g', '21 g', '21 g', 21.5, 115, 1.8, 12.3, 6.5, 2.1, 'usda', 173141),
  (null, 'cereales_grasa', 'cereales_grasa', 'Pastel de zanahoria', 'Pastel de zanahoria', 'Carrot cake', '282 g (~1 taza)', '282 g (~1 taza)', '282 g (~1 cup)', 281.9, 115, 2.3, 25.6, 0.4, 7.6, 'usda', 2258587),
  (null, 'leguminosas', 'leguminosas', 'Frijol negro cocido', 'Frijol negro cocido', 'Black beans, cooked', '104 g (~1 taza)', '104 g (~1 taza)', '104 g (~1 cup)', 104.3, 120, 7.2, 20.7, 1.3, 0, 'usda', 2644285),
  (null, 'leguminosas', 'leguminosas', 'Frijol pinto cocido', 'Frijol pinto cocido', 'Pinto beans, cooked', '103 g (~1 taza)', '103 g (~1 taza)', '103 g (~1 cup)', 102.6, 120, 6.9, 20.1, 1.3, 0, 'usda', 2644292),
  (null, 'leguminosas', 'leguminosas', 'Frijol bayo cocido', 'Frijol bayo cocido', 'Bayo beans, cooked', '94 g (~1/2 taza)', '94 g (~1/2 taza)', '94 g (~1/2 cup)', 94.5, 120, 7.4, 19.8, 1.2, 0, 'usda', 2644289),
  (null, 'leguminosas', 'leguminosas', 'Lenteja cocida', 'Lenteja cocida', 'Lentils, cooked', '33 g', '33 g', '33 g', 33.3, 120, 7.9, 20.7, 0.6, 0, 'usda', 2644283),
  (null, 'leguminosas', 'leguminosas', 'Garbanzo cocido', 'Garbanzo cocido', 'Chickpeas, cooked', '31 g', '31 g', '31 g', 31.3, 120, 6.7, 18.9, 2, 0, 'usda', 2644282),
  (null, 'leguminosas', 'leguminosas', 'Haba cocida', 'Haba cocida', 'Fava beans, cooked', '109 g (~1 taza)', '109 g (~1 taza)', '109 g (~1 cup)', 109.1, 120, 8.3, 21.4, 0.4, 5.9, 'usda', 173798),
  (null, 'leguminosas', 'leguminosas', 'Frijol de soya cocido', 'Frijol de soya cocido', 'Soybeans, cooked', '24 g', '24 g', '24 g', 24, 120, 9.8, 0.5, 8.8, 0, 'usda', 749420),
  (null, 'leguminosas', 'leguminosas', 'Edamame', 'Edamame', 'Edamame', '24 g', '24 g', '24 g', 24, 120, 9.8, 0.5, 8.8, 0, 'usda', 749420),
  (null, 'leguminosas', 'leguminosas', 'Hummus', 'Hummus', 'Hummus', '52 g', '52 g', '52 g', 52.4, 120, 3.9, 7.8, 9, 2.8, 'usda', 321358),
  (null, 'leguminosas', 'leguminosas', 'Tofu firme', 'Tofu firme', 'Tofu, firm', '141 g (~1 taza)', '141 g (~1 taza)', '141 g (~1 cup)', 141.2, 120, 15.4, 1.4, 5.9, 1.3, 'usda', 173788),
  (null, 'leguminosas', 'leguminosas', 'Tofu suave', 'Tofu suave', 'Tofu, soft', '28 g', '28 g', '28 g', 27.9, 120, 1.6, 19.4, 4, 0.9, 'usda', 333008),
  (null, 'leguminosas', 'leguminosas', 'Tempeh', 'Tempeh', 'Tempeh', '63 g (~1/2 taza)', '63 g (~1/2 taza)', '63 g (~1/2 cup)', 62.5, 120, 12.7, 4.8, 6.8, 0, 'usda', 174272),
  (null, 'verduras', 'verduras', 'Brócoli cocido', 'Brócoli cocido', 'Broccoli, cooked', '81 g (~1/2 taza)', '81 g (~1/2 taza)', '81 g (~1/2 cup)', 80.6, 25, 2.1, 5.1, 0.3, 1.9, 'usda', 747447),
  (null, 'verduras', 'verduras', 'Brócoli crudo', 'Brócoli crudo', 'Broccoli, raw', '81 g (~1/2 taza)', '81 g (~1/2 taza)', '81 g (~1/2 cup)', 80.6, 25, 2.1, 5.1, 0.3, 1.9, 'usda', 747447),
  (null, 'verduras', 'verduras', 'Coliflor cocida', 'Coliflor cocida', 'Cauliflower, cooked', '91 g (~1/2 taza)', '91 g (~1/2 taza)', '91 g (~1/2 cup)', 90.6, 25, 1.5, 4.3, 0.2, 1.8, 'usda', 2685573),
  (null, 'verduras', 'verduras', 'Espinaca cruda', 'Espinaca cruda', 'Spinach, raw', '94 g (~1/2 taza)', '94 g (~1/2 taza)', '94 g (~1/2 cup)', 94, 25, 2.7, 2.3, 0.6, 1.5, 'usda', 1999632),
  (null, 'verduras', 'verduras', 'Espinaca cocida', 'Espinaca cocida', 'Spinach, cooked', '94 g (~1/2 taza)', '94 g (~1/2 taza)', '94 g (~1/2 cup)', 94, 25, 2.7, 2.3, 0.6, 1.5, 'usda', 1999632),
  (null, 'verduras', 'verduras', 'Kale crudo', 'Kale crudo', 'Kale, raw', '71 g (~1/2 taza)', '71 g (~1/2 taza)', '71 g (~1/2 cup)', 71.4, 25, 2.1, 3.2, 1.1, 2.9, 'usda', 323505),
  (null, 'verduras', 'verduras', 'Acelga cocida', 'Acelga cocida', 'Swiss chard, cooked', '125 g (~1 taza)', '125 g (~1 taza)', '125 g (~1 cup)', 125, 25, 2.3, 5.2, 0.1, 2.6, 'usda', 169343),
  (null, 'verduras', 'verduras', 'Lechuga romana', 'Lechuga romana', 'Romaine lettuce', '147 g (~1 taza)', '147 g (~1 taza)', '147 g (~1 cup)', 147.1, 25, 1.8, 4.8, 0.4, 2.6, 'usda', 746769),
  (null, 'verduras', 'verduras', 'Lechuga iceberg', 'Lechuga iceberg', 'Iceberg lettuce', '146 g (~1 taza)', '146 g (~1 taza)', '146 g (~1 cup)', 146.2, 25, 1.1, 4.9, 0.1, 0, 'usda', 2346388),
  (null, 'verduras', 'verduras', 'Arugula', 'Arugula', 'Arugula', '81 g (~1/2 taza)', '81 g (~1/2 taza)', '81 g (~1/2 cup)', 80.6, 25, 1.3, 4.3, 0.3, 1.8, 'usda', 2710822),
  (null, 'verduras', 'verduras', 'Jitomate', 'Jitomate', 'Tomato', '73 g (~1/2 taza)', '73 g (~1/2 taza)', '73 g (~1/2 cup)', 73.3, 25, 0.9, 5, 0.2, 0, 'usda', 2346408),
  (null, 'verduras', 'verduras', 'Jitomate cherry', 'Jitomate cherry', 'Cherry tomato', '114 g (~1 taza)', '114 g (~1 taza)', '114 g (~1 cup)', 113.6, 25, 0.8, 4.4, 0.5, 1.1, 'usda', 1999634),
  (null, 'verduras', 'verduras', 'Pepino', 'Pepino', 'Cucumber', '157 g (~1 taza)', '157 g (~1 taza)', '157 g (~1 cup)', 157.2, 25, 1, 4.6, 0.3, 0, 'usda', 2346406),
  (null, 'verduras', 'verduras', 'Zanahoria cruda', 'Zanahoria cruda', 'Carrot, raw', '61 g (~1/2 taza)', '61 g (~1/2 taza)', '61 g (~1/2 cup)', 61.3, 25, 0.5, 5.6, 0.1, 1.6, 'usda', 2258587),
  (null, 'verduras', 'verduras', 'Zanahoria cocida', 'Zanahoria cocida', 'Carrot, cooked', '61 g (~1/2 taza)', '61 g (~1/2 taza)', '61 g (~1/2 cup)', 61.3, 25, 0.5, 5.6, 0.1, 1.6, 'usda', 2258587),
  (null, 'verduras', 'verduras', 'Apio crudo', 'Apio crudo', 'Celery, raw', '150 g (~1 taza)', '150 g (~1 taza)', '150 g (~1 cup)', 149.7, 25, 0.7, 5, 0.2, 0, 'usda', 2346405),
  (null, 'verduras', 'verduras', 'Pimiento rojo', 'Pimiento rojo', 'Red bell pepper', '80 g (~1/2 taza)', '80 g (~1/2 taza)', '80 g (~1/2 cup)', 79.9, 25, 0.7, 5.3, 0.1, 0.9, 'usda', 2258590),
  (null, 'verduras', 'verduras', 'Pimiento verde', 'Pimiento verde', 'Green bell pepper', '109 g (~1 taza)', '109 g (~1 taza)', '109 g (~1 cup)', 109.2, 25, 0.8, 5.2, 0.1, 1, 'usda', 2258588),
  (null, 'verduras', 'verduras', 'Pimiento amarillo', 'Pimiento amarillo', 'Yellow bell pepper', '81 g (~1/2 taza)', '81 g (~1/2 taza)', '81 g (~1/2 cup)', 81.2, 25, 0.7, 5.4, 0.1, 0.9, 'usda', 2258589),
  (null, 'verduras', 'verduras', 'Cebolla cruda', 'Cebolla cruda', 'Onion, raw', '57 g', '57 g', '57 g', 56.8, 25, 0.5, 5.6, 0.1, 1.3, 'usda', 790577),
  (null, 'verduras', 'verduras', 'Cebolla morada', 'Cebolla morada', 'Red onion', '57 g', '57 g', '57 g', 56.8, 25, 0.5, 5.6, 0.1, 1.3, 'usda', 790577),
  (null, 'verduras', 'verduras', 'Ajo crudo', 'Ajo crudo', 'Garlic, raw', '17 g', '17 g', '17 g', 17.5, 25, 1.2, 4.9, 0.1, 0.5, 'usda', 1104647),
  (null, 'verduras', 'verduras', 'Champiñones crudos', 'Champiñones crudos', 'Mushrooms, raw', '80 g (~1/2 taza)', '80 g (~1/2 taza)', '80 g (~1/2 cup)', 80.1, 25, 2.3, 3.3, 0.3, 1.4, 'usda', 1999629),
  (null, 'verduras', 'verduras', 'Champiñones cocidos', 'Champiñones cocidos', 'Mushrooms, cooked', '57 g', '57 g', '57 g', 56.7, 25, 1.4, 4.6, 0.1, 2.4, 'usda', 1999628),
  (null, 'verduras', 'verduras', 'Calabacita cocida', 'Calabacita cocida', 'Zucchini, cooked', '132 g (~1 taza)', '132 g (~1 taza)', '132 g (~1 cup)', 131.6, 25, 1.3, 4.3, 0.3, 1, 'usda', 2685568),
  (null, 'verduras', 'verduras', 'Berenjena cocida', 'Berenjena cocida', 'Eggplant, cooked', '96 g (~1/2 taza)', '96 g (~1/2 taza)', '96 g (~1/2 cup)', 95.8, 25, 0.8, 5.2, 0.1, 2.3, 'usda', 2685577),
  (null, 'verduras', 'verduras', 'Ejotes cocidos', 'Ejotes cocidos', 'Green beans, cooked', '63 g (~1/2 taza)', '63 g (~1/2 taza)', '63 g (~1/2 cup)', 62.5, 25, 1.2, 4.6, 0.2, 1.9, 'usda', 2346400),
  (null, 'verduras', 'verduras', 'Espárragos cocidos', 'Espárragos cocidos', 'Asparagus, cooked', '89 g (~1/2 taza)', '89 g (~1/2 taza)', '89 g (~1/2 cup)', 89, 25, 1.3, 4.5, 0.2, 1.7, 'usda', 2710823),
  (null, 'verduras', 'verduras', 'Alcachofa cocida', 'Alcachofa cocida', 'Artichoke, cooked', '5 g', '5 g', '5 g', 5, 25, 2, 0.1, 1.8, 0, 'usda', 749420),
  (null, 'verduras', 'verduras', 'Betabel cocido', 'Betabel cocido', 'Beets, cooked', '56 g', '56 g', '56 g', 56.1, 25, 0.9, 4.9, 0.2, 1.7, 'usda', 2685576),
  (null, 'verduras', 'verduras', 'Col cocida', 'Col cocida', 'Cabbage, cooked', '80 g (~1/2 taza)', '80 g (~1/2 taza)', '80 g (~1/2 cup)', 79.6, 25, 0.8, 5.1, 0.2, 0, 'usda', 2346407),
  (null, 'verduras', 'verduras', 'Col morada cruda', 'Col morada cruda', 'Red cabbage, raw', '73 g (~1/2 taza)', '73 g (~1/2 taza)', '73 g (~1/2 cup)', 73.3, 25, 0.9, 5, 0.2, 0, 'usda', 2346408),
  (null, 'verduras', 'verduras', 'Coles de Bruselas cocidas', 'Coles de Bruselas cocidas', 'Brussels sprouts, cooked', '42 g', '42 g', '42 g', 42, 25, 1.7, 4, 0.2, 2, 'usda', 2685575),
  (null, 'verduras', 'verduras', 'Nopales cocidos', 'Nopales cocidos', 'Nopales, cooked', '5 g', '5 g', '5 g', 5, 25, 2, 0.1, 1.8, 0, 'usda', 749420),
  (null, 'verduras', 'verduras', 'Chayote cocido', 'Chayote cocido', 'Chayote, cooked', '5 g', '5 g', '5 g', 5, 25, 2, 0.1, 1.8, 0, 'usda', 749420),
  (null, 'verduras', 'verduras', 'Rábano crudo', 'Rábano crudo', 'Radish, raw', '128 g (~1 taza)', '128 g (~1 taza)', '128 g (~1 cup)', 127.6, 25, 0.8, 5.2, 0.1, 1.7, 'usda', 2747665),
  (null, 'verduras', 'verduras', 'Jícama cruda', 'Jícama cruda', 'Jicama, raw', '56 g', '56 g', '56 g', 56.1, 25, 0.9, 4.9, 0.2, 1.7, 'usda', 2685576),
  (null, 'verduras', 'verduras', 'Poro cocido', 'Poro cocido', 'Leek, cooked', '5 g', '5 g', '5 g', 5, 25, 2, 0.1, 1.8, 0, 'usda', 749420),
  (null, 'verduras', 'verduras', 'Chile jalapeño', 'Chile jalapeño', 'Jalapeño pepper', '104 g (~1 taza)', '104 g (~1 taza)', '104 g (~1 cup)', 103.7, 25, 0.6, 5.3, 0.2, 1.8, 'usda', 2747661),
  (null, 'verduras', 'verduras', 'Chile poblano', 'Chile poblano', 'Poblano pepper', '89 g (~1/2 taza)', '89 g (~1/2 taza)', '89 g (~1/2 cup)', 89.3, 25, 1.3, 4.6, 0.2, 1.8, 'usda', 2747662),
  (null, 'frutas', 'frutas', 'Manzana', 'Manzana', 'Apple', '93 g (~1/2 taza)', '93 g (~1/2 taza)', '93 g (~1/2 cup)', 92.7, 60, 0.1, 14.6, 0.2, 1.9, 'usda', 1750340),
  (null, 'frutas', 'frutas', 'Manzana verde', 'Manzana verde', 'Green apple', '214 g (~1 taza)', '214 g (~1 taza)', '214 g (~1 cup)', 213.5, 60, 3.1, 10.9, 0.5, 4, 'usda', 2710823),
  (null, 'frutas', 'frutas', 'Plátano', 'Plátano', 'Banana', '71 g (~1/2 taza)', '71 g (~1/2 taza)', '71 g (~1/2 cup)', 70.6, 60, 0.5, 14.2, 0.2, 1.2, 'usda', 1105073),
  (null, 'frutas', 'frutas', 'Naranja', 'Naranja', 'Orange', '128 g (~1 taza)', '128 g (~1 taza)', '128 g (~1 cup)', 127.7, 60, 1.2, 15.1, 0.2, 2.6, 'usda', 746771),
  (null, 'frutas', 'frutas', 'Mandarina', 'Mandarina', 'Tangerine', '135 g (~1 taza)', '135 g (~1 taza)', '135 g (~1 cup)', 134.5, 60, 2.3, 11.8, 0.4, 4.2, 'usda', 2685576),
  (null, 'frutas', 'frutas', 'Limón', 'Limón', 'Lime', '135 g (~1 taza)', '135 g (~1 taza)', '135 g (~1 cup)', 134.5, 60, 2.3, 11.8, 0.4, 4.2, 'usda', 2685576),
  (null, 'frutas', 'frutas', 'Pera', 'Pera', 'Pear', '105 g (~1 taza)', '105 g (~1 taza)', '105 g (~1 cup)', 105.3, 60, 0.4, 15.9, 0.2, 3.3, 'usda', 746773),
  (null, 'frutas', 'frutas', 'Durazno', 'Durazno', 'Peach', '143 g (~1 taza)', '143 g (~1 taza)', '143 g (~1 cup)', 142.9, 60, 1.3, 14.4, 0.4, 2.1, 'usda', 325430),
  (null, 'frutas', 'frutas', 'Nectarina', 'Nectarina', 'Nectarine', '154 g (~1 taza)', '154 g (~1 taza)', '154 g (~1 cup)', 153.8, 60, 1.6, 14.1, 0.4, 2.3, 'usda', 327357),
  (null, 'frutas', 'frutas', 'Ciruela', 'Ciruela', 'Plum', '114 g (~1 taza)', '114 g (~1 taza)', '114 g (~1 cup)', 113.9, 60, 0.7, 15.4, 0.3, 1.5, 'usda', 2710837),
  (null, 'frutas', 'frutas', 'Chabacano', 'Chabacano', 'Apricot', '124 g (~1 taza)', '124 g (~1 taza)', '124 g (~1 cup)', 124, 60, 1.2, 12.6, 0.5, 1.9, 'usda', 2710815),
  (null, 'frutas', 'frutas', 'Cereza', 'Cereza', 'Cherries', '85 g (~1/2 taza)', '85 g (~1/2 taza)', '85 g (~1/2 cup)', 85.1, 60, 0.9, 13.8, 0.2, 0, 'usda', 2346399),
  (null, 'frutas', 'frutas', 'Uva', 'Uva', 'Grapes', '70 g (~1/2 taza)', '70 g (~1/2 taza)', '70 g (~1/2 cup)', 69.8, 60, 0.6, 14.1, 0.1, 0, 'usda', 2346412),
  (null, 'frutas', 'frutas', 'Uva verde', 'Uva verde', 'Green grapes', '75 g (~1/2 taza)', '75 g (~1/2 taza)', '75 g (~1/2 cup)', 74.9, 60, 0.7, 13.9, 0.2, 0, 'usda', 2346413),
  (null, 'frutas', 'frutas', 'Fresa', 'Fresa', 'Strawberries', '165 g (~1 taza)', '165 g (~1 taza)', '165 g (~1 cup)', 164.8, 60, 1.1, 13.1, 0.4, 0, 'usda', 2346409),
  (null, 'frutas', 'frutas', 'Frambuesa', 'Frambuesa', 'Raspberries', '105 g (~1 taza)', '105 g (~1 taza)', '105 g (~1 cup)', 104.7, 60, 1.1, 13.5, 0.2, 0, 'usda', 2346410),
  (null, 'frutas', 'frutas', 'Arándano azul', 'Arándano azul', 'Blueberries', '94 g (~1/2 taza)', '94 g (~1/2 taza)', '94 g (~1/2 cup)', 93.9, 60, 0.7, 13.7, 0.3, 0, 'usda', 2346411),
  (null, 'frutas', 'frutas', 'Sandía', 'Sandía', 'Watermelon', '309 g (~1 taza)', '309 g (~1 taza)', '309 g (~1 cup)', 309.3, 60, 1.6, 12.9, 0.2, 4.8, 'usda', 2747676),
  (null, 'frutas', 'frutas', 'Melón', 'Melón', 'Cantaloupe', '176 g (~1 taza)', '176 g (~1 taza)', '176 g (~1 cup)', 176.5, 60, 1.4, 14.4, 0.3, 1.4, 'usda', 746770),
  (null, 'frutas', 'frutas', 'Melón verde', 'Melón verde', 'Honeydew', '163 g (~1 taza)', '163 g (~1 taza)', '163 g (~1 cup)', 163.5, 60, 0.9, 13.3, 0.4, 0, 'usda', 2710816),
  (null, 'frutas', 'frutas', 'Piña', 'Piña', 'Pineapple', '100 g (~1 taza)', '100 g (~1 taza)', '100 g (~1 cup)', 99.8, 60, 0.5, 14.1, 0.2, 0.9, 'usda', 2346398),
  (null, 'frutas', 'frutas', 'Mango', 'Mango', 'Mango', '76 g (~1/2 taza)', '76 g (~1/2 taza)', '76 g (~1/2 cup)', 76.4, 60, 0.5, 13.3, 0.5, 1, 'usda', 2710834),
  (null, 'frutas', 'frutas', 'Papaya', 'Papaya', 'Papaya', '135 g (~1 taza)', '135 g (~1 taza)', '135 g (~1 cup)', 134.5, 60, 2.3, 11.8, 0.4, 4.2, 'usda', 2685576),
  (null, 'frutas', 'frutas', 'Kiwi', 'Kiwi', 'Kiwi', '92 g (~1/2 taza)', '92 g (~1/2 taza)', '92 g (~1/2 cup)', 92.2, 60, 0.9, 12.7, 0.6, 2, 'usda', 2710831),
  (null, 'frutas', 'frutas', 'Guayaba', 'Guayaba', 'Guava', '135 g (~1 taza)', '135 g (~1 taza)', '135 g (~1 cup)', 134.5, 60, 2.3, 11.8, 0.4, 4.2, 'usda', 2685576),
  (null, 'frutas', 'frutas', 'Tuna', 'Tuna', 'Prickly pear', '105 g (~1 taza)', '105 g (~1 taza)', '105 g (~1 cup)', 105.3, 60, 0.4, 15.9, 0.2, 3.3, 'usda', 746773),
  (null, 'frutas', 'frutas', 'Granada', 'Granada', 'Pomegranate', '135 g (~1 taza)', '135 g (~1 taza)', '135 g (~1 cup)', 134.5, 60, 2.3, 11.8, 0.4, 4.2, 'usda', 2685576),
  (null, 'frutas', 'frutas', 'Higo', 'Higo', 'Fig', '24 g', '24 g', '24 g', 24.1, 60, 0.8, 15.4, 0.2, 2.4, 'usda', 746768),
  (null, 'frutas', 'frutas', 'Dátil seco', 'Dátil seco', 'Dates, dried', '16 g', '16 g', '16 g', 16, 60, 12.8, 1, 0.1, 0, 'usda', 323793),
  (null, 'frutas', 'frutas', 'Pasas', 'Pasas', 'Raisins', '14 g', '14 g', '14 g', 14, 60, 0.8, 9.7, 2, 0.5, 'usda', 333008),
  (null, 'frutas', 'frutas', 'Coco rallado fresco', 'Coco rallado fresco', 'Coconut, fresh', '135 g (~1 taza)', '135 g (~1 taza)', '135 g (~1 cup)', 134.5, 60, 2.3, 11.8, 0.4, 4.2, 'usda', 2685576),
  (null, 'frutas', 'frutas', 'Aguacate', 'Aguacate', 'Avocado', '27 g', '27 g', '27 g', 26.9, 60, 0.5, 2.2, 5.5, 0, 'usda', 2710824),
  (null, 'frutas', 'frutas', 'Caqui', 'Caqui', 'Persimmon', '135 g (~1 taza)', '135 g (~1 taza)', '135 g (~1 cup)', 134.5, 60, 2.3, 11.8, 0.4, 4.2, 'usda', 2685576),
  (null, 'frutas', 'frutas', 'Lichi', 'Lichi', 'Lychee', '135 g (~1 taza)', '135 g (~1 taza)', '135 g (~1 cup)', 134.5, 60, 2.3, 11.8, 0.4, 4.2, 'usda', 2685576),
  (null, 'frutas', 'frutas', 'Carambola', 'Carambola', 'Starfruit', '135 g (~1 taza)', '135 g (~1 taza)', '135 g (~1 cup)', 134.5, 60, 2.3, 11.8, 0.4, 4.2, 'usda', 2685576),
  (null, 'frutas', 'frutas', 'Mamey', 'Mamey', 'Mamey sapote', '48 g', '48 g', '48 g', 48.4, 60, 0.7, 15.5, 0.2, 2.6, 'usda', 167760),
  (null, 'lacteos_descremados', 'lacteos_descremados', 'Leche descremada', 'Leche descremada', 'Skim milk', '1.2 taza (280 ml)', '1.2 taza (280 ml)', '1.2 cup (280 ml)', 279.4, 95, 9.6, 13.7, 0.2, 0, 'usda', 746776),
  (null, 'lacteos_descremados', 'lacteos_descremados', 'Leche deslactosada light', 'Leche deslactosada light', 'Lactose-free skim milk', '1.2 taza (280 ml)', '1.2 taza (280 ml)', '1.2 cup (280 ml)', 279.4, 95, 9.6, 13.7, 0.2, 0, 'usda', 746776),
  (null, 'lacteos_descremados', 'lacteos_descremados', 'Yogur natural sin grasa', 'Yogur natural sin grasa', 'Nonfat plain yogurt', '1/2 taza (190 ml)', '1/2 taza (190 ml)', '1/2 cup (190 ml)', 190, 95, 8, 15.4, 0.2, 0, 'usda', 2647437),
  (null, 'lacteos_descremados', 'lacteos_descremados', 'Yogur griego sin grasa', 'Yogur griego sin grasa', 'Nonfat Greek yogurt', '1/2 taza (155 ml)', '1/2 taza (155 ml)', '1/2 cup (155 ml)', 155.7, 95, 16, 5.7, 0.6, 0, 'usda', 330137),
  (null, 'lacteos_descremados', 'lacteos_descremados', 'Queso cottage bajo en grasa', 'Queso cottage bajo en grasa', 'Low-fat cottage cheese', '1/4 taza (115 ml)', '1/4 taza (115 ml)', '1/4 cup (115 ml)', 113.1, 95, 12.4, 4.9, 2.6, 0, 'usda', 328841),
  (null, 'lacteos_descremados', 'lacteos_descremados', 'Queso panela', 'Queso panela', 'Panela cheese', '25 ml', '25 ml', '25 ml', 23.3, 95, 5.4, 0.6, 7.9, 0, 'usda', 328637),
  (null, 'lacteos_descremados', 'lacteos_descremados', 'Queso ricotta parcialmente descremado', 'Queso ricotta parcialmente descremado', 'Part-skim ricotta', '30 ml', '30 ml', '30 ml', 31.9, 95, 7.6, 1.4, 6.5, 0, 'usda', 329370),
  (null, 'lacteos_descremados', 'lacteos_descremados', 'Leche evaporada descremada', 'Leche evaporada descremada', 'Evaporated skim milk', '1.2 taza (280 ml)', '1.2 taza (280 ml)', '1.2 cup (280 ml)', 279.4, 95, 9.6, 13.7, 0.2, 0, 'usda', 746776),
  (null, 'lacteos_semi', 'lacteos_semi', 'Leche semidescremada (2%)', 'Leche semidescremada (2%)', '2% milk', '1/2 taza (220 ml)', '1/2 taza (220 ml)', '1/2 cup (220 ml)', 220, 110, 7.4, 10.8, 4.2, 0, 'usda', 746778),
  (null, 'lacteos_semi', 'lacteos_semi', 'Yogur natural 2%', 'Yogur natural 2%', '2% plain yogurt', '1/2 taza (220 ml)', '1/2 taza (220 ml)', '1/2 cup (220 ml)', 220, 110, 9.3, 17.8, 0.2, 0, 'usda', 2647437),
  (null, 'lacteos_semi', 'lacteos_semi', 'Yogur griego 2%', 'Yogur griego 2%', '2% Greek yogurt', '1/2 taza (180 ml)', '1/2 taza (180 ml)', '1/2 cup (180 ml)', 180.3, 110, 18.6, 6.6, 0.7, 0, 'usda', 330137),
  (null, 'lacteos_semi', 'lacteos_semi', 'Queso mozzarella semidescremado', 'Queso mozzarella semidescremado', 'Part-skim mozzarella', '35 ml', '35 ml', '35 ml', 36.9, 110, 8.7, 1.6, 7.5, 0, 'usda', 329370),
  (null, 'lacteos_semi', 'lacteos_semi', 'Queso fresco', 'Queso fresco', 'Queso fresco', '35 ml', '35 ml', '35 ml', 36.9, 110, 7, 1.1, 8.6, 0, 'usda', 2647442),
  (null, 'lacteos_semi', 'lacteos_semi', 'Queso Oaxaca', 'Queso Oaxaca', 'Oaxaca cheese', '35 ml', '35 ml', '35 ml', 37, 110, 8.2, 0.9, 8.2, 0, 'usda', 2647441),
  (null, 'lacteos_semi', 'lacteos_semi', 'Queso feta', 'Queso feta', 'Feta cheese', '40 ml', '40 ml', '40 ml', 40.3, 110, 7.9, 2.2, 7.7, 0, 'usda', 2259796),
  (null, 'lacteos_enteros', 'lacteos_enteros', 'Leche entera', 'Leche entera', 'Whole milk', '1.0 taza (250 ml)', '1.0 taza (250 ml)', '1.0 cup (250 ml)', 250, 150, 8.2, 11.6, 8, 0, 'usda', 746782),
  (null, 'lacteos_enteros', 'lacteos_enteros', 'Yogur natural entero', 'Yogur natural entero', 'Whole plain yogurt', '1/2 taza (190 ml)', '1/2 taza (190 ml)', '1/2 cup (190 ml)', 192.3, 150, 7.3, 10.7, 8.6, 0, 'usda', 2259793),
  (null, 'lacteos_enteros', 'lacteos_enteros', 'Queso cheddar', 'Queso cheddar', 'Cheddar cheese', '35 ml', '35 ml', '35 ml', 36.8, 150, 8.6, 0.9, 12.5, 0, 'usda', 328637),
  (null, 'lacteos_enteros', 'lacteos_enteros', 'Queso manchego', 'Queso manchego', 'Manchego cheese', '35 ml', '35 ml', '35 ml', 36.8, 150, 8.6, 0.9, 12.5, 0, 'usda', 328637),
  (null, 'lacteos_enteros', 'lacteos_enteros', 'Queso brie', 'Queso brie', 'Brie cheese', '35 ml', '35 ml', '35 ml', 36.8, 150, 8.6, 0.9, 12.5, 0, 'usda', 328637),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Clara de huevo', 'Clara de huevo', 'Egg white', '83 g (~1/2 taza)', '83 g (~1/2 taza)', '83 g (~1/2 cup)', 83.3, 40, 8.4, 0.6, 0.1, 0, 'usda', 323697),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Pechuga de pollo sin piel cocida', 'Pechuga de pollo sin piel cocida', 'Chicken breast skinless, cooked', '38 g', '38 g', '38 g', 37.7, 40, 8.5, 0, 0.7, 0, 'usda', 2646170),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Atún en agua', 'Atún en agua', 'Tuna canned in water', '44 g', '44 g', '44 g', 44.4, 40, 8.4, 0, 0.4, 0, 'usda', 334194),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Bacalao cocido', 'Bacalao cocido', 'Cod, cooked', '66 g (~1/2 taza)', '66 g (~1/2 taza)', '66 g (~1/2 cup)', 65.8, 40, 9.3, 0.3, 0.1, 0, 'usda', 2747654),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Tilapia cocida', 'Tilapia cocida', 'Tilapia, cooked', '42 g', '42 g', '42 g', 42.2, 40, 8, 0, 1, 0, 'usda', 2684442),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Mojarra cocida', 'Mojarra cocida', 'Sea bream, cooked', '19 g', '19 g', '19 g', 19.1, 40, 2.9, 0, 3.2, 0, 'usda', 2747668),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Camarón cocido', 'Camarón cocido', 'Shrimp, cooked', '56 g', '56 g', '56 g', 56, 40, 8.7, 0.3, 0.4, 0, 'usda', 2684443),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Langosta cocida', 'Langosta cocida', 'Lobster, cooked', '68 g (~1/2 taza)', '68 g (~1/2 taza)', '68 g (~1/2 cup)', 68, 40, 8.8, 0.6, 0.2, 0, 'usda', 2747657),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Pulpo cocido', 'Pulpo cocido', 'Octopus, cooked', '8 g', '8 g', '8 g', 8, 40, 3.3, 0.2, 2.9, 0, 'usda', 749420),
  (null, 'proteina_baja', 'proteina_baja', 'Pechuga de pollo con piel cocida', 'Pechuga de pollo con piel cocida', 'Chicken breast with skin', '43 g', '43 g', '43 g', 43.3, 55, 9.3, 0, 2.1, 0, 'usda', 2727569),
  (null, 'proteina_baja', 'proteina_baja', 'Muslo de pollo sin piel', 'Muslo de pollo sin piel', 'Chicken thigh skinless', '38 g', '38 g', '38 g', 38.2, 55, 7.1, 0, 3, 0, 'usda', 2646171),
  (null, 'proteina_baja', 'proteina_baja', 'Carne molida de res 95% magra', 'Carne molida de res 95% magra', '95% lean ground beef', '23 g', '23 g', '23 g', 22.6, 55, 4, 0, 4.4, 0, 'usda', 2514744),
  (null, 'proteina_baja', 'proteina_baja', 'Bistec de res magro', 'Bistec de res magro', 'Lean beef steak', '39 g', '39 g', '39 g', 39, 55, 8.4, 0.3, 2.2, 0, 'usda', 2646173),
  (null, 'proteina_baja', 'proteina_baja', 'Lomo de cerdo magro', 'Lomo de cerdo magro', 'Lean pork loin', '31 g', '31 g', '31 g', 31.3, 55, 8.7, 0, 2, 0, 'usda', 746758),
  (null, 'proteina_baja', 'proteina_baja', 'Jamón de pavo bajo en grasa', 'Jamón de pavo bajo en grasa', 'Low-fat turkey ham', '45 g', '45 g', '45 g', 45.5, 55, 8.9, 1.1, 1.7, 0, 'usda', 746952),
  (null, 'proteina_baja', 'proteina_baja', 'Atún fresco cocido', 'Atún fresco cocido', 'Fresh tuna, cooked', '30 g', '30 g', '30 g', 29.9, 55, 8.9, 0, 1.9, 0, 'usda', 173707),
  (null, 'proteina_baja', 'proteina_baja', 'Salmón ahumado', 'Salmón ahumado', 'Smoked salmon', '28 g', '28 g', '28 g', 27.9, 55, 5.7, 0, 3.7, 0, 'usda', 2684441),
  (null, 'proteina_baja', 'proteina_baja', 'Trucha cocida', 'Trucha cocida', 'Trout, cooked', '11 g', '11 g', '11 g', 11, 55, 4.5, 0.2, 4, 0, 'usda', 749420),
  (null, 'proteina_baja', 'proteina_baja', 'Atún en aceite escurrido', 'Atún en aceite escurrido', 'Tuna canned in oil, drained', '61 g (~1/2 taza)', '61 g (~1/2 taza)', '61 g (~1/2 cup)', 61.1, 55, 11.6, 0, 0.6, 0, 'usda', 334194),
  (null, 'proteina_baja', 'proteina_baja', 'Huevo entero', 'Huevo entero', 'Whole egg', '37 g', '37 g', '37 g', 36.7, 55, 4.5, 0.3, 3.8, 0, 'usda', 323604),
  (null, 'proteina_media', 'proteina_media', 'Carne molida de res 85% magra', 'Carne molida de res 85% magra', '85% lean ground beef', '31 g', '31 g', '31 g', 30.9, 75, 5.4, 0, 6, 0, 'usda', 2514744),
  (null, 'proteina_media', 'proteina_media', 'Pierna de cordero', 'Pierna de cordero', 'Lamb leg', '33 g', '33 g', '33 g', 33.3, 75, 8.8, 0, 4.1, 0, 'usda', 172485),
  (null, 'proteina_media', 'proteina_media', 'Salmón cocido', 'Salmón cocido', 'Salmon, cooked', '38 g', '38 g', '38 g', 38.1, 75, 7.7, 0, 5, 0, 'usda', 2684441),
  (null, 'proteina_media', 'proteina_media', 'Sardinas en aceite', 'Sardinas en aceite', 'Sardines in oil', '36 g', '36 g', '36 g', 36.4, 75, 9.8, 0.9, 3.6, 0, 'usda', 2747652),
  (null, 'proteina_media', 'proteina_media', 'Costilla de cerdo magra', 'Costilla de cerdo magra', 'Pork ribs lean', '40 g', '40 g', '40 g', 39.7, 75, 7.7, 0, 4.7, 0, 'usda', 167895),
  (null, 'proteina_media', 'proteina_media', 'Hígado de res', 'Hígado de res', 'Beef liver', '23 g', '23 g', '23 g', 22.9, 75, 3, 0.8, 6.6, 0, 'usda', 746779),
  (null, 'proteina_media', 'proteina_media', 'Pierna de cerdo asada', 'Pierna de cerdo asada', 'Roast pork leg', '27 g', '27 g', '27 g', 27.5, 75, 7.4, 0, 4.8, 0, 'usda', 168223),
  (null, 'proteina_alta', 'proteina_alta', 'Tocino', 'Tocino', 'Bacon', '20 g', '20 g', '20 g', 20, 100, 8.2, 0.4, 7.3, 0, 'usda', 749420),
  (null, 'proteina_alta', 'proteina_alta', 'Salchicha de cerdo', 'Salchicha de cerdo', 'Pork sausage', '31 g', '31 g', '31 g', 31.1, 100, 5.7, 0.7, 8.1, 0, 'usda', 746780),
  (null, 'proteina_alta', 'proteina_alta', 'Chorizo', 'Chorizo', 'Chorizo', '29 g', '29 g', '29 g', 28.9, 100, 5.6, 0.8, 8.1, 0, 'usda', 746781),
  (null, 'proteina_alta', 'proteina_alta', 'Costilla de res', 'Costilla de res', 'Beef ribs', '30 g', '30 g', '30 g', 30.5, 100, 4.1, 1, 8.8, 0, 'usda', 746779),
  (null, 'proteina_alta', 'proteina_alta', 'Chuleta de cerdo', 'Chuleta de cerdo', 'Pork chop', '72 g (~1/2 taza)', '72 g (~1/2 taza)', '72 g (~1/2 cup)', 72.5, 100, 16.5, 0, 4, 0, 'usda', 2727575),
  (null, 'proteina_alta', 'proteina_alta', 'Queso americano', 'Queso americano', 'American cheese', '27 g', '27 g', '27 g', 26.7, 100, 4.7, 1.7, 8.3, 0, 'usda', 747429),
  (null, 'proteina_alta', 'proteina_alta', 'Salami', 'Salami', 'Salami', '44 g', '44 g', '44 g', 43.9, 100, 7.8, 0, 7.7, 0, 'usda', 2514745),
  (null, 'grasas_mono', 'grasas_mono', 'Aceite de oliva', 'Aceite de oliva', 'Olive oil', '22 g', '22 g', '22 g', 21.8, 45, 5.9, 0.5, 2.2, 0, 'usda', 2747652),
  (null, 'grasas_mono', 'grasas_mono', 'Aceite de aguacate', 'Aceite de aguacate', 'Avocado oil', '20 g', '20 g', '20 g', 20.2, 45, 0.4, 1.7, 4.1, 0, 'usda', 2710824),
  (null, 'grasas_mono', 'grasas_mono', 'Aceitunas verdes', 'Aceitunas verdes', 'Green olives', '35 g', '35 g', '35 g', 34.6, 45, 0.4, 1.7, 4.5, 1.4, 'usda', 332791),
  (null, 'grasas_mono', 'grasas_mono', 'Aceitunas negras', 'Aceitunas negras', 'Black olives', '85 g', '85 g', '85 g', 85.4, 45, 0.5, 11.5, 0.2, 1.2, 'usda', 2710837),
  (null, 'grasas_mono', 'grasas_mono', 'Almendras', 'Almendras', 'Almonds', '1 cda (7 g)', '1 cda (7 g)', '1 tbsp (7 g)', 7.2, 45, 1.5, 1.4, 3.7, 0.8, 'usda', 2346393),
  (null, 'grasas_mono', 'grasas_mono', 'Nueces de la India', 'Nueces de la India', 'Cashews', '1 cda (8 g)', '1 cda (8 g)', '1 tbsp (8 g)', 8, 45, 1.4, 2.9, 3.1, 0.3, 'usda', 2515374),
  (null, 'grasas_mono', 'grasas_mono', 'Avellanas', 'Avellanas', 'Hazelnuts', '1 cda (7 g)', '1 cda (7 g)', '1 tbsp (7 g)', 7, 45, 0.9, 1.9, 3.8, 0.6, 'usda', 2515375),
  (null, 'grasas_mono', 'grasas_mono', 'Cacahuates', 'Cacahuates', 'Peanuts', '1 cda (8 g)', '1 cda (8 g)', '1 tbsp (8 g)', 7.7, 45, 1.8, 2, 3.3, 0.6, 'usda', 2515376),
  (null, 'grasas_mono', 'grasas_mono', 'Crema de cacahuate natural', 'Crema de cacahuate natural', 'Natural peanut butter', '1 cda (7 g)', '1 cda (7 g)', '1 tbsp (7 g)', 7.1, 45, 1.7, 1.6, 3.5, 0.5, 'usda', 2262072),
  (null, 'grasas_mono', 'grasas_mono', 'Crema de almendra', 'Crema de almendra', 'Almond butter', '1 cdta (7 g)', '1 cdta (7 g)', '1 tsp (7 g)', 7, 45, 1.5, 1.5, 3.7, 0.7, 'usda', 2262074),
  (null, 'grasas_poli', 'grasas_poli', 'Semillas de chía', 'Semillas de chía', 'Chia seeds', '1 cda (9 g)', '1 cda (9 g)', '1 tbsp (9 g)', 8.7, 45, 1.5, 3.3, 2.9, 0, 'usda', 2710819),
  (null, 'grasas_poli', 'grasas_poli', 'Semillas de linaza', 'Semillas de linaza', 'Flax seeds', '1 cda (8 g)', '1 cda (8 g)', '1 tbsp (8 g)', 8.3, 45, 1.5, 2.8, 3.1, 1.9, 'usda', 2262075),
  (null, 'grasas_poli', 'grasas_poli', 'Semillas de girasol', 'Semillas de girasol', 'Sunflower seeds', '1 cda (7 g)', '1 cda (7 g)', '1 tbsp (7 g)', 7.4, 45, 1.4, 1.8, 3.6, 0.5, 'usda', 2515381),
  (null, 'grasas_poli', 'grasas_poli', 'Semillas de calabaza', 'Semillas de calabaza', 'Pumpkin seeds', '1 cda (8 g)', '1 cda (8 g)', '1 tbsp (8 g)', 8.1, 45, 2.4, 1.5, 3.2, 0.4, 'usda', 2515380),
  (null, 'grasas_poli', 'grasas_poli', 'Semillas de ajonjolí', 'Semillas de ajonjolí', 'Sesame seeds', '1 cda (8 g)', '1 cda (8 g)', '1 tbsp (8 g)', 8.1, 45, 2.4, 1.5, 3.2, 0.4, 'usda', 2515380),
  (null, 'grasas_poli', 'grasas_poli', 'Nueces de Castilla', 'Nueces de Castilla', 'Walnuts', '1 cdta (6 g)', '1 cdta (6 g)', '1 tsp (6 g)', 6.2, 45, 0.9, 0.7, 4.3, 0.3, 'usda', 2346394),
  (null, 'grasas_poli', 'grasas_poli', 'Nueces pecanas', 'Nueces pecanas', 'Pecans', '1 cdta (6 g)', '1 cdta (6 g)', '1 tsp (6 g)', 6, 45, 0.6, 0.8, 4.4, 0.3, 'usda', 2346395),
  (null, 'grasas_saturadas', 'grasas_saturadas', 'Manteca de cerdo', 'Manteca de cerdo', 'Lard', '20 g', '20 g', '20 g', 19.7, 45, 3.5, 0, 3.5, 0, 'usda', 2514745),
  (null, 'grasas_saturadas', 'grasas_saturadas', 'Crema espesa', 'Crema espesa', 'Heavy cream', '1 cda (13 g)', '1 cda (13 g)', '1 tbsp (13 g)', 13.1, 45, 0.3, 0.5, 4.7, 0, 'usda', 2346386),
  (null, 'grasas_saturadas', 'grasas_saturadas', 'Crema ácida', 'Crema ácida', 'Sour cream', '23 g', '23 g', '23 g', 23, 45, 0.7, 1.3, 4.1, 0, 'usda', 2346387),
  (null, 'grasas_saturadas', 'grasas_saturadas', 'Aceite de coco', 'Aceite de coco', 'Coconut oil', '1 cdta (5 g)', '1 cdta (5 g)', '1 tsp (5 g)', 5.4, 45, 0, 0, 5.4, 0, 'usda', 330458),
  (null, 'grasas_saturadas', 'grasas_saturadas', 'Queso crema', 'Queso crema', 'Cream cheese', '1 cda (13 g)', '1 cda (13 g)', '1 tbsp (13 g)', 13.1, 45, 0.8, 0.6, 4.4, 0, 'usda', 2346385),
  (null, 'azucares', 'azucares', 'Azúcar blanca', 'Azúcar blanca', 'White sugar', '10 g', '10 g', '10 g', 10.4, 40, 0, 10.3, 0, 0, 'usda', 746784),
  (null, 'azucares', 'azucares', 'Azúcar morena', 'Azúcar morena', 'Brown sugar', '11 g', '11 g', '11 g', 11, 40, 0.8, 8.3, 0.4, 0, 'usda', 1104812),
  (null, 'azucares', 'azucares', 'Miel de abeja', 'Miel de abeja', 'Honey', '13 g', '13 g', '13 g', 13.2, 40, 0, 10.8, 0, 0, 'usda', 169640),
  (null, 'azucares', 'azucares', 'Miel de maple', 'Miel de maple', 'Maple syrup', '15 g', '15 g', '15 g', 15.4, 40, 0, 10.3, 0, 0, 'usda', 169661),
  (null, 'azucares', 'azucares', 'Mermelada', 'Mermelada', 'Jam', '48 g', '48 g', '48 g', 48.2, 40, 3.9, 5.9, 0.1, 0.3, 'usda', 330415),
  (null, 'azucares', 'azucares', 'Cajeta', 'Cajeta', 'Cajeta', '13 g', '13 g', '13 g', 12.7, 40, 0.9, 7, 0.9, 0, 'usda', 173461),
  (null, 'azucares', 'azucares', 'Piloncillo', 'Piloncillo', 'Piloncillo', '11 g', '11 g', '11 g', 10.8, 40, 0, 10.7, 0, 0, 'usda', 2076885),
  (null, 'azucares', 'azucares', 'Chocolate de mesa', 'Chocolate de mesa', 'Mexican chocolate', '9 g', '9 g', '9 g', 9.4, 40, 0.3, 7.3, 1.5, 0.4, 'usda', 167999),
  (null, 'azucares', 'azucares', 'Helado de vainilla', 'Helado de vainilla', 'Vanilla ice cream', '19 g', '19 g', '19 g', 19.3, 40, 0.7, 4.6, 2.1, 0.1, 'usda', 167575),
  (null, 'azucares', 'azucares', 'Refresco de cola', 'Refresco de cola', 'Cola soda', '108 g (~1 taza)', '108 g (~1 taza)', '108 g (~1 cup)', 108.1, 40, 0.1, 10.3, 0, 0, 'usda', 175093),
  (null, 'bebidas_deporte', 'bebidas_deporte', 'Gatorade clásico', 'Gatorade clásico', 'Gatorade classic', '1.0 taza (240 ml)', '1.0 taza (240 ml)', '1.0 cup (240 ml)', 240, 19, 0, 4.8, 0, 0, 'usda', 2088133),
  (null, 'bebidas_deporte', 'bebidas_deporte', 'Powerade', 'Powerade', 'Powerade', '1.0 taza (240 ml)', '1.0 taza (240 ml)', '1.0 cup (240 ml)', 240, 77, 0, 18.8, 0.1, 0, 'usda', 175108),
  (null, 'bebidas_deporte', 'bebidas_deporte', 'Bebida isotónica', 'Bebida isotónica', 'Isotonic sports drink', '1.0 taza (240 ml)', '1.0 taza (240 ml)', '1.0 cup (240 ml)', 240, 62, 0, 15.4, 0, 0, 'usda', 2710771),
  (null, 'bebidas_deporte', 'bebidas_deporte', 'Bebida de electrolitos sin azúcar', 'Bebida de electrolitos sin azúcar', 'Sugar-free electrolyte drink', '1.0 taza (240 ml)', '1.0 taza (240 ml)', '1.0 cup (240 ml)', 240, 2, 0.6, 1.7, 0.2, 0, 'usda', 174177),
  (null, 'bebidas_deporte', 'bebidas_deporte', 'Agua de coco natural', 'Agua de coco natural', 'Coconut water', '1.0 taza (240 ml)', '1.0 taza (240 ml)', '1.0 cup (240 ml)', 240, 552, 5.5, 13.3, 57.1, 5.3, 'usda', 170172);

-- BEGIN expanded catalog (Plan Builder v2)

-- New canonical food groups for the expanded catalog
insert into public.food_groups (key, name_es, name_en, display_order, exchange_kcal, exchange_protein_g, exchange_carbs_g, exchange_fat_g, notes_es, notes_en) values
  ('bebidas',     'Bebidas',      'Beverages',    18, null, 0, 0, 0, 'Valores por 100 ml salvo indicación', 'Values per 100 ml unless noted'),
  ('suplementos', 'Suplementos',  'Supplements',  19, null, 0, 0, 0, 'Información por porción', 'Per serving information'),
  ('snacks',      'Snacks',       'Snacks',       20, null, 0, 0, 0, null, null)
on conflict (key) do update set
  name_es = excluded.name_es,
  name_en = excluded.name_en,
  display_order = excluded.display_order,
  notes_es = excluded.notes_es,
  notes_en = excluded.notes_en;

-- Beverages, supplements and curated whole foods
insert into public.equivalents (
  user_id, group_name, group_key,
  food_name, food_name_es, food_name_en,
  serving_desc, serving_desc_es, serving_desc_en,
  serving_g, kcal, protein_g, carbs_g, fat_g, fiber_g,
  source, fdc_id
) values
  (null, 'bebidas', 'bebidas', 'Agua', 'Agua', 'Water', '250 g', '250 g', '250 g', 250, 0, 0, 0, 0, 0, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Agua con electrolitos', 'Agua con electrolitos', 'Electrolyte water', '250 g', '250 g', '250 g', 250, 5, 0, 1, 0, 0, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Té verde', 'Té verde', 'Green tea', '250 g', '250 g', '250 g', 250, 1, 0, 0, 0, 0, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Té negro', 'Té negro', 'Black tea', '250 g', '250 g', '250 g', 250, 1, 0, 0, 0, 0, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Café negro', 'Café negro', 'Black coffee', '250 g', '250 g', '250 g', 250, 2, 0.3, 0, 0, 0, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Leche entera', 'Leche entera', 'Whole milk', '250 g', '250 g', '250 g', 250, 61, 3.2, 4.8, 3.3, 0, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Leche descremada', 'Leche descremada', 'Skim milk', '250 g', '250 g', '250 g', 250, 35, 3.4, 5, 0.1, 0, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Leche de almendra', 'Leche de almendra', 'Almond milk', '250 g', '250 g', '250 g', 250, 15, 0.5, 0.5, 1.1, 0, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Leche de soya', 'Leche de soya', 'Soy milk', '250 g', '250 g', '250 g', 250, 43, 3.3, 2.8, 2.1, 0.4, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Leche de avena', 'Leche de avena', 'Oat milk', '250 g', '250 g', '250 g', 250, 45, 1, 6.5, 1.5, 0.5, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Jugo de naranja', 'Jugo de naranja', 'Orange juice', '250 g', '250 g', '250 g', 250, 45, 0.7, 10.4, 0.2, 0.2, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Jugo de manzana', 'Jugo de manzana', 'Apple juice', '250 g', '250 g', '250 g', 250, 46, 0.1, 11.4, 0.1, 0.1, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Jugo de uva', 'Jugo de uva', 'Grape juice', '250 g', '250 g', '250 g', 250, 60, 0.4, 14.8, 0.1, 0.1, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Refresco cola', 'Refresco cola', 'Cola soda', '250 g', '250 g', '250 g', 250, 41, 0, 10.6, 0, 0, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Gatorade', 'Gatorade', 'Gatorade', '250 g', '250 g', '250 g', 250, 26, 0, 6.7, 0, 0, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Powerade', 'Powerade', 'Powerade', '250 g', '250 g', '250 g', 250, 25, 0, 6.3, 0, 0, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Red Bull', 'Red Bull', 'Red Bull', '250 g', '250 g', '250 g', 250, 45, 0.4, 11.3, 0, 0, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Monster Energy', 'Monster Energy', 'Monster Energy', '250 g', '250 g', '250 g', 250, 47, 0.5, 11.5, 0, 0, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Kombucha', 'Kombucha', 'Kombucha', '250 g', '250 g', '250 g', 250, 25, 0.2, 6, 0, 0, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Cerveza', 'Cerveza', 'Beer', '250 g', '250 g', '250 g', 250, 43, 0.5, 3.6, 0, 0, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Vino tinto', 'Vino tinto', 'Red wine', '150 g', '150 g', '150 g', 150, 85, 0.1, 2.6, 0, 0, 'curated', null),
  (null, 'bebidas', 'bebidas', 'Vino blanco', 'Vino blanco', 'White wine', '150 g', '150 g', '150 g', 150, 82, 0.1, 2.6, 0, 0, 'curated', null),
  (null, 'suplementos', 'suplementos', 'Whey protein', 'Whey protein', 'Whey protein', '30 g', '30 g', '30 g', 30, 120, 25, 3, 2, 0, 'curated', null),
  (null, 'suplementos', 'suplementos', 'Caseína', 'Caseína', 'Casein protein', '30 g', '30 g', '30 g', 30, 110, 24, 4, 1, 0, 'curated', null),
  (null, 'suplementos', 'suplementos', 'Proteína vegetal', 'Proteína vegetal', 'Plant protein', '30 g', '30 g', '30 g', 30, 115, 22, 5, 2, 0, 'curated', null),
  (null, 'suplementos', 'suplementos', 'Creatina', 'Creatina', 'Creatine monohydrate', '5 g', '5 g', '5 g', 5, 0, 0, 0, 0, 0, 'curated', null),
  (null, 'suplementos', 'suplementos', 'BCAA', 'BCAA', 'BCAA', '10 g', '10 g', '10 g', 10, 40, 7, 2, 0, 0, 'curated', null),
  (null, 'suplementos', 'suplementos', 'EAA', 'EAA', 'EAA', '10 g', '10 g', '10 g', 10, 40, 8, 2, 0, 0, 'curated', null),
  (null, 'suplementos', 'suplementos', 'Pre-workout', 'Pre-workout', 'Pre-workout', '10 g', '10 g', '10 g', 10, 10, 0, 2, 0, 0, 'curated', null),
  (null, 'suplementos', 'suplementos', 'Omega-3', 'Omega-3', 'Omega-3 fish oil', '3 g', '3 g', '3 g', 3, 25, 0, 0, 2.5, 0, 'curated', null),
  (null, 'suplementos', 'suplementos', 'Multivitamínico', 'Multivitamínico', 'Multivitamin', '1 g', '1 g', '1 g', 1, 5, 0, 1, 0, 0, 'curated', null),
  (null, 'suplementos', 'suplementos', 'Vitamina D', 'Vitamina D', 'Vitamin D', '1 g', '1 g', '1 g', 1, 0, 0, 0, 0, 0, 'curated', null),
  (null, 'suplementos', 'suplementos', 'Magnesio', 'Magnesio', 'Magnesium', '1 g', '1 g', '1 g', 1, 0, 0, 0, 0, 0, 'curated', null),
  (null, 'suplementos', 'suplementos', 'Electrolitos en polvo', 'Electrolitos en polvo', 'Electrolyte powder', '5 g', '5 g', '5 g', 5, 20, 0, 5, 0, 0, 'curated', null),
  (null, 'suplementos', 'suplementos', 'Colágeno', 'Colágeno', 'Collagen peptides', '10 g', '10 g', '10 g', 10, 35, 8, 0, 0, 0, 'curated', null),
  (null, 'suplementos', 'suplementos', 'Glutamina', 'Glutamina', 'Glutamine', '5 g', '5 g', '5 g', 5, 20, 5, 0, 0, 0, 'curated', null),
  (null, 'suplementos', 'suplementos', 'Beta-alanina', 'Beta-alanina', 'Beta-alanine', '3 g', '3 g', '3 g', 3, 12, 3, 0, 0, 0, 'curated', null),
  (null, 'suplementos', 'suplementos', 'Citrulina', 'Citrulina', 'L-Citrulline', '6 g', '6 g', '6 g', 6, 24, 0, 0, 0, 0, 'curated', null),
  (null, 'suplementos', 'suplementos', 'Cafeína', 'Cafeína', 'Caffeine (200mg)', '1 g', '1 g', '1 g', 1, 0, 0, 0, 0, 0, 'curated', null),
  (null, 'suplementos', 'suplementos', 'Ashwagandha', 'Ashwagandha', 'Ashwagandha', '1 g', '1 g', '1 g', 1, 5, 0, 1, 0, 0, 'curated', null),
  (null, 'suplementos', 'suplementos', 'Zinc', 'Zinc', 'Zinc', '1 g', '1 g', '1 g', 1, 0, 0, 0, 0, 0, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Pechuga de pollo cocida', 'Pechuga de pollo cocida', 'Chicken breast, cooked', '120 g', '120 g', '120 g', 120, 165, 31, 0, 3.6, 0, 'curated', null),
  (null, 'proteina_media', 'proteina_media', 'Muslo de pollo cocido', 'Muslo de pollo cocido', 'Chicken thigh, cooked', '120 g', '120 g', '120 g', 120, 209, 26, 0, 11, 0, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Pavo molido cocido', 'Pavo molido cocido', 'Ground turkey, cooked', '120 g', '120 g', '120 g', 120, 170, 27, 0, 7, 0, 'curated', null),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Pechuga de pavo', 'Pechuga de pavo', 'Turkey breast', '120 g', '120 g', '120 g', 120, 135, 30, 0, 1, 0, 'curated', null),
  (null, 'proteina_media', 'proteina_media', 'Carne de res magra cocida', 'Carne de res magra cocida', 'Lean beef, cooked', '120 g', '120 g', '120 g', 120, 217, 26, 0, 12, 0, 'curated', null),
  (null, 'proteina_media', 'proteina_media', 'Bistec de res', 'Bistec de res', 'Beef steak', '150 g', '150 g', '150 g', 150, 271, 25, 0, 19, 0, 'curated', null),
  (null, 'proteina_media', 'proteina_media', 'Carne molida 90/10 cocida', 'Carne molida 90/10 cocida', 'Ground beef 90/10, cooked', '120 g', '120 g', '120 g', 120, 217, 26, 0, 12, 0, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Lomo de cerdo cocido', 'Lomo de cerdo cocido', 'Pork loin, cooked', '120 g', '120 g', '120 g', 120, 196, 27, 0, 9, 0, 'curated', null),
  (null, 'proteina_media', 'proteina_media', 'Chuleta de cerdo', 'Chuleta de cerdo', 'Pork chop', '150 g', '150 g', '150 g', 150, 231, 26, 0, 14, 0, 'curated', null),
  (null, 'proteina_alta', 'proteina_alta', 'Tocino cocido', 'Tocino cocido', 'Bacon, cooked', '30 g', '30 g', '30 g', 30, 541, 37, 1.4, 42, 0, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Jamón de pavo', 'Jamón de pavo', 'Turkey ham', '60 g', '60 g', '60 g', 60, 124, 17, 2, 5, 0, 'curated', null),
  (null, 'proteina_alta', 'proteina_alta', 'Jamón serrano', 'Jamón serrano', 'Serrano ham', '40 g', '40 g', '40 g', 40, 241, 31, 0.3, 13, 0, 'curated', null),
  (null, 'proteina_alta', 'proteina_alta', 'Cordero cocido', 'Cordero cocido', 'Lamb, cooked', '120 g', '120 g', '120 g', 120, 294, 25, 0, 21, 0, 'curated', null),
  (null, 'proteina_media', 'proteina_media', 'Huevo entero', 'Huevo entero', 'Whole egg', '50 g', '50 g', '50 g', 50, 143, 13, 1.1, 9.5, 0, 'curated', null),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Clara de huevo', 'Clara de huevo', 'Egg white', '66 g', '66 g', '66 g', 66, 52, 11, 0.7, 0.2, 0, 'curated', null),
  (null, 'proteina_media', 'proteina_media', 'Huevo cocido', 'Huevo cocido', 'Boiled egg', '50 g', '50 g', '50 g', 50, 155, 13, 1.1, 11, 0, 'curated', null),
  (null, 'proteina_media', 'proteina_media', 'Salmón cocido', 'Salmón cocido', 'Salmon, cooked', '120 g', '120 g', '120 g', 120, 206, 22, 0, 13, 0, 'curated', null),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Atún en agua', 'Atún en agua', 'Tuna in water', '100 g', '100 g', '100 g', 100, 116, 26, 0, 1, 0, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Atún fresco', 'Atún fresco', 'Fresh tuna', '120 g', '120 g', '120 g', 120, 144, 23, 0, 5, 0, 'curated', null),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Tilapia cocida', 'Tilapia cocida', 'Tilapia, cooked', '120 g', '120 g', '120 g', 120, 128, 26, 0, 2.7, 0, 'curated', null),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Bacalao cocido', 'Bacalao cocido', 'Cod, cooked', '120 g', '120 g', '120 g', 120, 105, 23, 0, 0.9, 0, 'curated', null),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Camarón cocido', 'Camarón cocido', 'Shrimp, cooked', '100 g', '100 g', '100 g', 100, 99, 24, 0.2, 0.3, 0, 'curated', null),
  (null, 'proteina_media', 'proteina_media', 'Sardinas en lata', 'Sardinas en lata', 'Canned sardines', '90 g', '90 g', '90 g', 90, 208, 25, 0, 11, 0, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Trucha cocida', 'Trucha cocida', 'Trout, cooked', '120 g', '120 g', '120 g', 120, 168, 24, 0, 7.2, 0, 'curated', null),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Pulpo cocido', 'Pulpo cocido', 'Octopus, cooked', '100 g', '100 g', '100 g', 100, 164, 30, 4.4, 2.1, 0, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Mejillones cocidos', 'Mejillones cocidos', 'Mussels, cooked', '100 g', '100 g', '100 g', 100, 172, 24, 7.4, 4.5, 0, 'curated', null),
  (null, 'lacteos_descremados', 'lacteos_descremados', 'Yogur griego natural', 'Yogur griego natural', 'Greek yogurt, plain', '170 g', '170 g', '170 g', 170, 59, 10, 3.6, 0.4, 0, 'curated', null),
  (null, 'lacteos_enteros', 'lacteos_enteros', 'Yogur natural entero', 'Yogur natural entero', 'Whole plain yogurt', '170 g', '170 g', '170 g', 170, 61, 3.5, 4.7, 3.3, 0, 'curated', null),
  (null, 'lacteos_descremados', 'lacteos_descremados', 'Queso cottage', 'Queso cottage', 'Cottage cheese', '110 g', '110 g', '110 g', 110, 98, 11, 3.4, 4.3, 0, 'curated', null),
  (null, 'lacteos_semi', 'lacteos_semi', 'Queso panela', 'Queso panela', 'Panela cheese', '40 g', '40 g', '40 g', 40, 215, 18, 3, 15, 0, 'curated', null),
  (null, 'lacteos_enteros', 'lacteos_enteros', 'Queso Oaxaca', 'Queso Oaxaca', 'Oaxaca cheese', '30 g', '30 g', '30 g', 30, 290, 20, 3, 22, 0, 'curated', null),
  (null, 'lacteos_enteros', 'lacteos_enteros', 'Queso manchego', 'Queso manchego', 'Manchego cheese', '30 g', '30 g', '30 g', 30, 363, 24, 2, 29, 0, 'curated', null),
  (null, 'lacteos_semi', 'lacteos_semi', 'Queso mozzarella', 'Queso mozzarella', 'Mozzarella cheese', '30 g', '30 g', '30 g', 30, 280, 28, 3.1, 17, 0, 'curated', null),
  (null, 'lacteos_enteros', 'lacteos_enteros', 'Queso cheddar', 'Queso cheddar', 'Cheddar cheese', '30 g', '30 g', '30 g', 30, 403, 25, 1.3, 33, 0, 'curated', null),
  (null, 'lacteos_enteros', 'lacteos_enteros', 'Queso parmesano', 'Queso parmesano', 'Parmesan cheese', '20 g', '20 g', '20 g', 20, 431, 38, 4.1, 29, 0, 'curated', null),
  (null, 'lacteos_semi', 'lacteos_semi', 'Requesón', 'Requesón', 'Ricotta cheese', '60 g', '60 g', '60 g', 60, 174, 11, 3, 13, 0, 'curated', null),
  (null, 'lacteos_enteros', 'lacteos_enteros', 'Leche evaporada', 'Leche evaporada', 'Evaporated milk', '60 g', '60 g', '60 g', 60, 135, 7, 10, 7.6, 0, 'curated', null),
  (null, 'lacteos_descremados', 'lacteos_descremados', 'Kéfir', 'Kéfir', 'Kefir', '240 g', '240 g', '240 g', 240, 41, 3.3, 4.5, 1, 0, 'curated', null),
  (null, 'cereales', 'cereales', 'Arroz blanco cocido', 'Arroz blanco cocido', 'White rice, cooked', '150 g', '150 g', '150 g', 150, 130, 2.7, 28, 0.3, 0.4, 'curated', null),
  (null, 'cereales', 'cereales', 'Arroz integral cocido', 'Arroz integral cocido', 'Brown rice, cooked', '150 g', '150 g', '150 g', 150, 123, 2.7, 26, 1, 1.6, 'curated', null),
  (null, 'cereales', 'cereales', 'Avena cocida', 'Avena cocida', 'Cooked oatmeal', '200 g', '200 g', '200 g', 200, 71, 2.5, 12, 1.5, 1.7, 'curated', null),
  (null, 'cereales', 'cereales', 'Avena en hojuelas seca', 'Avena en hojuelas seca', 'Rolled oats, dry', '40 g', '40 g', '40 g', 40, 379, 13, 67, 6.5, 10, 'curated', null),
  (null, 'cereales', 'cereales', 'Quinoa cocida', 'Quinoa cocida', 'Quinoa, cooked', '150 g', '150 g', '150 g', 150, 120, 4.4, 21, 1.9, 2.8, 'curated', null),
  (null, 'cereales', 'cereales', 'Pasta cocida', 'Pasta cocida', 'Pasta, cooked', '150 g', '150 g', '150 g', 150, 158, 5.8, 31, 0.9, 1.8, 'curated', null),
  (null, 'cereales', 'cereales', 'Pasta integral cocida', 'Pasta integral cocida', 'Whole wheat pasta, cooked', '150 g', '150 g', '150 g', 150, 149, 6, 30, 1.4, 4, 'curated', null),
  (null, 'cereales', 'cereales', 'Pan integral', 'Pan integral', 'Whole wheat bread', '30 g', '30 g', '30 g', 30, 247, 13, 41, 3.4, 7, 'curated', null),
  (null, 'cereales', 'cereales', 'Pan blanco', 'Pan blanco', 'White bread', '30 g', '30 g', '30 g', 30, 265, 9, 49, 3.2, 2.7, 'curated', null),
  (null, 'cereales', 'cereales', 'Tortilla de maíz', 'Tortilla de maíz', 'Corn tortilla', '30 g', '30 g', '30 g', 30, 218, 5.7, 45, 2.9, 6.3, 'curated', null),
  (null, 'cereales_grasa', 'cereales_grasa', 'Tortilla de harina', 'Tortilla de harina', 'Flour tortilla', '40 g', '40 g', '40 g', 40, 304, 8, 51, 7, 3, 'curated', null),
  (null, 'cereales', 'cereales', 'Papa cocida', 'Papa cocida', 'Potato, boiled', '150 g', '150 g', '150 g', 150, 87, 1.9, 20, 0.1, 1.8, 'curated', null),
  (null, 'cereales', 'cereales', 'Camote cocido', 'Camote cocido', 'Sweet potato, cooked', '150 g', '150 g', '150 g', 150, 90, 2, 21, 0.1, 3.3, 'curated', null),
  (null, 'cereales', 'cereales', 'Elote', 'Elote', 'Corn', '100 g', '100 g', '100 g', 100, 96, 3.4, 21, 1.5, 2.4, 'curated', null),
  (null, 'cereales', 'cereales', 'Cuscús cocido', 'Cuscús cocido', 'Couscous, cooked', '150 g', '150 g', '150 g', 150, 112, 3.8, 23, 0.2, 1.4, 'curated', null),
  (null, 'cereales', 'cereales', 'Cebada cocida', 'Cebada cocida', 'Barley, cooked', '150 g', '150 g', '150 g', 150, 123, 2.3, 28, 0.4, 3.8, 'curated', null),
  (null, 'cereales', 'cereales', 'Pan pita', 'Pan pita', 'Pita bread', '60 g', '60 g', '60 g', 60, 275, 9, 55, 1.2, 2.2, 'curated', null),
  (null, 'cereales', 'cereales', 'Bagel', 'Bagel', 'Bagel', '90 g', '90 g', '90 g', 90, 257, 10, 50, 1.5, 2.1, 'curated', null),
  (null, 'cereales_grasa', 'cereales_grasa', 'Granola', 'Granola', 'Granola', '50 g', '50 g', '50 g', 50, 471, 10, 64, 20, 7, 'curated', null),
  (null, 'cereales', 'cereales', 'Cereal integral', 'Cereal integral', 'Whole grain cereal', '40 g', '40 g', '40 g', 40, 367, 10, 80, 3, 10, 'curated', null),
  (null, 'cereales', 'cereales', 'Tostada horneada', 'Tostada horneada', 'Baked tostada', '20 g', '20 g', '20 g', 20, 434, 7, 70, 14, 6, 'curated', null),
  (null, 'cereales', 'cereales', 'Arroz salvaje cocido', 'Arroz salvaje cocido', 'Wild rice, cooked', '150 g', '150 g', '150 g', 150, 101, 4, 21, 0.3, 1.8, 'curated', null),
  (null, 'leguminosas', 'leguminosas', 'Frijoles negros cocidos', 'Frijoles negros cocidos', 'Black beans, cooked', '130 g', '130 g', '130 g', 130, 132, 8.9, 24, 0.5, 8.7, 'curated', null),
  (null, 'leguminosas', 'leguminosas', 'Frijoles pintos cocidos', 'Frijoles pintos cocidos', 'Pinto beans, cooked', '130 g', '130 g', '130 g', 130, 143, 9, 26, 0.7, 9, 'curated', null),
  (null, 'leguminosas', 'leguminosas', 'Lentejas cocidas', 'Lentejas cocidas', 'Lentils, cooked', '130 g', '130 g', '130 g', 130, 116, 9, 20, 0.4, 7.9, 'curated', null),
  (null, 'leguminosas', 'leguminosas', 'Garbanzos cocidos', 'Garbanzos cocidos', 'Chickpeas, cooked', '130 g', '130 g', '130 g', 130, 164, 8.9, 27, 2.6, 7.6, 'curated', null),
  (null, 'leguminosas', 'leguminosas', 'Habas cocidas', 'Habas cocidas', 'Fava beans, cooked', '130 g', '130 g', '130 g', 130, 110, 7.6, 19, 0.4, 5.4, 'curated', null),
  (null, 'leguminosas', 'leguminosas', 'Edamame', 'Edamame', 'Edamame', '100 g', '100 g', '100 g', 100, 121, 12, 9, 5, 5, 'curated', null),
  (null, 'leguminosas', 'leguminosas', 'Hummus', 'Hummus', 'Hummus', '60 g', '60 g', '60 g', 60, 166, 8, 14, 10, 6, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Tofu firme', 'Tofu firme', 'Firm tofu', '120 g', '120 g', '120 g', 120, 144, 17, 3, 9, 2, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Tempeh', 'Tempeh', 'Tempeh', '100 g', '100 g', '100 g', 100, 192, 20, 8, 11, 0, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Soya texturizada', 'Soya texturizada', 'Textured soy protein', '30 g', '30 g', '30 g', 30, 333, 52, 30, 1.2, 18, 'curated', null),
  (null, 'verduras', 'verduras', 'Brócoli', 'Brócoli', 'Broccoli', '100 g', '100 g', '100 g', 100, 34, 2.8, 7, 0.4, 2.6, 'curated', null),
  (null, 'verduras', 'verduras', 'Espinaca', 'Espinaca', 'Spinach', '100 g', '100 g', '100 g', 100, 23, 2.9, 3.6, 0.4, 2.2, 'curated', null),
  (null, 'verduras', 'verduras', 'Zanahoria', 'Zanahoria', 'Carrot', '100 g', '100 g', '100 g', 100, 41, 0.9, 10, 0.2, 2.8, 'curated', null),
  (null, 'verduras', 'verduras', 'Calabacita', 'Calabacita', 'Zucchini', '100 g', '100 g', '100 g', 100, 17, 1.2, 3.1, 0.3, 1, 'curated', null),
  (null, 'verduras', 'verduras', 'Jitomate', 'Jitomate', 'Tomato', '100 g', '100 g', '100 g', 100, 18, 0.9, 3.9, 0.2, 1.2, 'curated', null),
  (null, 'verduras', 'verduras', 'Pepino', 'Pepino', 'Cucumber', '100 g', '100 g', '100 g', 100, 15, 0.7, 3.6, 0.1, 0.5, 'curated', null),
  (null, 'verduras', 'verduras', 'Lechuga romana', 'Lechuga romana', 'Romaine lettuce', '80 g', '80 g', '80 g', 80, 17, 1.2, 3.3, 0.3, 2.1, 'curated', null),
  (null, 'verduras', 'verduras', 'Pimiento rojo', 'Pimiento rojo', 'Red bell pepper', '100 g', '100 g', '100 g', 100, 31, 1, 6, 0.3, 2.1, 'curated', null),
  (null, 'verduras', 'verduras', 'Champiñones', 'Champiñones', 'Mushrooms', '100 g', '100 g', '100 g', 100, 22, 3.1, 3.3, 0.3, 1, 'curated', null),
  (null, 'verduras', 'verduras', 'Coliflor', 'Coliflor', 'Cauliflower', '100 g', '100 g', '100 g', 100, 25, 1.9, 5, 0.3, 2, 'curated', null),
  (null, 'verduras', 'verduras', 'Col rizada', 'Col rizada', 'Kale', '80 g', '80 g', '80 g', 80, 49, 4.3, 9, 0.9, 3.6, 'curated', null),
  (null, 'verduras', 'verduras', 'Ejotes', 'Ejotes', 'Green beans', '100 g', '100 g', '100 g', 100, 31, 1.8, 7, 0.2, 2.7, 'curated', null),
  (null, 'verduras', 'verduras', 'Berenjena', 'Berenjena', 'Eggplant', '100 g', '100 g', '100 g', 100, 25, 1, 6, 0.2, 3, 'curated', null),
  (null, 'verduras', 'verduras', 'Apio', 'Apio', 'Celery', '100 g', '100 g', '100 g', 100, 16, 0.7, 3, 0.2, 1.6, 'curated', null),
  (null, 'verduras', 'verduras', 'Cebolla', 'Cebolla', 'Onion', '100 g', '100 g', '100 g', 100, 40, 1.1, 9, 0.1, 1.7, 'curated', null),
  (null, 'verduras', 'verduras', 'Espárragos', 'Espárragos', 'Asparagus', '100 g', '100 g', '100 g', 100, 20, 2.2, 3.9, 0.1, 2.1, 'curated', null),
  (null, 'verduras', 'verduras', 'Betabel', 'Betabel', 'Beetroot', '100 g', '100 g', '100 g', 100, 43, 1.6, 10, 0.2, 2.8, 'curated', null),
  (null, 'verduras', 'verduras', 'Col', 'Col', 'Cabbage', '100 g', '100 g', '100 g', 100, 25, 1.3, 6, 0.1, 2.5, 'curated', null),
  (null, 'verduras', 'verduras', 'Calabaza', 'Calabaza', 'Pumpkin', '100 g', '100 g', '100 g', 100, 26, 1, 7, 0.1, 0.5, 'curated', null),
  (null, 'verduras', 'verduras', 'Nopal', 'Nopal', 'Nopal cactus', '100 g', '100 g', '100 g', 100, 16, 1.3, 3.3, 0.1, 2.2, 'curated', null),
  (null, 'verduras', 'verduras', 'Chile poblano', 'Chile poblano', 'Poblano pepper', '80 g', '80 g', '80 g', 80, 20, 0.9, 4.6, 0.2, 1.5, 'curated', null),
  (null, 'verduras', 'verduras', 'Acelga', 'Acelga', 'Swiss chard', '80 g', '80 g', '80 g', 80, 19, 1.8, 3.7, 0.2, 1.6, 'curated', null),
  (null, 'verduras', 'verduras', 'Pimiento verde', 'Pimiento verde', 'Green bell pepper', '100 g', '100 g', '100 g', 100, 20, 0.9, 4.6, 0.2, 1.7, 'curated', null),
  (null, 'verduras', 'verduras', 'Rábano', 'Rábano', 'Radish', '100 g', '100 g', '100 g', 100, 16, 0.7, 3.4, 0.1, 1.6, 'curated', null),
  (null, 'frutas', 'frutas', 'Plátano', 'Plátano', 'Banana', '120 g', '120 g', '120 g', 120, 89, 1.1, 23, 0.3, 2.6, 'curated', null),
  (null, 'frutas', 'frutas', 'Manzana', 'Manzana', 'Apple', '150 g', '150 g', '150 g', 150, 52, 0.3, 14, 0.2, 2.4, 'curated', null),
  (null, 'frutas', 'frutas', 'Naranja', 'Naranja', 'Orange', '130 g', '130 g', '130 g', 130, 47, 0.9, 12, 0.1, 2.4, 'curated', null),
  (null, 'frutas', 'frutas', 'Fresa', 'Fresa', 'Strawberry', '150 g', '150 g', '150 g', 150, 32, 0.7, 7.7, 0.3, 2, 'curated', null),
  (null, 'frutas', 'frutas', 'Arándanos', 'Arándanos', 'Blueberries', '100 g', '100 g', '100 g', 100, 57, 0.7, 14, 0.3, 2.4, 'curated', null),
  (null, 'frutas', 'frutas', 'Uvas', 'Uvas', 'Grapes', '100 g', '100 g', '100 g', 100, 69, 0.7, 18, 0.2, 0.9, 'curated', null),
  (null, 'frutas', 'frutas', 'Mango', 'Mango', 'Mango', '150 g', '150 g', '150 g', 150, 60, 0.8, 15, 0.4, 1.6, 'curated', null),
  (null, 'frutas', 'frutas', 'Piña', 'Piña', 'Pineapple', '150 g', '150 g', '150 g', 150, 50, 0.5, 13, 0.1, 1.4, 'curated', null),
  (null, 'frutas', 'frutas', 'Sandía', 'Sandía', 'Watermelon', '200 g', '200 g', '200 g', 200, 30, 0.6, 8, 0.2, 0.4, 'curated', null),
  (null, 'frutas', 'frutas', 'Melón', 'Melón', 'Cantaloupe', '150 g', '150 g', '150 g', 150, 34, 0.8, 8, 0.2, 0.9, 'curated', null),
  (null, 'frutas', 'frutas', 'Papaya', 'Papaya', 'Papaya', '150 g', '150 g', '150 g', 150, 43, 0.5, 11, 0.3, 1.7, 'curated', null),
  (null, 'frutas', 'frutas', 'Pera', 'Pera', 'Pear', '150 g', '150 g', '150 g', 150, 57, 0.4, 15, 0.1, 3.1, 'curated', null),
  (null, 'frutas', 'frutas', 'Durazno', 'Durazno', 'Peach', '150 g', '150 g', '150 g', 150, 39, 0.9, 10, 0.3, 1.5, 'curated', null),
  (null, 'frutas', 'frutas', 'Kiwi', 'Kiwi', 'Kiwi', '100 g', '100 g', '100 g', 100, 61, 1.1, 15, 0.5, 3, 'curated', null),
  (null, 'frutas', 'frutas', 'Toronja', 'Toronja', 'Grapefruit', '150 g', '150 g', '150 g', 150, 42, 0.8, 11, 0.1, 1.6, 'curated', null),
  (null, 'frutas', 'frutas', 'Mandarina', 'Mandarina', 'Tangerine', '100 g', '100 g', '100 g', 100, 53, 0.8, 13, 0.3, 1.8, 'curated', null),
  (null, 'frutas', 'frutas', 'Ciruela', 'Ciruela', 'Plum', '100 g', '100 g', '100 g', 100, 46, 0.7, 11, 0.3, 1.4, 'curated', null),
  (null, 'frutas', 'frutas', 'Cereza', 'Cereza', 'Cherry', '100 g', '100 g', '100 g', 100, 63, 1.1, 16, 0.2, 2.1, 'curated', null),
  (null, 'frutas', 'frutas', 'Frambuesa', 'Frambuesa', 'Raspberry', '100 g', '100 g', '100 g', 100, 52, 1.2, 12, 0.7, 6.5, 'curated', null),
  (null, 'frutas', 'frutas', 'Granada', 'Granada', 'Pomegranate', '100 g', '100 g', '100 g', 100, 83, 1.7, 19, 1.2, 4, 'curated', null),
  (null, 'frutas', 'frutas', 'Higo', 'Higo', 'Fig', '100 g', '100 g', '100 g', 100, 74, 0.8, 19, 0.3, 2.9, 'curated', null),
  (null, 'frutas', 'frutas', 'Dátil', 'Dátil', 'Date', '30 g', '30 g', '30 g', 30, 277, 1.8, 75, 0.2, 6.7, 'curated', null),
  (null, 'frutas', 'frutas', 'Pasas', 'Pasas', 'Raisins', '40 g', '40 g', '40 g', 40, 299, 3.1, 79, 0.5, 3.7, 'curated', null),
  (null, 'grasas_saturadas', 'grasas_saturadas', 'Coco rallado', 'Coco rallado', 'Shredded coconut', '30 g', '30 g', '30 g', 30, 354, 3.3, 15, 33, 9, 'curated', null),
  (null, 'grasas_mono', 'grasas_mono', 'Aguacate', 'Aguacate', 'Avocado', '50 g', '50 g', '50 g', 50, 160, 2, 9, 15, 7, 'curated', null),
  (null, 'grasas_mono', 'grasas_mono', 'Aceite de oliva', 'Aceite de oliva', 'Olive oil', '10 g', '10 g', '10 g', 10, 884, 0, 0, 100, 0, 'curated', null),
  (null, 'grasas_saturadas', 'grasas_saturadas', 'Aceite de coco', 'Aceite de coco', 'Coconut oil', '10 g', '10 g', '10 g', 10, 862, 0, 0, 100, 0, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Almendras', 'Almendras', 'Almonds', '28 g', '28 g', '28 g', 28, 579, 21, 22, 50, 12, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Nuez', 'Nuez', 'Walnuts', '28 g', '28 g', '28 g', 28, 654, 15, 14, 65, 6.7, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Cacahuate', 'Cacahuate', 'Peanuts', '28 g', '28 g', '28 g', 28, 567, 26, 16, 49, 8.5, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Pistaches', 'Pistaches', 'Pistachios', '28 g', '28 g', '28 g', 28, 560, 20, 28, 45, 10, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Nuez de la India', 'Nuez de la India', 'Cashews', '28 g', '28 g', '28 g', 28, 553, 18, 30, 44, 3.3, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Mantequilla de maní', 'Mantequilla de maní', 'Peanut butter', '32 g', '32 g', '32 g', 32, 588, 25, 20, 50, 6, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Mantequilla de almendra', 'Mantequilla de almendra', 'Almond butter', '32 g', '32 g', '32 g', 32, 614, 21, 19, 56, 10, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Semillas de chía', 'Semillas de chía', 'Chia seeds', '15 g', '15 g', '15 g', 15, 486, 17, 42, 31, 34, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Semillas de linaza', 'Semillas de linaza', 'Flax seeds', '15 g', '15 g', '15 g', 15, 534, 18, 29, 42, 27, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Semillas de girasol', 'Semillas de girasol', 'Sunflower seeds', '28 g', '28 g', '28 g', 28, 584, 21, 20, 51, 8.6, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Semillas de calabaza', 'Semillas de calabaza', 'Pumpkin seeds', '28 g', '28 g', '28 g', 28, 559, 30, 11, 49, 6, 'curated', null),
  (null, 'grasas_mono', 'grasas_mono', 'Aceitunas', 'Aceitunas', 'Olives', '30 g', '30 g', '30 g', 30, 115, 0.8, 6, 11, 3.2, 'curated', null),
  (null, 'grasas_saturadas', 'grasas_saturadas', 'Mantequilla', 'Mantequilla', 'Butter', '10 g', '10 g', '10 g', 10, 717, 0.9, 0.1, 81, 0, 'curated', null),
  (null, 'grasas_saturadas', 'grasas_saturadas', 'Crema', 'Crema', 'Cream', '30 g', '30 g', '30 g', 30, 340, 2.8, 3.4, 36, 0, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Tahini', 'Tahini', 'Tahini', '30 g', '30 g', '30 g', 30, 595, 17, 21, 54, 9.3, 'curated', null),
  (null, 'grasas_mono', 'grasas_mono', 'Aceite de aguacate', 'Aceite de aguacate', 'Avocado oil', '10 g', '10 g', '10 g', 10, 884, 0, 0, 100, 0, 'curated', null),
  (null, 'grasas_mono', 'grasas_mono', 'Aceite de canola', 'Aceite de canola', 'Canola oil', '10 g', '10 g', '10 g', 10, 884, 0, 0, 100, 0, 'curated', null),
  (null, 'azucares', 'azucares', 'Miel', 'Miel', 'Honey', '20 g', '20 g', '20 g', 20, 304, 0.3, 82, 0, 0.2, 'curated', null),
  (null, 'azucares', 'azucares', 'Mermelada', 'Mermelada', 'Jam', '20 g', '20 g', '20 g', 20, 278, 0.4, 69, 0.1, 1.1, 'curated', null),
  (null, 'azucares', 'azucares', 'Azúcar', 'Azúcar', 'Sugar', '10 g', '10 g', '10 g', 10, 387, 0, 100, 0, 0, 'curated', null),
  (null, 'azucares', 'azucares', 'Jarabe de maple', 'Jarabe de maple', 'Maple syrup', '20 g', '20 g', '20 g', 20, 260, 0, 67, 0.1, 0, 'curated', null),
  (null, 'grasas_saturadas', 'grasas_saturadas', 'Chocolate oscuro', 'Chocolate oscuro', 'Dark chocolate', '30 g', '30 g', '30 g', 30, 546, 4.9, 61, 31, 7, 'curated', null),
  (null, 'azucares', 'azucares', 'Mermelada sin azúcar', 'Mermelada sin azúcar', 'Sugar-free jam', '20 g', '20 g', '20 g', 20, 130, 0.3, 33, 0.1, 1, 'curated', null),
  (null, 'snacks', 'snacks', 'Palomitas naturales', 'Palomitas naturales', 'Plain popcorn', '25 g', '25 g', '25 g', 25, 387, 13, 78, 4.5, 15, 'curated', null),
  (null, 'snacks', 'snacks', 'Barra de proteína', 'Barra de proteína', 'Protein bar', '60 g', '60 g', '60 g', 60, 350, 30, 35, 10, 5, 'curated', null),
  (null, 'snacks', 'snacks', 'Barra de granola', 'Barra de granola', 'Granola bar', '40 g', '40 g', '40 g', 40, 471, 8, 64, 20, 5, 'curated', null),
  (null, 'snacks', 'snacks', 'Galletas de avena', 'Galletas de avena', 'Oatmeal cookies', '30 g', '30 g', '30 g', 30, 450, 6, 68, 18, 3, 'curated', null),
  (null, 'snacks', 'snacks', 'Papas fritas', 'Papas fritas', 'Potato chips', '30 g', '30 g', '30 g', 30, 536, 7, 53, 35, 4.8, 'curated', null),
  (null, 'snacks', 'snacks', 'Pretzels', 'Pretzels', 'Pretzels', '30 g', '30 g', '30 g', 30, 380, 10, 80, 3, 3, 'curated', null),
  (null, 'snacks', 'snacks', 'Galletas saladas', 'Galletas saladas', 'Crackers', '30 g', '30 g', '30 g', 30, 502, 9, 61, 25, 2.5, 'curated', null),
  (null, 'snacks', 'snacks', 'Chocolate con leche', 'Chocolate con leche', 'Milk chocolate', '30 g', '30 g', '30 g', 30, 535, 7.6, 59, 30, 3.4, 'curated', null),
  (null, 'snacks', 'snacks', 'Gomitas', 'Gomitas', 'Gummy candy', '30 g', '30 g', '30 g', 30, 396, 0, 99, 0, 0, 'curated', null),
  (null, 'snacks', 'snacks', 'Cacahuates japoneses', 'Cacahuates japoneses', 'Japanese peanuts', '30 g', '30 g', '30 g', 30, 520, 19, 38, 33, 5, 'curated', null),
  (null, 'snacks', 'snacks', 'Yogur helado', 'Yogur helado', 'Frozen yogurt', '100 g', '100 g', '100 g', 100, 159, 4, 24, 4, 0, 'curated', null),
  (null, 'snacks', 'snacks', 'Helado de vainilla', 'Helado de vainilla', 'Vanilla ice cream', '100 g', '100 g', '100 g', 100, 207, 3.5, 24, 11, 0.7, 'curated', null),
  (null, 'proteina_media', 'proteina_media', 'Pollo entero asado', 'Pollo entero asado', 'Roasted whole chicken', '120 g', '120 g', '120 g', 120, 239, 27, 0, 14, 0, 'curated', null),
  (null, 'proteina_media', 'proteina_media', 'Ala de pollo', 'Ala de pollo', 'Chicken wing', '100 g', '100 g', '100 g', 100, 203, 30, 0, 8.1, 0, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Hígado de pollo', 'Hígado de pollo', 'Chicken liver', '100 g', '100 g', '100 g', 100, 167, 25, 0.9, 6.5, 0, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Pollo desmenuzado', 'Pollo desmenuzado', 'Shredded chicken', '120 g', '120 g', '120 g', 120, 165, 31, 0, 3.6, 0, 'curated', null),
  (null, 'proteina_media', 'proteina_media', 'Codorniz', 'Codorniz', 'Quail', '120 g', '120 g', '120 g', 120, 227, 25, 0, 14, 0, 'curated', null),
  (null, 'proteina_alta', 'proteina_alta', 'Pato cocido', 'Pato cocido', 'Duck, cooked', '120 g', '120 g', '120 g', 120, 337, 19, 0, 28, 0, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Conejo cocido', 'Conejo cocido', 'Rabbit, cooked', '120 g', '120 g', '120 g', 120, 173, 33, 0, 3.5, 0, 'curated', null),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Venado cocido', 'Venado cocido', 'Venison, cooked', '120 g', '120 g', '120 g', 120, 158, 30, 0, 3.2, 0, 'curated', null),
  (null, 'proteina_alta', 'proteina_alta', 'Costilla de res', 'Costilla de res', 'Beef rib', '150 g', '150 g', '150 g', 150, 304, 22, 0, 24, 0, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Falda de res', 'Falda de res', 'Flank steak', '150 g', '150 g', '150 g', 150, 192, 28, 0, 8, 0, 'curated', null),
  (null, 'proteina_media', 'proteina_media', 'Arrachera', 'Arrachera', 'Skirt steak', '150 g', '150 g', '150 g', 150, 224, 27, 0, 12, 0, 'curated', null),
  (null, 'proteina_alta', 'proteina_alta', 'Lengua de res', 'Lengua de res', 'Beef tongue', '100 g', '100 g', '100 g', 100, 284, 22, 0, 21, 0, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Hígado de res', 'Hígado de res', 'Beef liver', '100 g', '100 g', '100 g', 100, 175, 27, 3.9, 4.9, 0, 'curated', null),
  (null, 'proteina_alta', 'proteina_alta', 'Costilla de cerdo', 'Costilla de cerdo', 'Pork ribs', '150 g', '150 g', '150 g', 150, 277, 25, 0, 19, 0, 'curated', null),
  (null, 'proteina_media', 'proteina_media', 'Carnitas', 'Carnitas', 'Carnitas', '120 g', '120 g', '120 g', 120, 245, 24, 0, 16, 0, 'curated', null),
  (null, 'proteina_alta', 'proteina_alta', 'Chorizo', 'Chorizo', 'Chorizo', '60 g', '60 g', '60 g', 60, 455, 24, 1.9, 38, 0, 'curated', null),
  (null, 'proteina_alta', 'proteina_alta', 'Salchicha', 'Salchicha', 'Sausage', '60 g', '60 g', '60 g', 60, 301, 12, 2, 27, 0, 'curated', null),
  (null, 'proteina_alta', 'proteina_alta', 'Salami', 'Salami', 'Salami', '30 g', '30 g', '30 g', 30, 336, 22, 2.4, 26, 0, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Jamón de cerdo', 'Jamón de cerdo', 'Pork ham', '60 g', '60 g', '60 g', 60, 145, 21, 1.5, 6, 0, 'curated', null),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Pavo en rebanadas', 'Pavo en rebanadas', 'Sliced turkey deli', '60 g', '60 g', '60 g', 60, 104, 17, 4, 2, 0, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Salmón ahumado', 'Salmón ahumado', 'Smoked salmon', '100 g', '100 g', '100 g', 100, 117, 18, 0, 4.3, 0, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Atún en aceite', 'Atún en aceite', 'Tuna in oil', '100 g', '100 g', '100 g', 100, 198, 29, 0, 8, 0, 'curated', null),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Mero cocido', 'Mero cocido', 'Grouper, cooked', '120 g', '120 g', '120 g', 120, 118, 25, 0, 1.3, 0, 'curated', null),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Huachinango', 'Huachinango', 'Red snapper', '120 g', '120 g', '120 g', 120, 128, 26, 0, 1.7, 0, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Robalo cocido', 'Robalo cocido', 'Sea bass, cooked', '120 g', '120 g', '120 g', 120, 124, 23, 0, 2.6, 0, 'curated', null),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Lenguado cocido', 'Lenguado cocido', 'Sole, cooked', '120 g', '120 g', '120 g', 120, 117, 24, 0, 1.5, 0, 'curated', null),
  (null, 'proteina_media', 'proteina_media', 'Caballa', 'Caballa', 'Mackerel', '120 g', '120 g', '120 g', 120, 262, 24, 0, 18, 0, 'curated', null),
  (null, 'proteina_media', 'proteina_media', 'Arenque', 'Arenque', 'Herring', '120 g', '120 g', '120 g', 120, 203, 23, 0, 12, 0, 'curated', null),
  (null, 'proteina_media', 'proteina_media', 'Anchoas', 'Anchoas', 'Anchovies', '50 g', '50 g', '50 g', 50, 210, 29, 0, 10, 0, 'curated', null),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Cangrejo cocido', 'Cangrejo cocido', 'Crab, cooked', '100 g', '100 g', '100 g', 100, 97, 19, 0, 1.5, 0, 'curated', null),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Langosta cocida', 'Langosta cocida', 'Lobster, cooked', '100 g', '100 g', '100 g', 100, 89, 19, 0, 0.9, 0, 'curated', null),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Almejas cocidas', 'Almejas cocidas', 'Clams, cooked', '100 g', '100 g', '100 g', 100, 148, 26, 5.1, 1.9, 0, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Ostras', 'Ostras', 'Oysters', '100 g', '100 g', '100 g', 100, 81, 9.5, 4.7, 2.3, 0, 'curated', null),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Vieiras', 'Vieiras', 'Scallops', '100 g', '100 g', '100 g', 100, 111, 21, 5.4, 0.8, 0, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Calamar', 'Calamar', 'Squid', '100 g', '100 g', '100 g', 100, 175, 18, 7.8, 7.5, 0, 'curated', null),
  (null, 'proteina_muy_baja', 'proteina_muy_baja', 'Surimi', 'Surimi', 'Surimi', '100 g', '100 g', '100 g', 100, 99, 15, 6.8, 0.9, 0, 'curated', null),
  (null, 'lacteos_semi', 'lacteos_semi', 'Leche semidescremada', 'Leche semidescremada', '2% milk', '250 g', '250 g', '250 g', 250, 50, 3.4, 4.8, 2, 0, 'curated', null),
  (null, 'lacteos_descremados', 'lacteos_descremados', 'Yogur griego de fresa', 'Yogur griego de fresa', 'Strawberry Greek yogurt', '170 g', '170 g', '170 g', 170, 97, 8, 13, 2, 0, 'curated', null),
  (null, 'lacteos_semi', 'lacteos_semi', 'Yogur bebible', 'Yogur bebible', 'Drinkable yogurt', '200 g', '200 g', '200 g', 200, 71, 3, 12, 1.5, 0, 'curated', null),
  (null, 'lacteos_semi', 'lacteos_semi', 'Queso fresco', 'Queso fresco', 'Fresh cheese', '40 g', '40 g', '40 g', 40, 145, 12, 4, 9, 0, 'curated', null),
  (null, 'lacteos_enteros', 'lacteos_enteros', 'Queso crema', 'Queso crema', 'Cream cheese', '30 g', '30 g', '30 g', 30, 342, 6, 4.1, 34, 0, 'curated', null),
  (null, 'lacteos_enteros', 'lacteos_enteros', 'Queso de cabra', 'Queso de cabra', 'Goat cheese', '30 g', '30 g', '30 g', 30, 364, 22, 2.5, 30, 0, 'curated', null),
  (null, 'lacteos_semi', 'lacteos_semi', 'Queso feta', 'Queso feta', 'Feta cheese', '30 g', '30 g', '30 g', 30, 264, 14, 4.1, 21, 0, 'curated', null),
  (null, 'lacteos_enteros', 'lacteos_enteros', 'Queso azul', 'Queso azul', 'Blue cheese', '30 g', '30 g', '30 g', 30, 353, 21, 2.3, 29, 0, 'curated', null),
  (null, 'lacteos_enteros', 'lacteos_enteros', 'Queso gouda', 'Queso gouda', 'Gouda cheese', '30 g', '30 g', '30 g', 30, 356, 25, 2.2, 27, 0, 'curated', null),
  (null, 'lacteos_enteros', 'lacteos_enteros', 'Queso suizo', 'Queso suizo', 'Swiss cheese', '30 g', '30 g', '30 g', 30, 380, 27, 5.4, 28, 0, 'curated', null),
  (null, 'grasas_saturadas', 'grasas_saturadas', 'Mantequilla clarificada', 'Mantequilla clarificada', 'Ghee', '10 g', '10 g', '10 g', 10, 876, 0.3, 0, 99, 0, 'curated', null),
  (null, 'lacteos_enteros', 'lacteos_enteros', 'Media crema', 'Media crema', 'Half and half', '30 g', '30 g', '30 g', 30, 131, 3, 4.3, 12, 0, 'curated', null),
  (null, 'cereales', 'cereales', 'Arroz jazmín cocido', 'Arroz jazmín cocido', 'Jasmine rice, cooked', '150 g', '150 g', '150 g', 150, 129, 2.7, 28, 0.3, 0.3, 'curated', null),
  (null, 'cereales', 'cereales', 'Arroz basmati cocido', 'Arroz basmati cocido', 'Basmati rice, cooked', '150 g', '150 g', '150 g', 150, 121, 3, 25, 0.4, 0.7, 'curated', null),
  (null, 'cereales', 'cereales', 'Fideos de arroz', 'Fideos de arroz', 'Rice noodles', '150 g', '150 g', '150 g', 150, 109, 0.9, 25, 0.2, 1, 'curated', null),
  (null, 'cereales', 'cereales', 'Espagueti integral', 'Espagueti integral', 'Whole wheat spaghetti', '150 g', '150 g', '150 g', 150, 149, 6, 30, 1.4, 4, 'curated', null),
  (null, 'cereales', 'cereales', 'Macarrones cocidos', 'Macarrones cocidos', 'Macaroni, cooked', '150 g', '150 g', '150 g', 150, 158, 5.8, 31, 0.9, 1.8, 'curated', null),
  (null, 'cereales', 'cereales', 'Polenta cocida', 'Polenta cocida', 'Polenta, cooked', '150 g', '150 g', '150 g', 150, 85, 2, 18, 0.4, 1, 'curated', null),
  (null, 'cereales', 'cereales', 'Trigo sarraceno cocido', 'Trigo sarraceno cocido', 'Buckwheat, cooked', '150 g', '150 g', '150 g', 150, 92, 3.4, 20, 0.6, 2.7, 'curated', null),
  (null, 'cereales', 'cereales', 'Mijo cocido', 'Mijo cocido', 'Millet, cooked', '150 g', '150 g', '150 g', 150, 119, 3.5, 23, 1, 1.3, 'curated', null),
  (null, 'cereales', 'cereales', 'Amaranto cocido', 'Amaranto cocido', 'Amaranth, cooked', '150 g', '150 g', '150 g', 150, 102, 3.8, 19, 1.6, 2.1, 'curated', null),
  (null, 'cereales', 'cereales', 'Pan de centeno', 'Pan de centeno', 'Rye bread', '30 g', '30 g', '30 g', 30, 259, 8.5, 48, 3.3, 5.8, 'curated', null),
  (null, 'cereales', 'cereales', 'Pan multigrano', 'Pan multigrano', 'Multigrain bread', '30 g', '30 g', '30 g', 30, 265, 13, 43, 4.2, 7, 'curated', null),
  (null, 'cereales', 'cereales', 'Pan de masa madre', 'Pan de masa madre', 'Sourdough bread', '40 g', '40 g', '40 g', 40, 289, 12, 56, 1.8, 2.4, 'curated', null),
  (null, 'cereales_grasa', 'cereales_grasa', 'Croissant', 'Croissant', 'Croissant', '60 g', '60 g', '60 g', 60, 406, 8.2, 46, 21, 2.6, 'curated', null),
  (null, 'cereales', 'cereales', 'Hot cake', 'Hot cake', 'Pancake', '80 g', '80 g', '80 g', 80, 227, 6.4, 28, 9.7, 1, 'curated', null),
  (null, 'cereales_grasa', 'cereales_grasa', 'Waffle', 'Waffle', 'Waffle', '75 g', '75 g', '75 g', 75, 291, 7.9, 33, 14, 1.5, 'curated', null),
  (null, 'cereales', 'cereales', 'Pan tostado', 'Pan tostado', 'Toast', '25 g', '25 g', '25 g', 25, 313, 10, 56, 5, 4, 'curated', null),
  (null, 'cereales', 'cereales', 'Galleta de arroz', 'Galleta de arroz', 'Rice cake', '10 g', '10 g', '10 g', 10, 387, 8, 82, 2.8, 4, 'curated', null),
  (null, 'cereales', 'cereales', 'Yuca cocida', 'Yuca cocida', 'Cassava, cooked', '150 g', '150 g', '150 g', 150, 160, 1.4, 38, 0.3, 1.8, 'curated', null),
  (null, 'cereales', 'cereales', 'Plátano macho', 'Plátano macho', 'Plantain', '150 g', '150 g', '150 g', 150, 122, 1.3, 32, 0.4, 2.3, 'curated', null),
  (null, 'cereales', 'cereales', 'Ñame cocido', 'Ñame cocido', 'Yam, cooked', '150 g', '150 g', '150 g', 150, 116, 1.5, 27, 0.1, 3.9, 'curated', null),
  (null, 'cereales', 'cereales', 'Papa horneada', 'Papa horneada', 'Baked potato', '150 g', '150 g', '150 g', 150, 93, 2.5, 21, 0.1, 2.2, 'curated', null),
  (null, 'cereales_grasa', 'cereales_grasa', 'Puré de papa', 'Puré de papa', 'Mashed potato', '150 g', '150 g', '150 g', 150, 113, 2, 17, 4.2, 1.5, 'curated', null),
  (null, 'cereales', 'cereales', 'Tortilla integral', 'Tortilla integral', 'Whole wheat tortilla', '40 g', '40 g', '40 g', 40, 290, 9, 47, 7, 6, 'curated', null),
  (null, 'leguminosas', 'leguminosas', 'Frijoles refritos', 'Frijoles refritos', 'Refried beans', '130 g', '130 g', '130 g', 130, 130, 7, 18, 3, 6, 'curated', null),
  (null, 'leguminosas', 'leguminosas', 'Alubias blancas', 'Alubias blancas', 'White beans, cooked', '130 g', '130 g', '130 g', 130, 139, 9.7, 25, 0.4, 6.3, 'curated', null),
  (null, 'leguminosas', 'leguminosas', 'Frijol rojo cocido', 'Frijol rojo cocido', 'Red kidney beans, cooked', '130 g', '130 g', '130 g', 130, 127, 8.7, 23, 0.5, 6.4, 'curated', null),
  (null, 'leguminosas', 'leguminosas', 'Chícharos cocidos', 'Chícharos cocidos', 'Green peas, cooked', '100 g', '100 g', '100 g', 100, 84, 5.4, 16, 0.2, 5.5, 'curated', null),
  (null, 'leguminosas', 'leguminosas', 'Lentejas rojas cocidas', 'Lentejas rojas cocidas', 'Red lentils, cooked', '130 g', '130 g', '130 g', 130, 100, 7.6, 17, 0.4, 3.5, 'curated', null),
  (null, 'leguminosas', 'leguminosas', 'Frijol mungo cocido', 'Frijol mungo cocido', 'Mung beans, cooked', '130 g', '130 g', '130 g', 130, 105, 7, 19, 0.4, 7.6, 'curated', null),
  (null, 'leguminosas', 'leguminosas', 'Falafel', 'Falafel', 'Falafel', '60 g', '60 g', '60 g', 60, 333, 13, 32, 18, 5, 'curated', null),
  (null, 'leguminosas', 'leguminosas', 'Leche de soya sin azúcar', 'Leche de soya sin azúcar', 'Unsweetened soy milk', '250 g', '250 g', '250 g', 250, 33, 2.9, 1.8, 1.6, 0.5, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Cacahuate sin sal', 'Cacahuate sin sal', 'Unsalted peanuts', '28 g', '28 g', '28 g', 28, 567, 26, 16, 49, 8.5, 'curated', null),
  (null, 'proteina_baja', 'proteina_baja', 'Seitan', 'Seitan', 'Seitan', '100 g', '100 g', '100 g', 100, 121, 21, 4, 2, 0.6, 'curated', null),
  (null, 'verduras', 'verduras', 'Brócoli al vapor', 'Brócoli al vapor', 'Steamed broccoli', '100 g', '100 g', '100 g', 100, 35, 2.4, 7, 0.4, 3.3, 'curated', null),
  (null, 'verduras', 'verduras', 'Coles de Bruselas', 'Coles de Bruselas', 'Brussels sprouts', '100 g', '100 g', '100 g', 100, 43, 3.4, 9, 0.3, 3.8, 'curated', null),
  (null, 'verduras', 'verduras', 'Calabaza butternut', 'Calabaza butternut', 'Butternut squash', '100 g', '100 g', '100 g', 100, 45, 1, 12, 0.1, 2, 'curated', null),
  (null, 'verduras', 'verduras', 'Chayote', 'Chayote', 'Chayote', '100 g', '100 g', '100 g', 100, 19, 0.8, 4.5, 0.1, 1.7, 'curated', null),
  (null, 'verduras', 'verduras', 'Jícama', 'Jícama', 'Jicama', '100 g', '100 g', '100 g', 100, 38, 0.7, 9, 0.1, 4.9, 'curated', null),
  (null, 'cereales', 'cereales', 'Camote morado', 'Camote morado', 'Purple sweet potato', '150 g', '150 g', '150 g', 150, 90, 2, 21, 0.1, 3.3, 'curated', null),
  (null, 'verduras', 'verduras', 'Poro', 'Poro', 'Leek', '100 g', '100 g', '100 g', 100, 61, 1.5, 14, 0.3, 1.8, 'curated', null),
  (null, 'verduras', 'verduras', 'Cebollín', 'Cebollín', 'Chives', '20 g', '20 g', '20 g', 20, 30, 3.3, 4.4, 0.7, 2.5, 'curated', null),
  (null, 'verduras', 'verduras', 'Ajo', 'Ajo', 'Garlic', '10 g', '10 g', '10 g', 10, 149, 6.4, 33, 0.5, 2.1, 'curated', null),
  (null, 'verduras', 'verduras', 'Jengibre', 'Jengibre', 'Ginger', '15 g', '15 g', '15 g', 15, 80, 1.8, 18, 0.8, 2, 'curated', null),
  (null, 'verduras', 'verduras', 'Endivia', 'Endivia', 'Endive', '80 g', '80 g', '80 g', 80, 17, 1.3, 3.4, 0.2, 3.1, 'curated', null),
  (null, 'verduras', 'verduras', 'Arúgula', 'Arúgula', 'Arugula', '40 g', '40 g', '40 g', 40, 25, 2.6, 3.7, 0.7, 1.6, 'curated', null),
  (null, 'verduras', 'verduras', 'Berros', 'Berros', 'Watercress', '40 g', '40 g', '40 g', 40, 11, 2.3, 1.3, 0.1, 0.5, 'curated', null),
  (null, 'verduras', 'verduras', 'Hongos portobello', 'Hongos portobello', 'Portobello mushrooms', '100 g', '100 g', '100 g', 100, 22, 2.1, 3.9, 0.4, 1.3, 'curated', null),
  (null, 'verduras', 'verduras', 'Tomate cherry', 'Tomate cherry', 'Cherry tomatoes', '100 g', '100 g', '100 g', 100, 18, 0.9, 3.9, 0.2, 1.2, 'curated', null),
  (null, 'verduras', 'verduras', 'Pimiento amarillo', 'Pimiento amarillo', 'Yellow bell pepper', '100 g', '100 g', '100 g', 100, 27, 1, 6.3, 0.2, 0.9, 'curated', null),
  (null, 'verduras', 'verduras', 'Alcachofa', 'Alcachofa', 'Artichoke', '100 g', '100 g', '100 g', 100, 47, 3.3, 11, 0.2, 5.4, 'curated', null),
  (null, 'verduras', 'verduras', 'Okra', 'Okra', 'Okra', '100 g', '100 g', '100 g', 100, 33, 1.9, 7, 0.2, 3.2, 'curated', null),
  (null, 'verduras', 'verduras', 'Rúcula baby', 'Rúcula baby', 'Baby spinach', '80 g', '80 g', '80 g', 80, 23, 2.9, 3.6, 0.4, 2.2, 'curated', null),
  (null, 'verduras', 'verduras', 'Germen de soya', 'Germen de soya', 'Bean sprouts', '100 g', '100 g', '100 g', 100, 30, 3, 6, 0.2, 1.8, 'curated', null),
  (null, 'verduras', 'verduras', 'Verdolaga', 'Verdolaga', 'Purslane', '80 g', '80 g', '80 g', 80, 16, 1.3, 3.4, 0.1, 0.9, 'curated', null),
  (null, 'verduras', 'verduras', 'Quelite', 'Quelite', 'Amaranth greens', '80 g', '80 g', '80 g', 80, 23, 2.5, 4, 0.3, 2.2, 'curated', null),
  (null, 'verduras', 'verduras', 'Flor de calabaza', 'Flor de calabaza', 'Squash blossom', '60 g', '60 g', '60 g', 60, 15, 1.0, 3.3, 0.1, 1.1, 'curated', null),
  (null, 'frutas', 'frutas', 'Zarzamora', 'Zarzamora', 'Blackberry', '100 g', '100 g', '100 g', 100, 43, 1.4, 10, 0.5, 5.3, 'curated', null),
  (null, 'frutas', 'frutas', 'Guayaba', 'Guayaba', 'Guava', '100 g', '100 g', '100 g', 100, 68, 2.6, 14, 1, 5.4, 'curated', null),
  (null, 'frutas', 'frutas', 'Maracuyá', 'Maracuyá', 'Passion fruit', '100 g', '100 g', '100 g', 100, 97, 2.2, 23, 0.7, 10, 'curated', null),
  (null, 'frutas', 'frutas', 'Carambolo', 'Carambolo', 'Starfruit', '100 g', '100 g', '100 g', 100, 31, 1, 6.7, 0.3, 2.8, 'curated', null),
  (null, 'frutas', 'frutas', 'Lichi', 'Lichi', 'Lychee', '100 g', '100 g', '100 g', 100, 66, 0.8, 17, 0.4, 1.3, 'curated', null),
  (null, 'frutas', 'frutas', 'Tuna', 'Tuna', 'Prickly pear', '100 g', '100 g', '100 g', 100, 41, 0.7, 9.6, 0.5, 3.6, 'curated', null),
  (null, 'frutas', 'frutas', 'Mamey', 'Mamey', 'Mamey sapote', '100 g', '100 g', '100 g', 100, 124, 1.5, 32, 0.5, 5.4, 'curated', null),
  (null, 'frutas', 'frutas', 'Chabacano', 'Chabacano', 'Apricot', '100 g', '100 g', '100 g', 100, 48, 1.4, 11, 0.4, 2, 'curated', null),
  (null, 'frutas', 'frutas', 'Nectarina', 'Nectarina', 'Nectarine', '150 g', '150 g', '150 g', 150, 44, 1.1, 11, 0.3, 1.7, 'curated', null),
  (null, 'frutas', 'frutas', 'Caqui', 'Caqui', 'Persimmon', '100 g', '100 g', '100 g', 100, 70, 0.6, 18, 0.2, 3.6, 'curated', null),
  (null, 'frutas', 'frutas', 'Grosella', 'Grosella', 'Currant', '100 g', '100 g', '100 g', 100, 56, 1.4, 14, 0.2, 4.3, 'curated', null),
  (null, 'frutas', 'frutas', 'Membrillo', 'Membrillo', 'Quince', '100 g', '100 g', '100 g', 100, 57, 0.4, 15, 0.1, 1.9, 'curated', null),
  (null, 'grasas_saturadas', 'grasas_saturadas', 'Coco fresco', 'Coco fresco', 'Fresh coconut', '40 g', '40 g', '40 g', 40, 354, 3.3, 15, 33, 9, 'curated', null),
  (null, 'frutas', 'frutas', 'Arándano rojo', 'Arándano rojo', 'Cranberry', '100 g', '100 g', '100 g', 100, 46, 0.4, 12, 0.1, 4.6, 'curated', null),
  (null, 'frutas', 'frutas', 'Manzana verde', 'Manzana verde', 'Green apple', '150 g', '150 g', '150 g', 150, 52, 0.3, 14, 0.2, 2.4, 'curated', null),
  (null, 'frutas', 'frutas', 'Ciruela pasa', 'Ciruela pasa', 'Prune', '30 g', '30 g', '30 g', 30, 240, 2.2, 64, 0.4, 7.1, 'curated', null),
  (null, 'frutas', 'frutas', 'Orejón de durazno', 'Orejón de durazno', 'Dried apricot', '30 g', '30 g', '30 g', 30, 241, 3.4, 63, 0.5, 7.3, 'curated', null),
  (null, 'frutas', 'frutas', 'Plátano deshidratado', 'Plátano deshidratado', 'Dried banana', '30 g', '30 g', '30 g', 30, 346, 3.9, 88, 1.8, 9.9, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Nuez pecana', 'Nuez pecana', 'Pecans', '28 g', '28 g', '28 g', 28, 691, 9.2, 14, 72, 9.6, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Avellana', 'Avellana', 'Hazelnuts', '28 g', '28 g', '28 g', 28, 628, 15, 17, 61, 9.7, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Nuez de Brasil', 'Nuez de Brasil', 'Brazil nuts', '28 g', '28 g', '28 g', 28, 659, 14, 12, 67, 7.5, 'curated', null),
  (null, 'grasas_mono', 'grasas_mono', 'Macadamia', 'Macadamia', 'Macadamia nuts', '28 g', '28 g', '28 g', 28, 718, 7.9, 14, 76, 8.6, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Piñones', 'Piñones', 'Pine nuts', '28 g', '28 g', '28 g', 28, 673, 14, 13, 68, 3.7, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Semilla de cáñamo', 'Semilla de cáñamo', 'Hemp seeds', '30 g', '30 g', '30 g', 30, 553, 32, 9, 49, 4, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Ajonjolí', 'Ajonjolí', 'Sesame seeds', '15 g', '15 g', '15 g', 15, 573, 18, 23, 50, 12, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Mantequilla de marañón', 'Mantequilla de marañón', 'Cashew butter', '32 g', '32 g', '32 g', 32, 587, 18, 28, 49, 2, 'curated', null),
  (null, 'grasas_mono', 'grasas_mono', 'Guacamole', 'Guacamole', 'Guacamole', '60 g', '60 g', '60 g', 60, 167, 2, 9, 15, 7, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Aceite de girasol', 'Aceite de girasol', 'Sunflower oil', '10 g', '10 g', '10 g', 10, 884, 0, 0, 100, 0, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Aceite de ajonjolí', 'Aceite de ajonjolí', 'Sesame oil', '10 g', '10 g', '10 g', 10, 884, 0, 0, 100, 0, 'curated', null),
  (null, 'grasas_saturadas', 'grasas_saturadas', 'Manteca de cerdo', 'Manteca de cerdo', 'Lard', '10 g', '10 g', '10 g', 10, 902, 0, 0, 100, 0, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Aderezo ranch', 'Aderezo ranch', 'Ranch dressing', '30 g', '30 g', '30 g', 30, 430, 1, 6, 45, 0, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Mayonesa', 'Mayonesa', 'Mayonnaise', '15 g', '15 g', '15 g', 15, 680, 1, 0.6, 75, 0, 'curated', null),
  (null, 'grasas_mono', 'grasas_mono', 'Vinagreta', 'Vinagreta', 'Vinaigrette', '15 g', '15 g', '15 g', 15, 449, 0.2, 4, 48, 0, 'curated', null),
  (null, 'azucares', 'azucares', 'Mermelada de fresa', 'Mermelada de fresa', 'Strawberry jam', '20 g', '20 g', '20 g', 20, 278, 0.4, 69, 0.1, 1.1, 'curated', null),
  (null, 'azucares', 'azucares', 'Cajeta', 'Cajeta', 'Cajeta', '20 g', '20 g', '20 g', 20, 315, 6, 55, 7.5, 0, 'curated', null),
  (null, 'grasas_saturadas', 'grasas_saturadas', 'Nutella', 'Nutella', 'Hazelnut spread', '20 g', '20 g', '20 g', 20, 539, 6.3, 57, 31, 0, 'curated', null),
  (null, 'azucares', 'azucares', 'Jarabe de agave', 'Jarabe de agave', 'Agave syrup', '20 g', '20 g', '20 g', 20, 310, 0, 76, 0, 0, 'curated', null),
  (null, 'azucares', 'azucares', 'Piloncillo', 'Piloncillo', 'Brown sugar cone', '10 g', '10 g', '10 g', 10, 380, 0, 98, 0, 0, 'curated', null),
  (null, 'grasas_saturadas', 'grasas_saturadas', 'Chocolate amargo 85%', 'Chocolate amargo 85%', 'Dark chocolate 85%', '30 g', '30 g', '30 g', 30, 598, 7.8, 46, 43, 11, 'curated', null),
  (null, 'snacks', 'snacks', 'Brownie', 'Brownie', 'Brownie', '50 g', '50 g', '50 g', 50, 466, 6, 50, 28, 2, 'curated', null),
  (null, 'snacks', 'snacks', 'Galleta con chispas', 'Galleta con chispas', 'Chocolate chip cookie', '30 g', '30 g', '30 g', 30, 488, 5.4, 64, 24, 2.4, 'curated', null),
  (null, 'snacks', 'snacks', 'Dona glaseada', 'Dona glaseada', 'Glazed donut', '60 g', '60 g', '60 g', 60, 452, 5, 51, 25, 1.5, 'curated', null),
  (null, 'snacks', 'snacks', 'Muffin', 'Muffin', 'Muffin', '70 g', '70 g', '70 g', 70, 377, 6, 54, 15, 1.8, 'curated', null),
  (null, 'leguminosas', 'leguminosas', 'Hummus de betabel', 'Hummus de betabel', 'Beet hummus', '60 g', '60 g', '60 g', 60, 160, 6, 16, 9, 5, 'curated', null),
  (null, 'snacks', 'snacks', 'Nachos con queso', 'Nachos con queso', 'Nachos with cheese', '60 g', '60 g', '60 g', 60, 343, 9, 36, 19, 3, 'curated', null),
  (null, 'snacks', 'snacks', 'Cacahuate japonés', 'Cacahuate japonés', 'Cracker peanuts', '30 g', '30 g', '30 g', 30, 520, 19, 38, 33, 5, 'curated', null),
  (null, 'snacks', 'snacks', 'Tortillas de maíz fritas', 'Tortillas de maíz fritas', 'Corn chips', '30 g', '30 g', '30 g', 30, 497, 7, 61, 25, 5, 'curated', null),
  (null, 'leguminosas', 'leguminosas', 'Edamame con sal', 'Edamame con sal', 'Salted edamame', '100 g', '100 g', '100 g', 100, 122, 12, 9, 5, 5, 'curated', null),
  (null, 'frutas', 'frutas', 'Fruta deshidratada mixta', 'Fruta deshidratada mixta', 'Mixed dried fruit', '40 g', '40 g', '40 g', 40, 314, 2.5, 79, 0.5, 6, 'curated', null),
  (null, 'grasas_poli', 'grasas_poli', 'Mezcla de nueces', 'Mezcla de nueces', 'Trail mix', '40 g', '40 g', '40 g', 40, 462, 14, 45, 29, 6, 'curated', null),
  (null, 'proteina_alta', 'proteina_alta', 'Chicharrón', 'Chicharrón', 'Pork rinds', '30 g', '30 g', '30 g', 30, 544, 61, 0, 31, 0, 'curated', null),
  (null, 'lacteos_enteros', 'lacteos_enteros', 'Palitos de queso', 'Palitos de queso', 'Cheese sticks', '30 g', '30 g', '30 g', 30, 320, 24, 2, 24, 0, 'curated', null),
  (null, 'snacks', 'snacks', 'Yogur con granola', 'Yogur con granola', 'Yogurt with granola', '150 g', '150 g', '150 g', 150, 180, 6, 28, 5, 1.5, 'curated', null)
;
-- END expanded catalog (Plan Builder v2)
