import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/SidebarNav";
import { PoweredByAnthroscope } from "@/components/PoweredByAnthroscope";
import { getLocale, tr } from "@/lib/i18n";

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

  return (
    <div className="flex min-h-screen">
      <aside
        className="hidden w-60 shrink-0 flex-col border-r md:flex"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div
          className="px-5 pt-6 pb-5 border-b"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <Link href="/dashboard" className="block">
            <p className="eyebrow">Plan Builder</p>
            <h2
              className="font-display mt-1.5"
              style={{
                fontSize: "22px",
                color: "var(--ink-strong)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              Anthroscope
            </h2>
          </Link>
        </div>

        <SidebarNav />

        <div
          className="border-t px-3 pt-3 pb-4"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <Link
            href="https://app.anthroscope.pro"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md p-3"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-900) 0%, #0a4736 100%)",
              color: "var(--ink-inverse)",
            }}
          >
            <p
              className="text-[10px] font-medium uppercase tracking-[0.18em]"
              style={{ color: "var(--gold-300)" }}
            >
              Edición completa
            </p>
            <p
              className="font-display mt-1 text-base italic"
              style={{ color: "var(--ink-inverse)" }}
            >
              Descubre Anthroscope →
            </p>
            <p
              className="mt-1 text-[11px] leading-snug"
              style={{ color: "rgba(248,245,238,0.7)" }}
            >
              Antropometría, hidratación, periodización y AI coaching.
            </p>
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header
          className="flex items-center justify-between border-b px-6 py-3"
          style={{
            background: "var(--surface-raised)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <p
            className="text-xs uppercase tracking-[0.18em]"
            style={{ color: "var(--ink-subtle)" }}
          >
            {tr("panel", locale)}
          </p>
          <div className="flex items-center gap-3">
            <span
              className="text-xs"
              style={{ color: "var(--ink-muted)" }}
            >
              {user?.email}
            </span>
            <form action="/logout" method="post">
              <button type="submit" className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: "12px" }}>
                {tr("signOut", locale)}
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-6 py-8 md:px-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>

        <footer
          className="border-t px-6 py-5"
          style={{
            background: "var(--surface-raised)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <PoweredByAnthroscope variant="minimal" className="text-center" />
        </footer>
      </div>
    </div>
  );
}
