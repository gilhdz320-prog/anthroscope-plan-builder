'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  EQUIVALENTES_GRUPOS,
  GRUPO_KEYS,
  calcularEquivalentes,
  type Equivalentes,
} from '@/lib/equivalentes'

function nullable(v: FormDataEntryValue | null): string | null {
  const s = (v ?? '').toString().trim()
  return s === '' ? null : s
}

/**
 * Build the `equivalentes` JSONB payload for a newly created plan.
 *
 * Why this exists: previously the kcal target + macros entered in the "new plan"
 * form were stored only as a text summary inside `notes`. The column
 * `plans.equivalentes` (JSONB) was left NULL, which made the editor default to
 * 2000 kcal and broke "Remaining equivalents". We now persist the structured
 * object at creation time.
 *
 * Returns `null` only when no kcal target was provided.
 */
function buildEquivalentesPayload(planMode: 'macros' | 'equivalentes', kcalStr: string | null, proteinStr: string | null, carbsStr: string | null, fatStr: string | null) {
  const kcal = kcalStr ? Number(kcalStr) : 0
  if (!kcal || Number.isNaN(kcal)) return null

  const proteinG = proteinStr ? Number(proteinStr) : 0
  const carbsG = carbsStr ? Number(carbsStr) : 0
  const fatG = fatStr ? Number(fatStr) : 0

  // Derive macro percentages from grams (kcal-weighted)
  const macroKcal = proteinG * 4 + carbsG * 4 + fatG * 9
  let proteinPct: number
  let carbsPct: number
  let fatPct: number
  if (macroKcal > 0) {
    proteinPct = Math.round((proteinG * 4 / macroKcal) * 100)
    fatPct = Math.round((fatG * 9 / macroKcal) * 100)
    carbsPct = 100 - proteinPct - fatPct
    // Clamp to [0, 100] in case of rounding drift
    if (carbsPct < 0) { carbsPct = 0; proteinPct = Math.min(100, proteinPct); fatPct = Math.min(100, fatPct) }
  } else {
    // No grams provided: default 30/40/30 split
    proteinPct = 30
    carbsPct = 40
    fatPct = 30
  }

  const emptyGroups: Equivalentes = GRUPO_KEYS.reduce((acc, k) => {
    acc[k] = 0
    return acc
  }, {} as Equivalentes)

  const groups = planMode === 'equivalentes'
    ? calcularEquivalentes(kcal, proteinPct, carbsPct, fatPct)
    : emptyGroups

  return {
    mode: planMode,
    kcalTarget: kcal,
    proteinPct,
    carbsPct,
    fatPct,
    proteinG,
    carbsG,
    fatG,
    groups,
  }
}

