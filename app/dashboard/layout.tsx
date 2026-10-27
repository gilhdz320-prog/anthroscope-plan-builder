import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/SidebarNav";
import { PoweredByAnthroscope } from "@/components/PoweredByAnthroscope";
import { DashboardLangToggle } from "@/components/DashboardLangToggle";
import { getLocale, tr } from "@/lib/i18n";
import { getAccess } from "@/lib/billing/access";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = await getLocale();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const access = await getAccess(supabase, user.id);
  if (!access.hasAccess) {
    redirect("/suscripcion?expired=1");
  }

  let avatarUrl: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    avatarUrl = (profile as { avatar_url?: string | null })?.avatar_url ?? null;
  }

  const initial = (user?.email?.[0] ?? "?").toUpperCase();

  return (
    <div className="dashboard-dark flex min-h-screen">
      <aside
        className="hidden w-60 shrink-0 flex-col md:flex"
        style={{
          background: "#111111",
          borderRight: "1px solid #2a2a2a",
        }}
      >
        <div
          className="px-5 pt-6 pb-5"
          style={{ borderBottom: "1px solid #2a2a2a" }}
        >
          <Link href="/dashboard" className="block">
            <p className="eyebrow" style={{ color: "var(--gold)" }}>
              Plan Builder
            </p>
            <h2
              className="mt-1.5"
              style={{
                fontFamily: "var(--font-cormorant), ui-serif, Georgia, serif",
                fontSize: "26px",
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              Anthroscope
            </h2>
          </Link>
        </div>

        <SidebarNav />

        <div className="px-3 pt-3 pb-4" style={{ borderTop: "1px solid #2a2a2a" }}>
          <Link
            href="https://app.anthroscope.pro"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md p-3"
            style={{
              background:
                "linear-gradient(135deg, #1a1a1a 0%, #0a4736 100%)",
              border: "1px solid rgba(201,169,97,0.25)",
            }}
          >
            <p
              className="text-[10px] font-medium uppercase tracking-[0.18em]"
              style={{ color: "var(--gold)" }}
            >
              Edición completa
            </p>
            <p
              className="mt-1 text-base italic"
              style={{
                fontFamily: "var(--font-cormorant), ui-serif, serif",
                color: "var(--text-primary)",
              }}
            >
              Descubre Anthroscope →
            </p>
            <p
              className="mt-1 text-[11px] leading-snug"
              style={{ color: "var(--text-muted)" }}
            >
              Antropometría, hidratación, periodización y AI coaching.
            </p>
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 flex-col" style={{ background: "#0a0a0a" }}>
        <header
          className="flex items-center justify-between px-6 py-3"
          style={{
            background: "#111111",
            borderBottom: "1px solid #2a2a2a",
          }}
        >
          <p
            className="text-xs uppercase tracking-[0.18em]"
            style={{ color: "var(--text-muted)" }}
          >
            {tr("panel", locale)}
          </p>
          <div className="flex items-center gap-3">
            <DashboardLangToggle />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {user?.email}
            </span>
            <Link
              href="/dashboard/settings"
              aria-label="Perfil"
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full"
              style={{
                border: "2px solid var(--gold)",
                background: "#1a1a1a",
                color: "var(--gold)",
              }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold">{initial}</span>
              )}
            </Link>
            <form action="/logout" method="post">
              <button
                type="submit"
                className="btn btn-ghost"
                style={{ padding: "6px 12px", fontSize: "12px" }}
              >
                {tr("signOut", locale)}
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-6 py-8 md:px-10" style={{ background: "#0a0a0a" }}>
          <div className="mx-auto max-w-6xl">
            {access.kind === "trial" && (
              <div
                className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md px-4 py-3"
                style={{ background: "#1a1a12", border: "1px solid #3a3320" }}
              >
                <p className="text-xs" style={{ color: "#d4b876" }}>
                  Estás en prueba: te quedan {access.trialDaysLeft}{" "}
                  {access.trialDaysLeft === 1 ? "día" : "días"} de acceso completo.
                </p>
                <Link
                  href="/suscripcion"
                  className="rounded-md px-3 py-1.5 text-xs font-semibold"
                  style={{ background: "#c9a961", color: "#111111" }}
                >
                  Activar suscripción
                </Link>
              </div>
            )}

            {access.kind === "past_due" && (
              <div
                className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md px-4 py-3"
                style={{ background: "#1a1212", border: "1px solid #4a2626" }}
              >
                <p className="text-xs" style={{ color: "#e0a3a3" }}>
                  No pudimos cobrar tu suscripción. Te quedan{" "}
                  {access.graceDaysLeft}{" "}
                  {access.graceDaysLeft === 1 ? "día" : "días"} antes de que se
                  pause el acceso.
                </p>
                <Link
                  href="/suscripcion"
                  className="rounded-md px-3 py-1.5 text-xs font-semibold"
                  style={{ background: "#e0a3a3", color: "#111111" }}
                >
                  Actualizar tarjeta
                </Link>
              </div>
            )}

            {children}
          </div>
        </main>

        <footer
          className="px-6 py-5"
          style={{
            background: "#111111",
            borderTop: "1px solid #2a2a2a",
          }}
        >
          <PoweredByAnthroscope variant="minimal" className="text-center" />
        </footer>
      </div>
    </div>
  );
}
