'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeCode } from '@/lib/access-codes'

export async function signup(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const fullName = String(formData.get('full_name') ?? '').trim()
  const rawCode = String(formData.get('access_code') ?? '')
  const code = normalizeCode(rawCode)

  // 1) Require an access code
  if (!code) {
    redirect(
      '/signup?error=' +
        encodeURIComponent(
          'Necesitas un código de acceso. Si ya compraste, revisa tu correo (incluyendo SPAM).',
        ),
    )
  }

  // 2) Validate code BEFORE creating the auth user (avoid orphan accounts).
  // Use a public RPC that returns boolean — no PII leak.
  const supabase = await createClient()
  const { data: isValid, error: rpcErr } = await supabase.rpc(
    'is_valid_access_code',
    { p_code: code },
  )

  if (rpcErr) {
    redirect(
      '/signup?error=' + encodeURIComponent('Error validando el código. Intenta de nuevo.'),
    )
  }

  if (!isValid) {
    redirect(
      '/signup?error=' +
        encodeURIComponent(
          'Código inválido o ya usado. Si compraste hace poco, espera unos minutos y revisa tu correo.',
        ),
    )
  }

  // 3) Create the auth user
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  })

  if (signUpErr) {
    redirect(`/signup?error=${encodeURIComponent(signUpErr.message)}&code=${encodeURIComponent(code)}`)
  }

  const newUserId = signUpData.user?.id

  // 4) Redeem the code. We use the admin client to make sure this works even
  // before email confirmation kicks in (RLS on the RPC is permissive, but
  // admin guarantees correctness in both flows).
  if (newUserId) {
    const admin = createAdminClient()
    const { data: redeemed, error: redeemErr } = await admin.rpc(
      'redeem_access_code',
      { p_code: code, p_user_id: newUserId },
    )
    if (redeemErr || !redeemed) {
      // Extremely rare race: code was used between our check and redeem.
      // Log but let the user in — their account exists.
      console.error('[signup] redeem failed', redeemErr, redeemed)
    }
  }

  revalidatePath('/', 'layout')
  redirect(
    '/login?message=' +
      encodeURIComponent(
        'Cuenta creada. Inicia sesión para entrar a tu Plan Builder.',
      ),
  )
}
