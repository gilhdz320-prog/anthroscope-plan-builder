import { createClient } from '@/lib/supabase/server'
import { getLocale, tr, type Locale } from '@/lib/i18n'

interface FoodGroup {
  key: string
  name_es: string
  name_en: string
  display_order: number
  exchange_kcal: number | null
  notes_es: string | null
  notes_en: string | null
}

interface Equivalent {
  id: string
  group_key: string | null
  group_name: string | null
  food_name: string | null
  food_name_es: string | null
  food_name_en: string | null
  serving_desc: string | null
  serving_desc_es: string | null
  serving_desc_en: string | null
  kcal: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
  source: string | null
}

function pickName(item: Equivalent, locale: Locale): string {
  if (locale === 'en') return item.food_name_en ?? item.food_name_es ?? item.food_name ?? ''
  return item.food_name_es ?? item.food_name_en ?? item.food_name ?? ''
}

function pickServing(item: Equivalent, locale: Locale): string {
  if (locale === 'en') return item.serving_desc_en ?? item.serving_desc_es ?? item.serving_desc ?? '—'
  return item.serving_desc_es ?? item.serving_desc_en ?? item.serving_desc ?? '—'
}

export default async function EquivalentsPage() {
  const locale = await getLocale()
  const supabase = await createClient()

  const [equivRes, groupsRes] = await Promise.all([
    supabase
      .from('equivalents')
      .select('id, group_key, group_name, food_name, food_name_es, food_name_en, serving_desc, serving_desc_es, serving_desc_en, kcal, protein_g, carbs_g, fat_g, fiber_g, source')
      .order('group_key', { ascending: true, nullsFirst: false })
      .order('food_name_es', { ascending: true }),
    supabase
      .from('food_groups')
      .select('key, name_es, name_en, display_order, exchange_kcal, notes_es, notes_en')
      .order('display_order'),
  ])

  const equivalents: Equivalent[] = equivRes.data ?? []
  const groups: FoodGroup[] = groupsRes.data ?? []
  const error = equivRes.error?.message || groupsRes.error?.message

  // Build a map of group_key -> equivalents
  const byGroup: Record<string, Equivalent[]> = {}
  for (const e of equivalents) {
    const key = e.group_key || e.group_name || 'other'
    if (!byGroup[key]) byGroup[key] = []
    byGroup[key].push(e)
  }

  // Determine display order: canonical groups first (by display_order),
  // then any orphan groups not in food_groups
  const groupsByKey: Record<string, FoodGroup> = {}
  for (const g of groups) groupsByKey[g.key] = g
  const orderedKeys = [
    ...groups.map((g) => g.key).filter((k) => byGroup[k]?.length),
    ...Object.keys(byGroup).filter((k) => !groupsByKey[k]),
  ]

  const totalCount = equivalents.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">
            {tr('equivalents_title', locale)}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {tr('equivalents_subtitle', locale)}
          </p>
        </div>
        {totalCount > 0 && (
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
            {totalCount} {locale === 'es' ? 'alimentos' : 'foods'}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {orderedKeys.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center text-sm text-stone-400">
          {tr('equivalents_empty', locale)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orderedKeys.map((key) => {
            const items = byGroup[key]
            const meta = groupsByKey[key]
            const groupLabel = meta
              ? (locale === 'en' ? meta.name_en : meta.name_es)
              : key
            const groupNote = meta
              ? (locale === 'en' ? meta.notes_en : meta.notes_es)
              : null
            return (
              <div
                key={key}
                className="rounded-xl border border-stone-200 bg-white"
              >
                <div className="border-b border-stone-100 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                      {groupLabel}
                    </h2>
                    {meta?.exchange_kcal && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        {meta.exchange_kcal} kcal
                      </span>
                    )}
                  </div>
                  {groupNote && (
                    <p className="mt-1 text-[11px] text-stone-400">{groupNote}</p>
                  )}
                </div>
                <ul className="divide-y divide-stone-100">
                  {items.map((item) => {
                    const altName =
                      locale === 'es' ? item.food_name_en : item.food_name_es
                    return (
                      <li key={item.id} className="px-4 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-stone-800">
                            {pickName(item, locale)}
                          </p>
                          {item.source === 'usda' && (
                            <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium uppercase text-blue-600">
                              USDA
                            </span>
                          )}
                        </div>
                        {altName && altName !== pickName(item, locale) && (
                          <p className="text-[11px] italic text-stone-400">
                            {altName}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-stone-500">
                          {pickServing(item, locale)}
                          {item.kcal != null && ` · ${item.kcal} kcal`}
                        </p>
                        {(item.protein_g != null ||
                          item.carbs_g != null ||
                          item.fat_g != null) && (
                          <p className="mt-0.5 text-[10px] tabular-nums text-stone-400">
                            P {item.protein_g ?? 0} · C {item.carbs_g ?? 0} · G{' '}
                            {item.fat_g ?? 0}
                            {item.fiber_g ? ` · Fib ${item.fiber_g}` : ''}
                          </p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
