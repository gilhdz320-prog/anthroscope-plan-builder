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
