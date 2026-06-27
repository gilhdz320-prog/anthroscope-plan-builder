import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: patientsCount },
    { count: plansCount },
    { count: templatesCount },
    { count: equivalentsCount },
  ] = await Promise.all([
    supabase.from("patients").select("*", { count: "exact", head: true }),
    supabase.from("plans").select("*", { count: "exact", head: true }),
    supabase.from("templates").select("*", { count: "exact", head: true }),
    supabase.from("equivalents").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      label: "Pacientes",
      labelEn: "Patients",
      value: patientsCount ?? 0,
      description: "Pacientes en tu lista",
      href: "/dashboard/patients",
    },
    {
      label: "Planes",
      labelEn: "Plans",
      value: plansCount ?? 0,
      description: "Planes de nutrición creados",
      href: "/dashboard/plans",
    },
    {
      label: "Plantillas",
      labelEn: "Templates",
      value: templatesCount ?? 0,
      description: "Plantillas reutilizables",
      href: "/dashboard/templates",
    },
    {
      label: "Equivalentes",
      labelEn: "Equivalents",
      value: equivalentsCount ?? 0,
      description: "Alimentos en catálogo",
      href: "/dashboard/equivalents",
    },
  ];

  const quickLinks = [
    {
      title: "Nuevo paciente",
      titleEn: "New patient",
      description: "Agrega un paciente y crea su expediente.",
      href: "/dashboard/patients/new",
      cta: "Crear paciente",
      variant: "brand" as const,
    },
    {
      title: "Nuevo plan",
      titleEn: "New plan",
      description: "Construye un plan a partir de un paciente y plantilla.",
      href: "/dashboard/plans/new",
      cta: "Crear plan",
      variant: "primary" as const,
    },
    {
      title: "Ver plantillas",
      titleEn: "Templates",
      description: "Revisa plantillas iniciales y personalizadas.",
      href: "/dashboard/templates",
      cta: "Ver plantillas",
      variant: "ghost" as const,
    },
  ];

  return (
    <div className="space-y-12">
      <div className="rise">
        <p className="eyebrow">Vista general</p>
        <h1
          className="font-display mt-3"
          style={{
            fontSize: "44px",
            color: "var(--ink-strong)",
            letterSpacing: "-0.025em",
            lineHeight: 1.02,
          }}
        >
          Bienvenido de vuelta.
        </h1>
        <p
          className="mt-3 max-w-xl text-base"
          style={{ color: "var(--ink-muted)" }}
        >
          Tu estudio profesional para construir planes de nutrición de alto nivel.
        </p>
      </div>

      <section className="rise rise-1">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="eyebrow">A primera vista</p>
          <span
            className="font-display italic text-xs"
            style={{ color: "var(--ink-subtle)" }}
          >
            At a glance
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="card-luxe group block p-6"
            >
              <p
                className="text-[10px] font-medium uppercase tracking-[0.18em]"
                style={{ color: "var(--ink-subtle)" }}
              >
                {stat.label}
              </p>
              <p className="stat-num mt-3">{stat.value}</p>
              <p
                className="mt-2 text-xs"
                style={{ color: "var(--ink-muted)" }}
              >
                {stat.description}
              </p>
              <div
                className="mt-4 h-px w-8 transition-all group-hover:w-16"
                style={{ background: "var(--brand-600)" }}
              />
            </Link>
          ))}
        </div>
      </section>

      <section className="rise rise-2">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="eyebrow">Acciones rápidas</p>
          <span
            className="font-display italic text-xs"
            style={{ color: "var(--ink-subtle)" }}
          >
            Quick actions
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {quickLinks.map((item) => (
            <div key={item.title} className="card-luxe flex flex-col p-6">
              <h3
                className="font-display"
                style={{
                  fontSize: "22px",
                  color: "var(--ink-strong)",
                  letterSpacing: "-0.015em",
                }}
              >
                {item.title}
              </h3>
              <p
                className="mt-2 flex-1 text-sm leading-relaxed"
                style={{ color: "var(--ink-muted)" }}
              >
                {item.description}
              </p>
              <Link
                href={item.href}
                className={`btn btn-${item.variant} mt-5 self-start`}
              >
                {item.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
