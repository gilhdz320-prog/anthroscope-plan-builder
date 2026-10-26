'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeCode } from '@/lib/access-codes'
import { buildTrialStartedEmail } from '@/lib/emails/lifecycle'
import { sendEmail } from '@/lib/emails/send'
import { getAppUrl } from '@/lib/billing/stripe'
import { trackEvent } from '@/lib/analytics/track'

/**
 * Alta de cuenta.
 *
 * Dos caminos:
 * 1. Con código de acceso → clienta del pago único antiguo (legacy, de por vida).
 * 2. Sin código → prueba de 14 días. El trial lo crea un trigger en la BD
 *    (public.start_trial_on_signup), así funciona aunque el correo tarde en
 *    confirmarse.
 */
export async function signup(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const fullName = String(formData.get('full_name') ?? '').trim()
  const rawCode = String(formData.get('access_code') ?? '')
  const code = normalizeCode(rawCode)
  const wantsTrial = !code

  const supabase = await createClient()

  // 1) Si viene código, validarlo ANTES de crear el usuario (evita cuentas huérfanas).
  if (code) {
    const { data: isValid, error: rpcErr } = await supabase.rpc(
      'is_valid_access_code',
      { p_code: code },
    )

    if (rpcErr) {
      redirect(
        '/signup?error=' +
          encodeURIComponent('Error validando el código. Intenta de nuevo.'),
      )
    }

    if (!isValid) {
      redirect(
        '/signup?error=' +
          encodeURIComponent(
            'Código inválido o ya usado. Si compraste hace poco, espera unos minutos y revisa tu correo. Si no tienes código, deja el campo vacío y empieza tu prueba gratis.',
          ),
      )
    }
  }

  // 2) Crear el usuario
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  })

  if (signUpErr) {
    redirect(
      `/signup?error=${encodeURIComponent(signUpErr.message)}${
        code ? `&code=${encodeURIComponent(code)}` : ''
      }`,
    )
  }

  const newUserId = signUpData.user?.id

  // 3) Canjear el código (solo camino legacy).
  if (code && newUserId) {
    const admin = createAdminClient()
    const { data: redeemed, error: redeemErr } = await admin.rpc(
      'redeem_access_code',
      { p_code: code, p_user_id: newUserId },
    )
    if (redeemErr || !redeemed) {
      // Carrera rarísima: el código se usó entre la validación y el canje.
      // La cuenta ya existe: la dejamos entrar como trial en vez de bloquearla.
      console.error('[signup] redeem failed', redeemErr, redeemed)
    }
  }

  // 4) Correo de bienvenida con el trial (no bloquea el alta si falla).
  if (wantsTrial) {
    const { subject, html, text } = buildTrialStartedEmail({ appUrl: getAppUrl() })
    await sendEmail({ to: email, subject, html, text })
  }

  // 5) Métricas del embudo
  await trackEvent({
    name: 'signup_completed',
    userId: newUserId,
    props: { mode: wantsTrial ? 'trial' : 'legacy' },
  })
  if (wantsTrial) {
    await trackEvent({ name: 'trial_started', userId: newUserId })
  }

  revalidatePath('/', 'layout')
  redirect(
    '/login?message=' +
      encodeURIComponent(
        wantsTrial
          ? 'Cuenta creada. Tienes 14 días de prueba: inicia sesión para empezar.'
          : 'Cuenta creada. Inicia sesión para entrar a tu Plan Builder.',
      ),
  )
}
