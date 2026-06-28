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
