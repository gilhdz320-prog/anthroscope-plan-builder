'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function nullable(v: FormDataEntryValue | null): string | null {
  const s = (v ?? '').toString().trim()
  return s === '' ? null : s
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

  // The plans table has no dedicated macro columns, so the energy target and
  // macro split are recorded as a leading summary line in notes.
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
  }).select('id').single()

  if (error || !newPlan) {
    redirect('/dashboard/plans/new?error=' + encodeURIComponent(error?.message ?? 'Error creando plan'))
  }

  // Clone template_meals into plan_meals if a template was selected.
  // Uses admin client to bypass RLS — template_meals may not be readable
  // by the authenticated user if the policy wasn't applied in production.
  if (template_id && newPlan) {
    const admin = createAdminClient()
    const { data: tplMeals } = await admin
      .from('template_meals')
      .select('meal_name, meal_order, equivalent_id, servings, notes')
      .eq('template_id', template_id)
      .order('meal_order', { ascending: true })

    if (tplMeals && tplMeals.length > 0) {
      const rows = tplMeals.map((m) => ({
        plan_id: newPlan.id,
        meal_name: m.meal_name,
        meal_order: m.meal_order,
        equivalent_id: m.equivalent_id ?? null,
        servings: m.servings ?? 1,
        notes: m.notes ?? null,
      }))
      await admin.from('plan_meals').insert(rows)
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
