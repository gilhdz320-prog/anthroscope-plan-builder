-- ============================================================================
-- ANTHROSCOPE PLAN BUILDER — DIAGNÓSTICO DE ESQUEMA
-- ----------------------------------------------------------------------------
-- Pega esto en el SQL Editor y ejecútalo. Devuelve una fila por objeto que la
-- aplicación necesita, con `existe = false` en los que faltan.
--
-- Si algo sale en false, la función que lo usa falla en producción. Manda el
-- resultado y lo arreglamos con el SQL correspondiente.
-- ============================================================================

with esperado as (
  select * from (values
    -- Núcleo
    ('tabla', 'profiles'),
    ('tabla', 'patients'),
    ('tabla', 'intakes'),
    ('tabla', 'calculations'),
    ('tabla', 'templates'),
    ('tabla', 'template_meals'),
    ('tabla', 'equivalents'),
    ('tabla', 'plans'),
    ('tabla', 'plan_meals'),
    ('tabla', 'alerts'),
    ('tabla', 'purchases'),
    ('tabla', 'avatars'),
    -- Funciones del producto
    ('tabla', 'intake_forms'),
    ('tabla', 'dietary_recalls'),
    ('tabla', 'patient_progress'),
    ('tabla', 'plan_view_tokens'),
    ('tabla', 'nutritionist_profiles'),
    ('tabla', 'food_groups'),
    -- Cobro y métricas
    ('tabla', 'access_codes'),
    ('tabla', 'subscriptions'),
    ('tabla', 'analytics_events'),
    -- Funciones SQL
    ('funcion', 'is_valid_access_code'),
    ('funcion', 'redeem_access_code'),
    ('funcion', 'user_has_paid_access'),
    ('funcion', 'user_has_app_access'),
    ('funcion', 'trial_days_left'),
    ('funcion', 'start_trial_on_signup'),
    ('funcion', 'get_plan_by_token')
  ) as t(tipo, nombre)
)
select
  tipo,
  nombre,
  case
    when tipo = 'tabla' then to_regclass('public.' || nombre) is not null
    else exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = nombre
    )
  end as existe
from esperado
order by existe asc, tipo desc, nombre;
