import { createClient } from '@/lib/supabase/server'
import { createCustomFood, deleteCustomFood } from './actions'
import { DB_GROUP_META } from '@/lib/food-groups'
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
  user_id?: string | null
}

function pickName(item: Equivalent, locale: Locale): string {
  if (locale === 'en') return item.food_name_en ?? item.food_name_es ?? item.food_name ?? ''
  return item.food_name_es ?? item.food_name_en ?? item.food_name ?? ''
}

function pickServing(item: Equivalent, locale: Locale): string {
  if (locale === 'en') return item.serving_desc_en ?? item.serving_desc_es ?? item.serving_desc ?? '—'
  return item.serving_desc_es ?? item.serving_desc_en ?? item.serving_desc ?? '—'
}

export default async function EquivalentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>
}) {
  const sp = await searchParams
  const locale = await getLocale()
  const supabase = await createClient()

  const [equivRes, groupsRes] = await Promise.all([
    supabase
      .from('equivalents')
      .select('id, user_id, group_key, group_name, food_name, food_name_es, food_name_en, serving_desc, serving_desc_es, serving_desc_en, kcal, protein_g, carbs_g, fat_g, fiber_g, source')
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


      {sp.ok && (
        <div
          className="rounded-md border p-3 text-xs"
          style={{ background: 'var(--brand-50, #F1F7F3)', borderColor: 'var(--border-emerald, #CFE3D8)', color: 'var(--brand-700)' }}
        >
          Alimento agregado: {sp.ok}
        </div>
      )}

      {sp.error && (
        <div
          className="rounded-md border p-3 text-xs"
          style={{ background: 'var(--danger-bg)', borderColor: 'rgba(184,60,42,0.2)', color: 'var(--danger)' }}
        >
          {sp.error}
        </div>
      )}

      {/* Alimento propio */}
      <details className="card-luxe p-5">
        <summary className="cursor-pointer text-sm" style={{ color: 'var(--ink-strong)' }}>
          {locale === 'es'
            ? 'Agregar un alimento propio (no está en el catálogo)'
            : 'Add your own food (not in the catalog)'}
        </summary>
        <form action={createCustomFood} className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="md:col-span-2">
            <span className="label text-[11px]">{locale === 'es' ? 'Nombre' : 'Name'}</span>
            <input name="food_name" required className="input" placeholder="Ej. Queso fresco de la región" />
          </label>
          <label>
            <span className="label text-[11px]">{locale === 'es' ? 'Grupo' : 'Group'}</span>
            <select name="group_key" required className="input" defaultValue="">
              <option value="" disabled>
                {locale === 'es' ? 'Elegir…' : 'Choose…'}
              </option>
              {groups.length > 0
                ? groups.map((g) => (
                    <option key={g.key} value={g.key}>
                      {locale === 'es' ? g.name_es : g.name_en}
                    </option>
                  ))
                : Object.entries(DB_GROUP_META).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta[locale]}
                    </option>
                  ))}
            </select>
          </label>
          <label>
            <span className="label text-[11px]">{locale === 'es' ? 'Porción' : 'Serving'}</span>
            <input name="serving_desc" className="input" placeholder="1 taza / 30 g" />
          </label>
          <label>
            <span className="label text-[11px]">kcal</span>
            <input name="kcal" type="number" step="0.1" className="input" />
          </label>
          <label>
            <span className="label text-[11px]">{locale === 'es' ? 'Proteína (g)' : 'Protein (g)'}</span>
            <input name="protein_g" type="number" step="0.1" className="input" />
          </label>
          <label>
            <span className="label text-[11px]">{locale === 'es' ? 'Carbos (g)' : 'Carbs (g)'}</span>
            <input name="carbs_g" type="number" step="0.1" className="input" />
          </label>
          <label>
            <span className="label text-[11px]">{locale === 'es' ? 'Grasas (g)' : 'Fat (g)'}</span>
            <input name="fat_g" type="number" step="0.1" className="input" />
          </label>
          <div className="flex items-end">
            <button type="submit" className="btn btn-brand w-full">
              {locale === 'es' ? 'Agregar' : 'Add'}
            </button>
          </div>
        </form>
        <p className="mt-3 text-[11px]" style={{ color: 'var(--ink-subtle)' }}>
          {locale === 'es'
            ? 'Solo lo ves tú. Aparece en la búsqueda de alimentos al armar un plan.'
            : 'Only you can see it. It shows up in food search when building a plan.'}
        </p>
      </details>

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
                          {item.user_id && (
                            <span
                              className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider"
                              style={{ background: 'rgba(201,169,97,0.18)', color: 'var(--gold-700)' }}
                            >
                              {locale === 'es' ? 'Propio' : 'Custom'}
                            </span>
                          )}
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
