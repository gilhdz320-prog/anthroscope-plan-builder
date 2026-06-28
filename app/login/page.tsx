import Link from "next/link";
import { login } from "./actions";
import { PoweredByAnthroscope } from "@/components/PoweredByAnthroscope";
import { getLocale, tr } from "@/lib/i18n";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; redirect?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getLocale();

  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-block">
              <p className="eyebrow">{tr("login_eyebrow", locale)}</p>
              <h1
                className="font-display mt-2"
                style={{
                  fontSize: "34px",
                  color: "var(--ink-strong)",
                  letterSpacing: "-0.025em",
                  lineHeight: 1,
                }}
              >
                Anthroscope
              </h1>
            </Link>
            <p
              className="mt-3 text-sm"
              style={{ color: "var(--ink-muted)" }}
            >
              {tr("login_subtitle", locale)}
            </p>
          </div>

          <div className="card-luxe p-8 rise">
            {sp.message && (
              <div
                className="mb-5 rounded-md border p-3 text-xs"
                style={{
                  background: "var(--brand-50)",
                  borderColor: "var(--border-emerald)",
                  color: "var(--brand-700)",
                }}
              >
                {sp.message}
              </div>
            )}
            {sp.error && (
              <div
                className="mb-5 rounded-md border p-3 text-xs"
                style={{
                  background: "var(--danger-bg)",
                  borderColor: "rgba(184,60,42,0.2)",
                  color: "var(--danger)",
                }}
              >
                {sp.error}
              </div>
            )}

            <form action={login} className="space-y-5">
              <input
                type="hidden"
                name="redirect"
                value={sp.redirect ?? "/dashboard"}
              />
              <div>
                <label htmlFor="email" className="label">
                  {tr("email", locale)}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="input"
                  placeholder={tr("login_email_ph", locale)}
                />
              </div>

              <div>
                <label htmlFor="password" className="label">
                  {tr("password", locale)}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  minLength={6}
                  className="input"
                  placeholder="••••••••"
                />
              </div>

              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-xs"
                  style={{ color: "var(--brand-700)" }}
                >
                  {tr("login_forgot", locale)}
                </Link>
              </div>

              <button type="submit" className="btn btn-primary w-full">
                {tr("login_submit", locale)}
              </button>
            </form>

            <p
              className="mt-6 text-center text-xs"
              style={{ color: "var(--ink-muted)" }}
            >
              {tr("login_no_account", locale)}{" "}
              <Link
                href="/signup"
                className="font-display italic"
                style={{ color: "var(--brand-700)" }}
              >
                {tr("login_create_one", locale)}
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <PoweredByAnthroscope />
          </div>
        </div>
      </div>
    </main>
  );
}
