// Settings page shell.
// Profile editing, locale, and account controls will live here
// once authentication is implemented.

type FieldType = 'text' | 'email' | 'select'

interface Field {
  label: string
  type: FieldType
  placeholder: string
  id: string
}

interface Section {
  title: string
  description: string
  fields: Field[]
}

const sections: Section[] = [
  {
    title: 'Profile',
    description: 'Update your name and display preferences.',
    fields: [
      { label: 'Full name', type: 'text', placeholder: 'Your name', id: 'full_name' },
      { label: 'Email', type: 'email', placeholder: 'you@example.com', id: 'email' },
    ],
  },
  {
    title: 'Preferences',
    description: 'Language and regional settings.',
    fields: [
      { label: 'Language / Idioma', type: 'select', placeholder: '', id: 'locale' },
    ],
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-stone-900">Settings</h1>
        <p className="mt-1 text-sm text-stone-500">
          Manage your profile and account preferences.
        </p>
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div
          key={section.title}
          className="max-w-lg rounded-xl border border-stone-200 bg-white p-6"
        >
          <h2 className="text-sm font-semibold text-stone-900">
            {section.title}
          </h2>
          <p className="mt-0.5 text-xs text-stone-400">{section.description}</p>

          <div className="mt-4 space-y-4">
            {section.fields.map((field) =>
              field.type === 'select' ? (
                <div key={field.id}>
                  <label
                    htmlFor={field.id}
                    className="block text-xs font-medium text-stone-700"
                  >
                    {field.label}
                  </label>
                  <select
                    id={field.id}
                    name={field.id}
                    disabled
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-400 outline-none"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
              ) : (
                <div key={field.id}>
                  <label
                    htmlFor={field.id}
                    className="block text-xs font-medium text-stone-700"
                  >
                    {field.label}
                  </label>
                  <input
                    id={field.id}
                    name={field.id}
                    type={field.type}
                    placeholder={field.placeholder}
                    disabled
                    className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-400 outline-none"
                  />
                </div>
              ),
            )}
          </div>

          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-700">
              Settings editing will be enabled once authentication is
              implemented.
            </p>
          </div>

          <div className="mt-4">
            <button
              type="button"
              disabled
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white opacity-40 cursor-not-allowed"
            >
              Save changes
            </button>
          </div>
        </div>
      ))}

      {/* Danger zone placeholder */}
      <div className="max-w-lg rounded-xl border border-red-100 bg-white p-6">
        <h2 className="text-sm font-semibold text-red-700">Danger zone</h2>
        <p className="mt-0.5 text-xs text-stone-400">
          Account deletion and data export will appear here.
        </p>
        <button
          type="button"
          disabled
          className="mt-4 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-400 cursor-not-allowed"
        >
          Delete account
        </button>
      </div>
    </div>
  )
}
