-- =============================================================================
-- Anthroscope Plan Builder — Starter Schema
-- =============================================================================
-- Run via: supabase db reset
-- All tables live in the `public` schema.
-- UUIDs default to gen_random_uuid() (available in Postgres 13+).
-- Row Level Security is enabled on every table (policies added per-feature).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles
-- One row per auth.users user. Created automatically via trigger (see below).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  role        text not null default 'nutritionist', -- 'nutritionist' | 'admin'
  locale      text not null default 'es',           -- 'es' | 'en'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Trigger: auto-create a profile row when a new auth user is created.
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
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. purchases
-- Tracks plan purchases / subscriptions (Stripe integration comes later).
-- ---------------------------------------------------------------------------
create table if not exists public.purchases (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  product_id   text,
  status       text not null default 'active', -- 'active' | 'cancelled' | 'expired'
  started_at   timestamptz not null default now(),
  expires_at   timestamptz,
  created_at   timestamptz not null default now()
);

alter table public.purchases enable row level security;

-- ---------------------------------------------------------------------------
-- 3. patients
-- ---------------------------------------------------------------------------
create table if not exists public.patients (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  first_name   text not null,
  last_name    text not null,
  email        text,
  birth_date   date,
  sex          text,
  phone        text,
  notes        text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.patients enable row level security;

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

-- ---------------------------------------------------------------------------
-- 6. templates
-- ---------------------------------------------------------------------------
create table if not exists public.templates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  name         text not null,
  description  text,
  goal         text,
  kcal_target  numeric(8, 2),
  is_public    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.templates enable row level security;

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

-- ---------------------------------------------------------------------------
-- 8. equivalents
-- null user_id = system/global record visible to all users.
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
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.plans enable row level security;

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

-- =============================================================================
-- End of schema
-- =============================================================================
