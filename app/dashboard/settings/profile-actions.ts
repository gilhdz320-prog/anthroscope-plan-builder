'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface NutritionistProfile {
  clinic_name: string | null
  professional_name: string | null
  license_number: string | null
  specialty: string | null
  phone: string | null
  address: string | null
  website: string | null
  accent_color: string | null
  logo_url: string | null
  signature_url: string | null
}

function str(v: FormDataEntryValue | null): string | null {
  const s = (v ?? '').toString().trim()
  return s === '' ? null : s
}

export async function getProfile(
  userId: string,
): Promise<NutritionistProfile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('nutritionist_profiles')
    .select(
      'clinic_name, professional_name, license_number, specialty, phone, address, website, accent_color, logo_url, signature_url',
    )
    .eq('user_id', userId)
    .maybeSingle()
  return (data as NutritionistProfile) ?? null
}

export async function upsertProfile(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'No autenticado' }

  const payload = {
    user_id: user.id,
    clinic_name: str(formData.get('clinic_name')),
    professional_name: str(formData.get('professional_name')),
    license_number: str(formData.get('license_number')),
    specialty: str(formData.get('specialty')),
    phone: str(formData.get('phone')),
    address: str(formData.get('address')),
    website: str(formData.get('website')),
    accent_color: str(formData.get('accent_color')) ?? '#c9a961',
    logo_url: str(formData.get('logo_url')),
    signature_url: str(formData.get('signature_url')),
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('nutritionist_profiles')
    .upsert(payload, { onConflict: 'user_id' })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard/settings')
  return { ok: true }
}
