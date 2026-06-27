import Link from 'next/link'

export default function PatientsPage() {
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

      {/* Empty state — replace with real list once DB is wired */}
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
    </div>
  )
}
