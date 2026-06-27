export default function HomePage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-teal-700">
            Anthroscope Plan Builder
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Build professional nutrition plans faster.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            A focused mini system for nutritionists and coaches to go from intake
            to plan output with calculations, templates, exchanges, and a cleaner workflow.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/dashboard"
              className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-800"
            >
              Open dashboard
            </a>
            <a
              href="/login"
              className="rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
            >
              Login
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}