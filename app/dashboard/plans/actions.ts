'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

  if (!title || !patient_id) {
    redirect(
      '/dashboard/plans/new?error=' +
        encodeURIComponent('Title and patient are required.'),
    )
  }

  const { error } = await supabase.from('plans').insert({
    user_id: user.id,
    patient_id,
    template_id,
    title,
    valid_from,
    valid_until,
    notes,
  })

  if (error) {
    redirect('/dashboard/plans/new?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/dashboard/plans')
  revalidatePath('/dashboard')
  redirect('/dashboard/plans')
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
