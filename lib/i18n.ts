import { createClient } from '@/lib/supabase/server'

export type Locale = 'es' | 'en'

const DEFAULT_LOCALE: Locale =
  (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale) || 'es'

/**
 * Get the current user's preferred locale from their profile.
 * Falls back to NEXT_PUBLIC_DEFAULT_LOCALE, then 'es'.
 */
export async function getLocale(): Promise<Locale> {
  try {
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
