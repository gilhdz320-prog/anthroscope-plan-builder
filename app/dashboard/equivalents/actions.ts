'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function str(value: FormDataEntryValue | null): string {
  return String(value ?? '').trim()
}

function numOrNull(value: FormDataEntryValue | null): number | null {
  const raw = str(value)
  if (!raw) return null
  const n = Number(raw.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/**
 * Agrega un alimento propio al catálogo de la nutricionista.
 * Se guarda con user_id, así solo lo ve ella (RLS: user_id is null or auth.uid()).
 */
export async function createCustomFood(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = str(formData.get('food_name'))
  const groupKey = str(formData.get('group_key'))
  if (!name || !groupKey) {
    redirect(
      '/dashboard/equivalents?error=' +
        encodeURIComponent('El nombre y el grupo son obligatorios.'),
    )
  }

  const serving = str(formData.get('serving_desc')) || '1 equivalente'

  const { error } = await supabase.from('equivalents').insert({
    user_id: user.id,
    group_key: groupKey,
    group_name: groupKey,
    food_name: name,
    food_name_es: name,
    food_name_en: name,
    serving_desc: serving,
    serving_desc_es: serving,
    serving_desc_en: serving,
    kcal: numOrNull(formData.get('kcal')),
    protein_g: numOrNull(formData.get('protein_g')),
    carbs_g: numOrNull(formData.get('carbs_g')),
    fat_g: numOrNull(formData.get('fat_g')),
    source: 'custom',
  })

  if (error) {
    redirect('/dashboard/equivalents?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/dashboard/equivalents')
  redirect('/dashboard/equivalents?ok=' + encodeURIComponent(name))
}

/** Borra un alimento propio (nunca toca los del sistema: RLS lo impide). */
export async function deleteCustomFood(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = str(formData.get('id'))
  if (!id) return

  const { error } = await supabase
    .from('equivalents')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    redirect('/dashboard/equivalents?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/dashboard/equivalents')
}
