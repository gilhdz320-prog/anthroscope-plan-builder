import Link from 'next/link'
import { login } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; redirect?: string }>
}) {
  return <LoginFormWrapper searchParamsPromise={searchParams} />
}

async function LoginFormWrapper({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ error?: string; message?: string; redirect?: string }>
}) {
  const sp = await searchParamsPromise
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-teal-700">Anthroscope</h1>
          <p className="mt-1 text-sm text-stone-500">Sign in to your account</p>
        </div>

        {sp.message && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
            {sp.message}
          </div>
        )}
        {sp.error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {sp.error}
          </div>
        )}

        <form action={login} className="space-y-4">
          <input
            type="hidden"
            name="redirect"
            value={sp.redirect ?? '/dashboard'}
          />
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-stone-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-stone-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              minLength={6}
              className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-teal-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-stone-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-teal-700 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
