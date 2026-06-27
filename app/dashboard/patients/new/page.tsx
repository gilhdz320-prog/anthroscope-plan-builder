import Link from 'next/link'

// Placeholder page for adding a new patient.
// Form submission + Server Action will be wired here once auth is set up.

export default function NewPatientPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Link
          href="/dashboard/patients"
          className="text-xs text-stone-400 hover:text-stone-600"
        >
          ← Back to patients
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-stone-900">
          New patient
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Fill in the patient&apos;s basic information to create their record.
        </p>
      </div>

      {/* Form shell — inputs are disabled until Server Action is wired */}
      <div className="max-w-lg rounded-xl border border-stone-200 bg-white p-6">
        <div className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="first_name"
                className="block text-xs font-medium text-stone-700"
              >
                First name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                placeholder="Ana"
                disabled
                className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-400 outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="last_name"
                className="block text-xs font-medium text-stone-700"
              >
                Last name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                placeholder="García"
                disabled
                className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-400 outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-stone-700"
            >
              Email <span className="text-stone-400">(optional)</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="ana@example.com"
              disabled
              className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-400 outline-none"
            />
          </div>

          {/* Birth date + Sex row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="birth_date"
                className="block text-xs font-medium text-stone-700"
              >
                Date of birth
              </label>
              <input
                id="birth_date"
                name="birth_date"
                type="date"
                disabled
                className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-400 outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="sex"
                className="block text-xs font-medium text-stone-700"
              >
                Sex
              </label>
              <select
                id="sex"
                name="sex"
                disabled
                className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-400 outline-none"
              >
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-xs font-medium text-stone-700"
            >
              Notes <span className="text-stone-400">(optional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Allergies, relevant conditions, context…"
              disabled
              className="mt-1 w-full resize-none rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-400 outline-none"
            />
          </div>
        </div>

        {/* Coming-soon notice */}
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-700">
            This form will be activated once authentication is set up and the
            Server Action is wired.
          </p>
        </div>

        {/* Action row */}
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            disabled
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white opacity-40 cursor-not-allowed"
          >
            Save patient
          </button>
          <Link
            href="/dashboard/patients"
            className="text-sm text-stone-500 hover:text-stone-700"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}
