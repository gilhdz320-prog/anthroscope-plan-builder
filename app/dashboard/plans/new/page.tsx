import Link from 'next/link'

// Placeholder page for creating a new nutrition plan.
// Will be wired to a Server Action once patient data and calculations are live.

interface Step {
  number: number
  title: string
  description: string
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Select patient',
    description:
      'Choose the patient this plan belongs to. Their intake data will be used to pre-fill calculations.',
  },
  {
    number: 2,
    title: 'Review calculations',
    description:
      'Confirm the BMR, TDEE, and macronutrient targets derived from the latest intake.',
  },
  {
    number: 3,
    title: 'Build meals',
    description:
      'Assign food equivalents to each meal slot. Apply a template or build from scratch.',
  },
]

export default function NewPlanPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Link
          href="/dashboard"
          className="text-xs text-stone-400 hover:text-stone-600"
        >
          ← Back to overview
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-stone-900">New plan</h1>
        <p className="mt-1 text-sm text-stone-500">
          Build a nutrition plan from a patient intake or an existing template.
        </p>
      </div>

      {/* Steps overview */}
      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.number}
            className="rounded-xl border border-stone-200 bg-white p-5"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700">
              {step.number}
            </span>
            <h3 className="mt-3 text-sm font-semibold text-stone-900">
              {step.title}
            </h3>
            <p className="mt-1 text-xs text-stone-500">{step.description}</p>
          </div>
        ))}
      </div>

      {/* Form shell */}
      <div className="max-w-lg rounded-xl border border-stone-200 bg-white p-6">
        <div className="space-y-4">
          {/* Plan title */}
          <div>
            <label
              htmlFor="title"
              className="block text-xs font-medium text-stone-700"
            >
              Plan title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="e.g. Weight-loss plan — June 2025"
              disabled
              className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-400 outline-none"
            />
          </div>

          {/* Patient selector */}
          <div>
            <label
              htmlFor="patient_id"
              className="block text-xs font-medium text-stone-700"
            >
              Patient
            </label>
            <select
              id="patient_id"
              name="patient_id"
              disabled
              className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-400 outline-none"
            >
              <option value="">Select a patient</option>
            </select>
          </div>

          {/* Template selector */}
          <div>
            <label
              htmlFor="template_id"
              className="block text-xs font-medium text-stone-700"
            >
              Starting template{' '}
              <span className="text-stone-400">(optional)</span>
            </label>
            <select
              id="template_id"
              name="template_id"
              disabled
              className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-400 outline-none"
            >
              <option value="">None — start from scratch</option>
            </select>
          </div>

          {/* Valid dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="valid_from"
                className="block text-xs font-medium text-stone-700"
              >
                Valid from
              </label>
              <input
                id="valid_from"
                name="valid_from"
                type="date"
                disabled
                className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-400 outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="valid_until"
                className="block text-xs font-medium text-stone-700"
              >
                Valid until
              </label>
              <input
                id="valid_until"
                name="valid_until"
                type="date"
                disabled
                className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-400 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Coming-soon notice */}
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-700">
            Plan creation requires patient data and calculations. Add a patient
            first, then return here to build their plan.
          </p>
        </div>

        {/* Action row */}
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            disabled
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white opacity-40 cursor-not-allowed"
          >
            Create plan
          </button>
          <Link
            href="/dashboard"
            className="text-sm text-stone-500 hover:text-stone-700"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}


