import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { deletePlan } from './actions'

export default async function PlansPage() {
  const supabase = await createClient()
  const { data: plans, error } = await supabase
    .from('plans')
    .select(
      'id, title, status, valid_from, valid_until, created_at, patient:patients(first_name, last_name), template:templates(name)',
    )
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Plans</h1>
          <p className="mt-1 text-sm text-stone-500">
            Nutrition plans you&apos;ve built for your patients.
          </p>
        </div>
        <Link
          href="/dashboard/plans/new"
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
        >
          + New plan
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error.message}
        </div>
      )}

      {!plans || plans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-stone-600">No plans yet</p>
          <p className="mt-1 text-sm text-stone-400">
            Create your first nutrition plan for a patient.
          </p>
          <Link
            href="/dashboard/plans/new"
            className="mt-4 inline-block rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
          >
            Create plan
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100 bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Template</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {plans.map((p) => {
                const patient = Array.isArray(p.patient) ? p.patient[0] : p.patient
                const template = Array.isArray(p.template) ? p.template[0] : p.template
                return (
                  <tr key={p.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 font-medium text-stone-800">
                      {p.title}
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      {patient
                        ? `${patient.first_name} ${patient.last_name}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      {template?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-stone-500">{p.status}</td>
                    <td className="px-4 py-3 text-right">
                      <form action={deletePlan} className="inline">
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
