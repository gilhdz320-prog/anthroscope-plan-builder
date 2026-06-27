import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createPlan } from '../actions'

export default async function NewPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  const [{ data: patients }, { data: templates }] = await Promise.all([
    supabase
      .from('patients')
      .select('id, first_name, last_name')
      .order('first_name', { ascending: true }),
    supabase
      .from('templates')
      .select('id, name, kcal_target')
      .order('is_seed', { ascending: false })
      .order('name', { ascending: true }),
  ])

  const input =
    'mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-teal-500'
  const label = 'block text-xs font-medium text-stone-700'
  const hasPatients = (patients ?? []).length > 0

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/plans"
          className="text-xs text-stone-400 hover:text-stone-600"
        >
          ← Back to plans
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-stone-900">New plan</h1>
        <p className="mt-1 text-sm text-stone-500">
          Build a nutrition plan from a patient and (optionally) a template.
        </p>
      </div>

      {sp.error && (
        <div className="max-w-lg rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {sp.error}
        </div>
      )}

      {!hasPatients && (
        <div className="max-w-lg rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          You don&apos;t have any patients yet.{' '}
          <Link
            href="/dashboard/patients/new"
            className="font-medium underline"
          >
            Add a patient first
          </Link>
          .
        </div>
      )}

      <form
        action={createPlan}
        className="max-w-lg space-y-4 rounded-xl border border-stone-200 bg-white p-6"
      >
        <div>
          <label htmlFor="title" className={label}>
            Plan title *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="e.g. Weight-loss plan — June 2025"
            className={input}
          />
        </div>

        <div>
          <label htmlFor="patient_id" className={label}>
            Patient *
          </label>
          <select id="patient_id" name="patient_id" required className={input}>
            <option value="">Select a patient</option>
            {(patients ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="template_id" className={label}>
            Starting template <span className="text-stone-400">(optional)</span>
          </label>
          <select id="template_id" name="template_id" className={input}>
            <option value="">None — start from scratch</option>
            {(templates ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.kcal_target ? ` — ${t.kcal_target} kcal` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="valid_from" className={label}>
              Valid from
            </label>
            <input
              id="valid_from"
              name="valid_from"
              type="date"
              className={input}
            />
          </div>
          <div>
            <label htmlFor="valid_until" className={label}>
              Valid until
            </label>
            <input
              id="valid_until"
              name="valid_until"
              type="date"
              className={input}
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={label}>
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className={`${input} resize-none`}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={!hasPatients}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create plan
          </button>
          <Link
            href="/dashboard/plans"
            className="text-sm text-stone-500 hover:text-stone-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
