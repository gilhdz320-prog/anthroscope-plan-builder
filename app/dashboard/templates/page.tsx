import Link from 'next/link'

// Starter templates are seeded in supabase/seed.sql.
// This list will be populated from the DB once auth + data fetching are wired.

const seedTemplateNames = [
  { name: 'Pérdida de peso — 1200 kcal', goal: 'weight_loss', kcal: 1200 },
  { name: 'Mantenimiento — 1800 kcal', goal: 'maintenance', kcal: 1800 },
  { name: 'Weight loss — 1200 kcal', goal: 'weight_loss', kcal: 1200 },
  { name: 'Maintenance — 1800 kcal', goal: 'maintenance', kcal: 1800 },
]

const goalLabel: Record<string, string> = {
  weight_loss: 'Weight loss',
  maintenance: 'Maintenance',
  muscle_gain: 'Muscle gain',
  therapeutic: 'Therapeutic',
}

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Templates</h1>
          <p className="mt-1 text-sm text-stone-500">
            Reusable meal-plan skeletons you can apply to any patient.
          </p>
        </div>
        {/* New template button — disabled until Server Action is ready */}
        <button
          type="button"
          disabled
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white opacity-40 cursor-not-allowed"
          title="Available once auth is set up"
        >
          + New template
        </button>
      </div>

      {/* Seed preview table */}
      <div className="rounded-xl border border-stone-200 bg-white">
        <div className="border-b border-stone-100 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
            Starter templates (from seed data)
          </p>
        </div>

        <ul className="divide-y divide-stone-100">
          {seedTemplateNames.map((tpl) => (
            <li
              key={tpl.name}
              className="flex items-center justify-between px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-stone-800">{tpl.name}</p>
                <p className="mt-0.5 text-xs text-stone-400">
                  {goalLabel[tpl.goal] ?? tpl.goal} · {tpl.kcal} kcal target
                </p>
              </div>
              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-500">
                seed
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Info note */}
      <p className="text-xs text-stone-400">
        Seed templates are loaded from{' '}
        <code className="rounded bg-stone-100 px-1 font-mono">
          supabase/seed.sql
        </code>
        . Custom templates you create will appear here once you&apos;re signed in.
        Navigate to{' '}
        <Link href="/dashboard/plans/new" className="text-teal-700 hover:underline">
          New plan
        </Link>{' '}
        to apply a template to a patient.
      </p>
    </div>
  )
}
