'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requestReset(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()

  if (email) {
    const h = await headers()
    const host = h.get('host')
    const proto = h.get('x-forwarded-proto') ?? 'https'
    const origin = h.get('origin') ?? (host ? `${proto}://${host}` : '')

    const supabase = await createClient()
    // Errors are intentionally swallowed: we never reveal whether an account
    // exists for a given email.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    })
  }

  redirect('/forgot-password?sent=1')
}
