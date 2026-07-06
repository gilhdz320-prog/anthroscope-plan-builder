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
