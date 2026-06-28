import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export type Locale = 'es' | 'en'

const DEFAULT_LOCALE: Locale =
  (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale) || 'es'

/**
 * Get the current locale. The manual `locale` cookie (set by the in-app
 * language toggle) takes precedence over the profile preference so the toggle
 * overrides auto-detection. Falls back to the profile, then
 * NEXT_PUBLIC_DEFAULT_LOCALE, then 'es'.
 */
export async function getLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies()
    const cookieLocale = cookieStore.get('locale')?.value
    if (cookieLocale === 'en' || cookieLocale === 'es') return cookieLocale

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return DEFAULT_LOCALE
    const { data } = await supabase
      .from('profiles')
      .select('locale')
      .eq('id', user.id)
      .maybeSingle()
    if (data?.locale === 'en' || data?.locale === 'es') return data.locale
    return DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

// ---------------------------------------------------------------------------
// Static UI strings
// ---------------------------------------------------------------------------

type Dict = Record<string, { es: string; en: string }>

export const t: Dict = {
  // Common
  save: { es: 'Guardar', en: 'Save' },
  cancel: { es: 'Cancelar', en: 'Cancel' },
  delete: { es: 'Eliminar', en: 'Delete' },
  edit: { es: 'Editar', en: 'Editar' },
  create: { es: 'Crear', en: 'Create' },
  back: { es: 'Volver', en: 'Back' },
  signOut: { es: 'Cerrar sesión', en: 'Sign out' },

  // Nav
  overview: { es: 'Panel', en: 'Overview' },
  patients: { es: 'Pacientes', en: 'Patients' },
  plans: { es: 'Planes', en: 'Plans' },
  templates: { es: 'Plantillas', en: 'Templates' },
  equivalents: { es: 'Equivalentes', en: 'Equivalents' },
  settings: { es: 'Configuración', en: 'Settings' },

  // Auth — shared
  email: { es: 'Correo electrónico', en: 'Email' },
  password: { es: 'Contraseña', en: 'Password' },
  show: { es: 'Mostrar', en: 'Show' },
  hide: { es: 'Ocultar', en: 'Hide' },
  panel: { es: 'Panel', en: 'Dashboard' },

  // Auth — login
  login_eyebrow: { es: 'Plan Builder · Pro', en: 'Plan Builder · Pro' },
  login_subtitle: {
    es: 'Inicia sesión para continuar con tu trabajo.',
    en: 'Sign in to continue with your work.',
  },
  login_email_ph: { es: 'tu@correo.com', en: 'you@email.com' },
  login_submit: { es: 'Iniciar sesión', en: 'Sign in' },
  login_no_account: { es: '¿No tienes cuenta?', en: "Don't have an account?" },
  login_create_one: { es: 'Crear una', en: 'Create one' },
  login_forgot: { es: '¿Olvidaste tu contraseña?', en: 'Forgot your password?' },

  // Auth — signup
  signup_subtitle: {
    es: 'Activa tu cuenta con el código que recibiste por correo.',
    en: 'Activate your account with the code you received by email.',
  },
  signup_access_code: { es: 'Código de acceso', en: 'Access code' },
  signup_access_hint_pre: {
    es: 'Lo recibiste por correo tras tu compra.',
    en: 'You received it by email after your purchase.',
  },
  signup_access_hint_link: { es: '¿No tienes uno?', en: "Don't have one?" },
  signup_full_name: { es: 'Nombre completo', en: 'Full name' },
  signup_password_ph: { es: 'Mínimo 6 caracteres', en: 'At least 6 characters' },
  signup_submit: { es: 'Activar mi cuenta', en: 'Activate my account' },
  signup_have_account: { es: '¿Ya tienes cuenta?', en: 'Already have an account?' },
  signup_sign_in: { es: 'Inicia sesión', en: 'Sign in' },
  signup_from_stripe: {
    es: '¡Gracias por tu compra! Te enviamos tu código de acceso por correo. Si no llega en unos minutos, revisa la carpeta de SPAM.',
    en: 'Thanks for your purchase! We emailed your access code. If it does not arrive in a few minutes, check your SPAM folder.',
  },

  // Auth — forgot password
  forgot_title: { es: 'Recuperar contraseña', en: 'Reset password' },
  forgot_subtitle: {
    es: 'Te enviaremos un enlace para restablecer tu contraseña.',
    en: "We'll email you a link to reset your password.",
  },
  forgot_submit: { es: 'Enviar enlace', en: 'Send link' },
  forgot_back_to_login: { es: 'Volver a iniciar sesión', en: 'Back to sign in' },
  forgot_sent: {
    es: 'Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu contraseña. Revisa también la carpeta de SPAM.',
    en: 'If an account exists for that email, we sent a password reset link. Check your SPAM folder too.',
  },

  // Auth — reset password
  reset_title: { es: 'Nueva contraseña', en: 'New password' },
  reset_subtitle: {
    es: 'Elige una contraseña nueva para tu cuenta.',
    en: 'Choose a new password for your account.',
  },
  reset_new_password: { es: 'Nueva contraseña', en: 'New password' },
  reset_confirm_password: { es: 'Confirmar contraseña', en: 'Confirm password' },
  reset_submit: { es: 'Actualizar contraseña', en: 'Update password' },
  reset_mismatch: {
    es: 'Las contraseñas no coinciden.',
    en: 'Passwords do not match.',
  },
  reset_invalid_link: {
    es: 'El enlace es inválido o expiró. Solicita uno nuevo.',
    en: 'The link is invalid or expired. Request a new one.',
  },
  reset_done: {
    es: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.',
    en: 'Password updated. Sign in with your new password.',
  },

  // Equivalents page
  equivalents_title: { es: 'Equivalentes', en: 'Equivalents' },
  equivalents_subtitle: {
    es: 'Lista de equivalencias de alimentos para construir planes. Valores por porción.',
    en: 'Food exchange list used to build meal plans. Values are per serving.',
  },
  equivalents_empty: {
    es: 'No hay equivalentes cargados. Aplica el seed de USDA en Supabase.',
    en: 'No equivalents loaded yet. Apply the USDA seed in Supabase.',
  },
  per_serving: { es: 'por porción', en: 'per serving' },
}

export function tr(key: keyof typeof t, locale: Locale): string {
  return t[key]?.[locale] ?? key
}
