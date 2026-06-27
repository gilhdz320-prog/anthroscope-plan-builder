import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: patientsCount },
    { count: plansCount },
    { count: templatesCount },
    { count: equivalentsCount },
  ] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }),
    supabase.from('plans').select('*', { count: 'exact', head: true }),
    supabase.from('templates').select('*', { count: 'exact', head: true }),
    supabase.from('equivalents').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    {
      label: 'Patients',
      value: patientsCount ?? 0,
      description: 'Active patients on file',
      href: '/dashboard/patients',
    },
    {
      label: 'Plans',
      value: plansCount ?? 0,
      description: 'Nutrition plans created',
      href: '/dashboard/plans',
    },
    {
      label: 'Templates',
      value: templatesCount ?? 0,
      description: 'Reusable meal templates',
      href: '/dashboard/templates',
    },
    {
      label: 'Equivalents',
      value: equivalentsCount ?? 0,
      description: 'Food exchange entries',
      href: '/dashboard/equivalents',
    },
  ]

  const quickLinks = [
    {
      title: 'New patient',
      description: 'Add a patient and start their record.',
      href: '/dashboard/patients/new',
      cta: 'Add patient',
    },
    {
      title: 'New plan',
      description: 'Build a nutrition plan from a patient and template.',
      href: '/dashboard/plans/new',
      cta: 'Create plan',
    },
    {
      title: 'Browse templates',
      description: 'Review seed and custom meal templates.',
      href: '/dashboard/templates',
      cta: 'View templates',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-stone-900">Overview</h1>
        <p className="mt-1 text-sm text-stone-500">
          Welcome to Anthroscope Plan Builder.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
          At a glance
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link
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
              <p className="mt-0.5 text-xs text-stone-400">
                {stat.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

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
              <Link
                href={item.href}
                className="mt-4 inline-block rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white transition hover:bg-teal-800"
              >
                {item.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
