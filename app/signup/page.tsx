import Link from "next/link";
import { signup } from "./actions";
import { PoweredByAnthroscope } from "@/components/PoweredByAnthroscope";
import { getLocale, tr } from "@/lib/i18n";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string; from?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getLocale();
  const prefillCode = sp.code ?? "";
  const fromStripe = sp.from === "stripe";

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
              {tr("signup_subtitle", locale)}
            </p>
          </div>

          {fromStripe && (
            <div
              className="mb-5 rounded-md border p-3 text-xs rise"
              style={{
                background: "var(--brand-50)",
                borderColor: "var(--border-emerald)",
                color: "var(--brand-700)",
              }}
            >
              {tr("signup_from_stripe", locale)}
            </div>
          )}

          <div className="card-luxe p-8 rise">
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

            <form action={signup} className="space-y-5">
              <div>
                <label htmlFor="access_code" className="label">
                  {tr("signup_access_code", locale)}
                </label>
                <input
                  id="access_code"
                  name="access_code"
                  type="text"
                  required
                  defaultValue={prefillCode}
                  placeholder="APB-XXXX-XXXX-XXXX"
                  autoComplete="off"
                  className="input"
                  style={{
                    fontFamily: "var(--font-jetbrains), monospace",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                />
                <p
                  className="mt-1.5 text-[11px]"
                  style={{ color: "var(--ink-subtle)" }}
                >
                  {tr("signup_access_hint_pre", locale)}{" "}
                  <Link
                    href="https://anthroscope.pro/recursos"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--brand-700)" }}
                  >
                    {tr("signup_access_hint_link", locale)}
                  </Link>
                </p>
              </div>

              <div>
                <label htmlFor="full_name" className="label">
                  {tr("signup_full_name", locale)}
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  className="input"
                  placeholder="Gilbert Hernandez"
                />
              </div>

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
                  autoComplete="new-password"
                  minLength={6}
                  className="input"
                  placeholder={tr("signup_password_ph", locale)}
                />
              </div>

              <button type="submit" className="btn btn-brand w-full">
                {tr("signup_submit", locale)}
              </button>
            </form>

            <p
              className="mt-6 text-center text-xs"
              style={{ color: "var(--ink-muted)" }}
            >
              {tr("signup_have_account", locale)}{" "}
              <Link
                href="/login"
                className="font-display italic"
                style={{ color: "var(--brand-700)" }}
              >
                {tr("signup_sign_in", locale)}
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
