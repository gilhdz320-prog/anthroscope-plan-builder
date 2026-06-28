import Link from "next/link";
import { requestReset } from "./actions";
import { PoweredByAnthroscope } from "@/components/PoweredByAnthroscope";
import { getLocale, tr } from "@/lib/i18n";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getLocale();
  const sent = sp.sent === "1";

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
            <p className="mt-3 text-sm" style={{ color: "var(--ink-muted)" }}>
              {tr("forgot_subtitle", locale)}
            </p>
          </div>

          <div className="card-luxe p-8 rise">
            {sent ? (
              <div
                className="rounded-md border p-3 text-xs"
                style={{
                  background: "var(--brand-50)",
                  borderColor: "var(--border-emerald)",
                  color: "var(--brand-700)",
                }}
              >
                {tr("forgot_sent", locale)}
              </div>
            ) : (
              <form action={requestReset} className="space-y-5">
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

                <button type="submit" className="btn btn-primary w-full">
                  {tr("forgot_submit", locale)}
                </button>
              </form>
            )}

            <p
              className="mt-6 text-center text-xs"
              style={{ color: "var(--ink-muted)" }}
            >
              <Link
                href="/login"
                className="font-display italic"
                style={{ color: "var(--brand-700)" }}
              >
                {tr("forgot_back_to_login", locale)}
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
