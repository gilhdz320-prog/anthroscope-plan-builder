import Link from 'next/link'
import { createPatient } from '../actions'

export default async function NewPatientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const sp = await searchParams

  const input =
    'mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-teal-500'
  const label = 'block text-xs font-medium text-stone-700'

  return (
    <div className="space-y-6">
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
          Fill in the patient&apos;s information. Only first and last name are
          required.
        </p>
      </div>

      {sp.error && (
        <div className="max-w-2xl rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {sp.error}
        </div>
      )}

      <form
        action={createPatient}
        className="max-w-2xl space-y-6 rounded-xl border border-stone-200 bg-white p-6"
      >
        {/* Basics */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-500">
            Basics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className={label}>
                First name *
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                className={input}
              />
            </div>
            <div>
              <label htmlFor="last_name" className={label}>
                Last name *
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                className={input}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className={label}>
                Email
              </label>
              <input id="email" name="email" type="email" className={input} />
            </div>
            <div>
              <label htmlFor="phone" className={label}>
                Phone
              </label>
              <input id="phone" name="phone" type="tel" className={input} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="birth_date" className={label}>
                Date of birth
              </label>
              <input
                id="birth_date"
                name="birth_date"
                type="date"
                className={input}
              />
            </div>
            <div>
              <label htmlFor="sex" className={label}>
                Sex
              </label>
              <select id="sex" name="sex" className={input}>
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </section>

        {/* Anthropometry */}
        <section className="space-y-4 border-t border-stone-100 pt-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-500">
            Anthropometry (optional)
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="weight_kg" className={label}>
                Weight (kg)
              </label>
              <input
                id="weight_kg"
                name="weight_kg"
                type="number"
                step="0.1"
                className={input}
              />
            </div>
            <div>
              <label htmlFor="height_cm" className={label}>
                Height (cm)
              </label>
              <input
                id="height_cm"
                name="height_cm"
                type="number"
                step="0.1"
                className={input}
              />
            </div>
            <div>
              <label htmlFor="body_fat_pct" className={label}>
                Body fat %
              </label>
              <input
                id="body_fat_pct"
                name="body_fat_pct"
                type="number"
                step="0.1"
                className={input}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="waist_cm" className={label}>
                Waist (cm)
              </label>
              <input
                id="waist_cm"
                name="waist_cm"
                type="number"
                step="0.1"
                className={input}
              />
            </div>
            <div>
              <label htmlFor="hip_cm" className={label}>
                Hip (cm)
              </label>
              <input
                id="hip_cm"
                name="hip_cm"
                type="number"
                step="0.1"
                className={input}
              />
            </div>
          </div>
        </section>

        {/* Sport / activity */}
        <section className="space-y-4 border-t border-stone-100 pt-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-500">
            Sport &amp; activity
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="sport" className={label}>
                Sport
              </label>
              <input
                id="sport"
                name="sport"
                type="text"
                placeholder="Soccer, Track & Field…"
                className={input}
              />
            </div>
            <div>
              <label htmlFor="activity_level" className={label}>
                Activity level
              </label>
              <select id="activity_level" name="activity_level" className={input}>
                <option value="">Select</option>
                <option value="sedentary">Sedentary</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
                <option value="very_active">Very active</option>
              </select>
            </div>
            <div>
              <label htmlFor="goal" className={label}>
                Goal
              </label>
              <select id="goal" name="goal" className={input}>
                <option value="">Select</option>
                <option value="weight_loss">Weight loss</option>
                <option value="maintenance">Maintenance</option>
                <option value="muscle_gain">Muscle gain</option>
                <option value="performance">Performance</option>
              </select>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className="border-t border-stone-100 pt-5">
          <label htmlFor="notes" className={label}>
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Allergies, relevant conditions, context…"
            className={`${input} resize-none`}
          />
        </section>

        <div className="flex items-center gap-3 border-t border-stone-100 pt-5">
          <button
            type="submit"
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
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
      </form>
    </div>
  )
}
