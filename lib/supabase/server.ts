import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client.
 *
 * Use this inside Server Components, Server Actions, and Route Handlers.
 * Always call this function fresh — never share the returned client across requests.
 *
 * Uses the modern getAll / setAll cookie API as required by @supabase/ssr v0.12+.
 * setAll is intentionally omitted here (read-only in page/component context).
 * Middleware should handle session refresh writes when auth is fully implemented.
 *
 * Example:
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('patients').select()
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // setAll can throw in read-only Server Component contexts.
            // This is expected — session refresh cookies will be handled
            // by middleware once auth is implemented.
          }
        },
      },
    },
  )
}