export async function createPlan(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = String(formData.get('title') ?? '').trim()
  const patient_id = nullable(formData.get('patient_id'))
  const template_id = nullable(formData.get('template_id'))
  const valid_from = nullable(formData.get('valid_from'))
  const valid_until = nullable(formData.get('valid_until'))
  const notes = nullable(formData.get('notes'))

  const planModeRaw = nullable(formData.get('plan_mode'))
  const plan_mode = planModeRaw === 'equivalentes' ? 'equivalentes' : 'macros'

  const kcal = nullable(formData.get('kcal_target'))
  const protein = nullable(formData.get('protein_g'))
  const carbs = nullable(formData.get('carbs_g'))
  const fat = nullable(formData.get('fat_g'))

  // Build the structured equivalentes JSONB payload so the plan editor opens
  // with the correct kcal target and macro distribution (previously this was
  // only persisted as text inside `notes`, leaving `equivalentes` NULL).
  const equivalentesPayload = buildEquivalentesPayload(plan_mode, kcal, protein, carbs, fat)

  // The plans table has no dedicated macro columns, so the energy target and
  // macro split are also recorded as a leading summary line in notes (kept for
  // human-readable reference and backwards compatibility).
  const summaryParts: string[] = []
  if (kcal) summaryParts.push(`Meta: ${kcal} kcal`)
  if (protein || carbs || fat) {
    summaryParts.push(`P${protein ?? '?'}/C${carbs ?? '?'}/G${fat ?? '?'}`)
  }
  const summary = summaryParts.join(' · ')
  const finalNotes = [summary, notes].filter(Boolean).join('\n') || null

  if (!title || !patient_id) {
    redirect(
      '/dashboard/plans/new?error=' +
        encodeURIComponent('Title and patient are required.'),
    )
  }

  const { data: newPlan, error } = await supabase.from('plans').insert({
    user_id: user.id,
    patient_id,
    template_id,
    title,
    valid_from,
    valid_until,
    notes: finalNotes,
    plan_mode,
    equivalentes: equivalentesPayload,
  }).select('id').single()

  if (error || !newPlan) {
    redirect('/dashboard/plans/new?error=' + encodeURIComponent(error?.message ?? 'Error creando plan'))
  }

  // Clone template_meals into plan_meals if a template was selected.
  // Uses admin client to bypass RLS — template_meals may not be readable
  // by the authenticated user if the policy wasn't applied in production.
  if (template_id && newPlan) {
    try {
      const admin = createAdminClient()

      // Defensive: check if plan already has meals (prevents double-cloning
      // if the server action is somehow invoked twice for the same plan).
      const { count: existingCount } = await admin
        .from('plan_meals')
        .select('id', { count: 'exact', head: true })
        .eq('plan_id', newPlan.id)

      if (existingCount && existingCount > 0) {
        // Plan already has meals — skip cloning to avoid duplicates.
      } else {
        // Deduplicate template_meals at read-time: if the seed was run
        // multiple times, the same (meal_name, equivalent_id, servings)
        // combo may exist more than once per template. DISTINCT ON keeps
        // only one row per unique combination.
        const { data: tplMeals, error: tplError } = await admin
          .from('template_meals')
          .select('meal_name, meal_order, equivalent_id, servings, notes')
          .eq('template_id', template_id)
          .order('meal_order', { ascending: true })

        if (!tplError && tplMeals && tplMeals.length > 0) {
          // Deduplicate in application code (DISTINCT ON in the query would
          // require a raw SQL call; this is simpler and equally effective).
          const seen = new Set<string>()
          const rows = tplMeals
            .filter((m) => {
              const key = `${m.meal_name}|${m.equivalent_id ?? ''}|${m.servings ?? 1}`
              if (seen.has(key)) return false
              seen.add(key)
              return true
            })
            .map((m) => ({
              plan_id: newPlan.id,
              meal_name: m.meal_name,
              meal_order: m.meal_order,
              equivalent_id: m.equivalent_id ?? null,
              servings: m.servings ?? 1,
              notes: m.notes ?? null,
            }))
          if (rows.length > 0) {
            await admin.from('plan_meals').insert(rows)
          }
        }
      }
    } catch (e) {
      // Non-fatal: plan was created successfully, meals cloning failed.
      // Log for debugging but don't block the redirect.
      console.error('[createPlan] Failed to clone template_meals:', e)
    }
  }

  revalidatePath('/dashboard/plans')
  revalidatePath('/dashboard')
  redirect(`/dashboard/plans/${newPlan.id}`)
}

export async function createPlanViewToken(
  planId: string,
): Promise<{ token?: string; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  // Confirm the plan belongs to the requesting nutritionist (RLS also enforces).
  const { data: plan } = await supabase
    .from('plans')
    .select('id')
    .eq('id', planId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!plan) return { error: 'Plan no encontrado' }

  // Reuse an existing, unexpired token if one already exists.
  const { data: existing } = await supabase
    .from('plan_view_tokens')
    .select('token, expires_at')
    .eq('plan_id', planId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing && (!existing.expires_at || new Date(existing.expires_at) > new Date())) {
    return { token: existing.token as string }
  }

  const { data, error } = await supabase
    .from('plan_view_tokens')
    .insert({ plan_id: planId })
    .select('token')
    .single()

  if (error) return { error: error.message }
  return { token: data.token as string }
}

async function assertPlanOwner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  planId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('plans')
    .select('id')
    .eq('id', planId)
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

export async function addPlanMeal(
  planId: string,
  mealName: string,
  mealOrder: number,
  equivalentId: string,
  servings = 1,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }
  if (!(await assertPlanOwner(supabase, user.id, planId)))
    return { error: 'Plan no encontrado' }

  const { error } = await supabase.from('plan_meals').insert({
    plan_id: planId,
    meal_name: mealName,
    meal_order: mealOrder,
    equivalent_id: equivalentId,
    servings,
  })
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/plans/${planId}`)
  return {}
}

export async function removePlanMeal(
  planId: string,
  mealId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }
  if (!(await assertPlanOwner(supabase, user.id, planId)))
    return { error: 'Plan no encontrado' }

  const { error } = await supabase.from('plan_meals').delete().eq('id', mealId)
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/plans/${planId}`)
  return {}
}

export async function deletePlan(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = String(formData.get('id') ?? '')
  if (!id) return

  await supabase.from('plans').delete().eq('id', id)
  revalidatePath('/dashboard/plans')
}
