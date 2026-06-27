import Link from 'next/link'

// Note: no <html> or <body> here — the root layout (app/layout.tsx) owns those.
// This is a nested layout that wraps all /dashboard/* routes.

const navLinks = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/patients', label: 'Patients' },
  { href: '/dashboard/plans/new', label: 'Plans' },
  { href: '/dashboard/templates', label: 'Templates' },
  { href: '/dashboard/equivalents', label: 'Equivalents' },
  { href: '/dashboard/settings', label: 'Settings' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-stone-200 bg-white md:flex">
        {/* Brand */}
        <div className="border-b border-stone-200 px-5 py-4">
          <span className="text-sm font-semibold tracking-tight text-teal-700">
            Anthroscope
          </span>
        </div>

        {/* Navigation */}
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

        {/* Footer */}
        <div className="border-t border-stone-200 p-3">
          <Link
            href="/"
            className="block rounded-lg px-3 py-2 text-xs text-stone-400 transition-colors hover:text-stone-600"
          >
            ← Back to home
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-3">
          <p className="text-sm font-medium text-stone-500">Dashboard</p>
          {/* Auth controls will go here in a future step */}
          <div className="h-7 w-7 rounded-full bg-teal-100" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
