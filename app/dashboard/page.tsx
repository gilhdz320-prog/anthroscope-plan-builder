// Server Component — no 'use client' needed.
// This page renders without requiring live Supabase data.
// Replace the placeholder counts with real DB queries once auth is wired up.

const stats = [
  {
    label: 'Patients',
    value: '—',
    description: 'Active patients on file',
    href: '/dashboard/patients',
  },
  {
    label: 'Plans',
    value: '—',
    description: 'Nutrition plans created',
    href: '/dashboard/plans',
  },
  {
    label: 'Templates',
    value: '—',
    description: 'Reusable meal templates',
    href: '/dashboard/templates',
  },
  {
    label: 'Equivalents',
    value: '—',
    description: 'Food exchange entries',
    href: '/dashboard/equivalents',
  },
]

const quickLinks = [
  {
    title: 'New patient',
    description: 'Add a patient and start an intake form.',
    href: '/dashboard/patients/new',
    cta: 'Add patient',
  },
  {
    title: 'New plan',
    description: 'Build a nutrition plan from an intake or template.',
    href: '/dashboard/plans/new',
    cta: 'Create plan',
  },
  {
    title: 'Manage templates',
    description: 'Create and edit reusable meal templates.',
    href: '/dashboard/templates',
    cta: 'View templates',
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-stone-900">Overview</h1>
        <p className="mt-1 text-sm text-stone-500">
          Welcome to Anthroscope Plan Builder.
        </p>
      </div>

      {/* Stats grid */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
          At a glance
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <a
              key={stat.label}
              href={stat.href}
              className="group rounded-xl border border-stone-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-sm"
            >
              <p className="text-2xl font-semibold text-stone-900 group-hover:text-teal-700">
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-medium text-stone-700">
                {stat.label}
              </p>
              <p className="mt-0.5 text-xs text-stone-400">{stat.description}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
          Quick actions
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickLinks.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-stone-200 bg-white p-5"
            >
              <h3 className="text-sm font-semibold text-stone-900">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-stone-500">{item.description}</p>
              <a
                href={item.href}
                className="mt-4 inline-block rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white transition hover:bg-teal-800"
              >
                {item.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Setup notice — remove once Supabase is connected */}
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-medium text-amber-800">
          🛠 Setup reminder
        </p>
        <p className="mt-1 text-sm text-amber-700">
          Copy <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">.env.local.example</code> to{' '}
          <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">.env.local</code> and add your
          Supabase URL and anon key. Then run{' '}
          <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">supabase db reset</code> to
          apply the schema and seed data.
        </p>
      </section>
    </div>
  )
}
