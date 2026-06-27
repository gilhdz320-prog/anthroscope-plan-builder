import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { deletePatient } from './actions'

export default async function PatientsPage() {
  const supabase = await createClient()
  const { data: patients, error } = await supabase
    .from('patients')
    .select('id, first_name, last_name, email, sex, birth_date, sport, goal, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Patients</h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage your active patients and their records.
          </p>
        </div>
        <Link
          href="/dashboard/patients/new"
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
        >
          + New patient
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error.message}
        </div>
      )}

      {!patients || patients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-stone-600">No patients yet</p>
          <p className="mt-1 text-sm text-stone-400">
            Add your first patient to get started.
          </p>
          <Link
            href="/dashboard/patients/new"
            className="mt-4 inline-block rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
          >
            Add patient
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100 bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Sport</th>
                <th className="px-4 py-3">Goal</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 font-medium text-stone-800">
                    {p.first_name} {p.last_name}
                  </td>
                  <td className="px-4 py-3 text-stone-500">{p.email ?? '—'}</td>
                  <td className="px-4 py-3 text-stone-500">{p.sport ?? '—'}</td>
                  <td className="px-4 py-3 text-stone-500">{p.goal ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={deletePatient} className="inline">
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
