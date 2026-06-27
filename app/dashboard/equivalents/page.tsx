import { createClient } from '@/lib/supabase/server'

export default async function EquivalentsPage() {
  const supabase = await createClient()
  const { data: equivalents, error } = await supabase
    .from('equivalents')
    .select('id, group_name, food_name, serving_desc, kcal, protein_g, carbs_g, fat_g')
    .order('group_name', { ascending: true })
    .order('food_name', { ascending: true })

  // Group by group_name in memory
  const groups: Record<string, typeof equivalents extends (infer T)[] | null ? T[] : never[]> = {}
  for (const e of equivalents ?? []) {
    if (!groups[e.group_name]) groups[e.group_name] = []
    groups[e.group_name].push(e)
  }

  const groupNames = Object.keys(groups).sort()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Equivalents</h1>
          <p className="mt-1 text-sm text-stone-500">
            Food exchange list used to build meal plans. Values are per serving.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error.message}
        </div>
      )}

      {groupNames.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center text-sm text-stone-400">
          No equivalents loaded yet. Apply the seed file in Supabase.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groupNames.map((name) => (
            <div
              key={name}
              className="rounded-xl border border-stone-200 bg-white"
            >
              <div className="border-b border-stone-100 px-4 py-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                  {name}
                </h2>
              </div>
              <ul className="divide-y divide-stone-100">
                {groups[name].map((item) => (
                  <li key={item.id} className="px-4 py-3">
                    <p className="text-sm font-medium text-stone-800">
                      {item.food_name}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-400">
                      {item.serving_desc ?? '—'} ·{' '}
                      {item.kcal ? `${item.kcal} kcal` : 'n/a'}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
