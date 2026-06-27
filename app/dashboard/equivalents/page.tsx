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

  const byGroup: Record<string, Equivalent[]> = {}
  for (const e of equivalents) {
    const key = e.group_key || e.group_name || 'other'
    if (!byGroup[key]) byGroup[key] = []
    byGroup[key].push(e)
  }

  const groupsByKey: Record<string, FoodGroup> = {}
  for (const g of groups) groupsByKey[g.key] = g
  const orderedKeys = [
    ...groups.map((g) => g.key).filter((k) => byGroup[k]?.length),
    ...Object.keys(byGroup).filter((k) => !groupsByKey[k]),
  ]

  const totalCount = equivalents.length

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-6 rise">
        <div>
          <p className="eyebrow">{locale === 'en' ? 'Catalog' : 'Catálogo'}</p>
          <h1
            className="font-display mt-3"
            style={{
              fontSize: '38px',
              color: 'var(--ink-strong)',
              letterSpacing: '-0.025em',
              lineHeight: 1.02,
            }}
          >
            {tr('equivalents_title', locale)}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--ink-muted)' }}>
            {tr('equivalents_subtitle', locale)}
          </p>
        </div>
        {totalCount > 0 && (
          <span className="chip chip-gold">
            {totalCount} {locale === 'es' ? 'alimentos' : 'foods'}
          </span>
        )}
      </div>

      {error && (
        <div
          className="rounded-md border p-3 text-xs"
          style={{
            background: 'var(--danger-bg)',
            borderColor: 'rgba(184,60,42,0.2)',
            color: 'var(--danger)',
          }}
        >
          {error}
        </div>
      )}

      {orderedKeys.length === 0 ? (
        <div
          className="card-luxe px-6 py-16 text-center text-sm"
          style={{ borderStyle: 'dashed', color: 'var(--ink-subtle)' }}
        >
          {tr('equivalents_empty', locale)}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {orderedKeys.map((key, idx) => {
            const items = byGroup[key]
            const meta = groupsByKey[key]
            const groupLabel = meta ? (locale === 'en' ? meta.name_en : meta.name_es) : key
            const groupNote = meta ? (locale === 'en' ? meta.notes_en : meta.notes_es) : null
            return (
              <div
                key={key}
                className={`card-luxe rise rise-${Math.min(idx + 1, 4)}`}
                style={{ padding: 0 }}
              >
                <div
                  className="border-b px-5 py-4"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2
                      className="font-display"
                      style={{
                        fontSize: '17px',
                        color: 'var(--ink-strong)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {groupLabel}
                    </h2>
                    {meta?.exchange_kcal && (
                      <span className="chip chip-brand">
                        {meta.exchange_kcal} kcal
                      </span>
                    )}
                  </div>
                  {groupNote && (
                    <p
                      className="mt-1.5 text-[11px]"
                      style={{ color: 'var(--ink-subtle)' }}
                    >
                      {groupNote}
                    </p>
                  )}
                </div>
                <ul>
                  {items.map((item) => {
                    const altName = locale === 'es' ? item.food_name_en : item.food_name_es
                    return (
                      <li
                        key={item.id}
                        className="border-t px-5 py-3"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--ink-strong)' }}
                          >
                            {pickName(item, locale)}
                          </p>
                          {item.source === 'usda' && (
                            <span
                              className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider"
                              style={{
                                background: 'var(--surface-sunken)',
                                color: 'var(--ink-subtle)',
                                fontFamily: 'var(--font-jetbrains)',
                              }}
                            >
                              USDA
                            </span>
                          )}
                        </div>
                        {altName && altName !== pickName(item, locale) && (
                          <p
                            className="text-[11px] italic font-display"
                            style={{ color: 'var(--ink-subtle)' }}
                          >
                            {altName}
                          </p>
                        )}
                        <p
                          className="mt-1 text-xs font-mono-tabular"
                          style={{ color: 'var(--ink-muted)' }}
                        >
                          {pickServing(item, locale)}
                          {item.kcal != null && ` · ${item.kcal} kcal`}
                        </p>
                        {(item.protein_g != null || item.carbs_g != null || item.fat_g != null) && (
                          <p
                            className="mt-0.5 text-[10px] font-mono-tabular"
                            style={{ color: 'var(--ink-subtle)' }}
                          >
                            P {item.protein_g ?? 0} · C {item.carbs_g ?? 0} · G {item.fat_g ?? 0}
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
