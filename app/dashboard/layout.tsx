import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const navLinks = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/patients', label: 'Patients' },
  { href: '/dashboard/plans', label: 'Plans' },
  { href: '/dashboard/templates', label: 'Templates' },
  { href: '/dashboard/equivalents', label: 'Equivalents' },
  { href: '/dashboard/settings', label: 'Settings' },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen bg-stone-50">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-stone-200 bg-white md:flex">
        <div className="border-b border-stone-200 px-5 py-4">
          <span className="text-sm font-semibold tracking-tight text-teal-700">
            Anthroscope
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-stone-200 p-3">
          <Link
            href="/"
            className="block rounded-lg px-3 py-2 text-xs text-stone-400 transition-colors hover:text-stone-600"
          >
            ← Back to home
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-3">
          <p className="text-sm font-medium text-stone-500">Dashboard</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-500">{user?.email}</span>
            <form action="/logout" method="post">
              <button
                type="submit"
                className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-100"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
