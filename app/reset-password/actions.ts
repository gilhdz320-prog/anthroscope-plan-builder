'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLocale, tr } from '@/lib/i18n'

export async function updatePassword(formData: FormData) {
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm_password') ?? '')
  const locale = await getLocale()

  if (password !== confirm) {
    redirect('/reset-password?error=mismatch')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`)
  }

  // Force a fresh sign-in with the new credentials.
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login?message=' + encodeURIComponent(tr('reset_done', locale)))
}
