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
