'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HAS_CLIENT_LIMIT, MAX_CLIENTS } from '@/lib/constants'
import { trackEvent } from '@/lib/analytics/track'
import { buildDemo } from '@/lib/demo/fixture'

function nullable(v: FormDataEntryValue | null): string | null {
  const s = (v ?? '').toString().trim()
  return s === '' ? null : s
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = (v ?? '').toString().trim()
  if (s === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/**
 * Campos del paciente a partir del formulario. Compartido por alta y edición
 * para que las dos pantallas no se desincronicen.
 */
function buildPatientFields(formData: FormData) {
  // Pliegues y perímetros ISAK: se envían SOLO si tienen valor. Así la acción
  // funciona aunque la migración de medidas todavía no se haya aplicado.
  const isak = Object.fromEntries(
    Object.entries({
      fold_triceps_mm: numOrNull(formData.get('fold_triceps_mm')),
      fold_subscapular_mm: numOrNull(formData.get('fold_subscapular_mm')),
      fold_biceps_mm: numOrNull(formData.get('fold_biceps_mm')),
      fold_iliac_mm: numOrNull(formData.get('fold_iliac_mm')),
      fold_supraspinal_mm: numOrNull(formData.get('fold_supraspinal_mm')),
      fold_abdominal_mm: numOrNull(formData.get('fold_abdominal_mm')),
      fold_thigh_mm: numOrNull(formData.get('fold_thigh_mm')),
      fold_calf_mm: numOrNull(formData.get('fold_calf_mm')),
      girth_arm_cm: numOrNull(formData.get('girth_arm_cm')),
      girth_thigh_cm: numOrNull(formData.get('girth_thigh_cm')),
      girth_calf_cm: numOrNull(formData.get('girth_calf_cm')),
      girth_chest_cm: numOrNull(formData.get('girth_chest_cm')),
    }).filter(([, value]) => value !== null),
  )

  return {
    first_name: String(formData.get('first_name') ?? '').trim(),
    last_name: String(formData.get('last_name') ?? '').trim(),
    email: nullable(formData.get('email')),
    birth_date: nullable(formData.get('birth_date')),
    sex: nullable(formData.get('sex')),
    phone: nullable(formData.get('phone')),
    notes: nullable(formData.get('notes')),
    weight_kg: numOrNull(formData.get('weight_kg')),
    height_cm: numOrNull(formData.get('height_cm')),
    body_fat_pct: numOrNull(formData.get('body_fat_pct')),
    waist_cm: numOrNull(formData.get('waist_cm')),
    hip_cm: numOrNull(formData.get('hip_cm')),
    ...isak,
    sport: nullable(formData.get('sport')),
    activity_level: nullable(formData.get('activity_level')),
    goal: nullable(formData.get('goal')),
  }
}

export async function createPatient(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const payload = { user_id: user.id, ...buildPatientFields(formData) }

  if (!payload.first_name || !payload.last_name) {
    redirect(
      '/dashboard/patients/new?error=' +
        encodeURIComponent('First name and last name are required.'),
    )
  }

  // El tope es opcional (por defecto 0 = sin límite).
  if (HAS_CLIENT_LIMIT) {
    const { count } = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count ?? 0) >= MAX_CLIENTS) {
      redirect(
        '/dashboard/patients/new?error=' +
          encodeURIComponent(
            `Has alcanzado el límite de ${MAX_CLIENTS} clientes de tu plan.`,
          ),
      )
    }
  }

  const { error } = await supabase.from('patients').insert(payload)

  if (error) {
    redirect(
      '/dashboard/patients/new?error=' + encodeURIComponent(error.message),
    )
  }

  await trackEvent({ name: 'patient_created', userId: user.id })

  revalidatePath('/dashboard/patients')
  revalidatePath('/dashboard')
  redirect('/dashboard/patients')
}

export async function updatePatient(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = String(formData.get('id') ?? '')
  if (!id) redirect('/dashboard/patients')

  const fields = buildPatientFields(formData)
  if (!fields.first_name || !fields.last_name) {
    redirect(
      `/dashboard/patients/${id}/edit?error=` +
        encodeURIComponent('Nombre y apellido son obligatorios.'),
    )
  }

  const { error } = await supabase
    .from('patients')
    .update(fields)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    redirect(
      `/dashboard/patients/${id}/edit?error=` + encodeURIComponent(error.message),
    )
  }

  revalidatePath(`/dashboard/patients/${id}`)
  revalidatePath('/dashboard/patients')
  revalidatePath('/dashboard')
  redirect(`/dashboard/patients/${id}`)
}

export async function deletePatient(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = String(formData.get('id') ?? '')
  if (!id) return

  await supabase.from('patients').delete().eq('id', id)
  revalidatePath('/dashboard/patients')
}

/**
 * Carga un caso de práctica en la cuenta: paciente + plan borrador con la
 * distribución de equivalentes ya calculada (sin comidas, para que la persona
 * practique el paso que importa en el editor).
 *
 * Idempotente: si ya existe "Ana Pérez", no duplica; abre la existente.
 */
export async function createDemoPatient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: existing } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', user.id)
    .eq('first_name', 'Ana')
    .eq('last_name', 'Pérez')
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    redirect(`/dashboard/patients/${existing.id}`)
  }

  const demo = buildDemo()
  const p = demo.patient

  const { data: patient, error } = await supabase
    .from('patients')
    .insert({
      user_id: user.id,
      first_name: p.first_name,
      last_name: p.last_name,
      sex: p.sex,
      birth_date: '1994-03-12',
      weight_kg: p.weight_kg,
      height_cm: p.height_cm,
      body_fat_pct: p.body_fat_pct,
      waist_cm: p.waist_cm,
      hip_cm: p.hip_cm,
      goal: p.goal,
      sport: p.sport,
      notes: `Caso de práctica. ${p.notes}`,
    })
    .select('id')
    .single()

  if (error || !patient) {
    redirect(
      '/dashboard/patients?error=' +
        encodeURIComponent(error?.message ?? 'No se pudo crear el caso de práctica'),
    )
  }

  const today = new Date().toISOString().slice(0, 10)
  const inAMonth = new Date()
  inAMonth.setDate(inAMonth.getDate() + 30)

  await supabase.from('plans').insert({
    user_id: user.id,
    patient_id: patient.id,
    title: 'Plan de práctica',
    status: 'draft',
    valid_from: today,
    valid_until: inAMonth.toISOString().slice(0, 10),
    plan_mode: 'equivalentes',
    equivalentes: {
      mode: 'equivalentes',
      kcalTarget: demo.targetKcal,
      proteinPct: demo.macros.proteinPct,
      carbsPct: demo.macros.carbsPct,
      fatPct: demo.macros.fatPct,
      proteinG: demo.totalsMacros.proteinG,
      carbsG: demo.totalsMacros.carbsG,
      fatG: demo.totalsMacros.fatG,
      groups: demo.totals,
    },
    notes:
      'Caso de práctica generado con el motor real: la meta de equivalentes ya está calculada. Ármalo en el editor de comidas.',
  })

  await trackEvent({
    name: 'patient_created',
    userId: user.id,
    props: { demo: true },
  })

  revalidatePath('/dashboard/patients')
  revalidatePath('/dashboard')
  redirect(`/dashboard/patients/${patient.id}`)
}
