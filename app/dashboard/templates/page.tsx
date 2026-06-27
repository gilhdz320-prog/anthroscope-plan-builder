import { createClient } from '@/lib/supabase/server'

const goalLabel: Record<string, string> = {
  weight_loss: 'Weight loss',
  maintenance: 'Maintenance',
  muscle_gain: 'Muscle gain',
  performance: 'Performance',
  therapeutic: 'Therapeutic',
}

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: templates, error } = await supabase
    .from('templates')
    .select('id, name, description, goal, kcal_target, is_seed, is_public, user_id')
    .order('is_seed', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Templates</h1>
          <p className="mt-1 text-sm text-stone-500">
            Reusable meal-plan skeletons you can apply to any patient.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error.message}
        </div>
      )}

      <div className="rounded-xl border border-stone-200 bg-white">
        <div className="border-b border-stone-100 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
            All templates
          </p>
        </div>

        {!templates || templates.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-stone-400">
            No templates yet.
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {templates.map((tpl) => (
              <li
                key={tpl.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-stone-800">
                    {tpl.name}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-400">
                    {tpl.goal ? goalLabel[tpl.goal] ?? tpl.goal : '—'} ·{' '}
                    {tpl.kcal_target ? `${tpl.kcal_target} kcal` : 'no target'}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs ${
                    tpl.is_seed
                      ? 'bg-stone-100 text-stone-500'
                      : 'bg-teal-50 text-teal-700'
                  }`}
                >
                  {tpl.is_seed ? 'seed' : 'custom'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
