import Link from "next/link";
import { updatePassword } from "./actions";
import { PoweredByAnthroscope } from "@/components/PoweredByAnthroscope";
import { createClient } from "@/lib/supabase/server";
import { getLocale, tr } from "@/lib/i18n";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getLocale();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const errorMessage =
    sp.error === "mismatch"
      ? tr("reset_mismatch", locale)
      : sp.error === "invalid_link"
        ? tr("reset_invalid_link", locale)
        : sp.error;

  // No recovery session → the link was invalid/expired or opened directly.
  const linkInvalid = !user;

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
              {tr("reset_subtitle", locale)}
            </p>
          </div>

          <div className="card-luxe p-8 rise">
            {errorMessage && (
              <div
                className="mb-5 rounded-md border p-3 text-xs"
                style={{
                  background: "var(--danger-bg)",
                  borderColor: "rgba(184,60,42,0.2)",
                  color: "var(--danger)",
                }}
              >
                {errorMessage}
              </div>
            )}

            {linkInvalid ? (
              <div className="space-y-5">
                <div
                  className="rounded-md border p-3 text-xs"
                  style={{
                    background: "var(--danger-bg)",
                    borderColor: "rgba(184,60,42,0.2)",
                    color: "var(--danger)",
                  }}
                >
                  {tr("reset_invalid_link", locale)}
                </div>
                <Link
                  href="/forgot-password"
                  className="btn btn-primary w-full"
                >
                  {tr("forgot_submit", locale)}
                </Link>
              </div>
            ) : (
              <form action={updatePassword} className="space-y-5">
                <div>
                  <label htmlFor="password" className="label">
                    {tr("reset_new_password", locale)}
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

                <div>
                  <label htmlFor="confirm_password" className="label">
                    {tr("reset_confirm_password", locale)}
                  </label>
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={6}
                    className="input"
                    placeholder={tr("signup_password_ph", locale)}
                  />
                </div>

                <button type="submit" className="btn btn-primary w-full">
                  {tr("reset_submit", locale)}
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
