'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

export async function createPatient(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const payload = {
    user_id: user.id,
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
    sport: nullable(formData.get('sport')),
    activity_level: nullable(formData.get('activity_level')),
    goal: nullable(formData.get('goal')),
  }

  if (!payload.first_name || !payload.last_name) {
    redirect(
      '/dashboard/patients/new?error=' +
        encodeURIComponent('First name and last name are required.'),
    )
  }

  const { error } = await supabase.from('patients').insert(payload)

  if (error) {
    redirect(
      '/dashboard/patients/new?error=' + encodeURIComponent(error.message),
    )
  }

  revalidatePath('/dashboard/patients')
  revalidatePath('/dashboard')
  redirect('/dashboard/patients')
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
