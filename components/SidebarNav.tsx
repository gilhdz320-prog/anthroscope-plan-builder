"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/dashboard", label: "Vista general", labelEn: "Overview" },
  { href: "/dashboard/patients", label: "Pacientes", labelEn: "Patients" },
  { href: "/dashboard/plans", label: "Planes", labelEn: "Plans" },
  { href: "/dashboard/templates", label: "Plantillas", labelEn: "Templates" },
  { href: "/dashboard/equivalents", label: "Equivalentes", labelEn: "Equivalents" },
  { href: "/dashboard/settings", label: "Ajustes", labelEn: "Settings" },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
      {navLinks.map((link) => {
        const active =
          link.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors"
            style={{
              background: active ? "var(--brand-50)" : "transparent",
              color: active ? "var(--brand-700)" : "var(--ink-muted)",
              fontWeight: active ? 600 : 500,
            }}
          >
            <span className="flex items-center gap-2.5">
              <span
                className="h-1 w-1 rounded-full transition-all"
                style={{
                  background: active ? "var(--brand-600)" : "transparent",
                  transform: active ? "scale(1.4)" : "scale(1)",
                }}
              />
              {link.label}
            </span>
            <span
              className="font-display italic text-[11px] opacity-0 transition-opacity group-hover:opacity-60"
              style={{ color: "var(--ink-subtle)" }}
            >
              {link.labelEn}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
