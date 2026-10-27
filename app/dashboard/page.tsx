import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ActivationChecklist } from "@/components/dashboard/ActivationChecklist";
import { createDemoPatient } from "./patients/actions";

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

  // "Primera visita" = todavía no tiene pacientes ni planes propios.
  // (Las plantillas y los equivalentes son del sistema, no cuentan.)
  const isFirstRun = (patientsCount ?? 0) === 0 && (plansCount ?? 0) === 0;

  // Estado real para el checklist de activación
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: brand }, { count: pdfCount }] = await Promise.all([
    supabase
      .from("nutritionist_profiles")
      .select("clinic_name, professional_name, logo_url")
      .eq("user_id", user?.id ?? "")
      .maybeSingle(),
    supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("name", "plan_pdf_generated")
      .eq("user_id", user?.id ?? ""),
  ]);

  const brandRow = brand as
    | { clinic_name?: string | null; professional_name?: string | null; logo_url?: string | null }
    | null;

  const hasBrand = Boolean(
    brandRow?.professional_name || brandRow?.clinic_name || brandRow?.logo_url,
  );

  const activationSteps = [
    {
      key: "patient",
      title: "Crea tu primer paciente",
      description: "Con antropometría si la tienes: el cálculo sale solo.",
      href: "/dashboard/patients/new",
      cta: "Crear",
      done: (patientsCount ?? 0) > 0,
    },
    {
      key: "plan",
      title: "Arma su plan de alimentación",
      description: "Con equivalentes SMAE repartidos por comida.",
      href: "/dashboard/plans/new",
      cta: "Armar",
      done: (plansCount ?? 0) > 0,
    },
    {
      key: "pdf",
      title: "Genera el PDF para tu paciente",
      description: "Es lo que se lleva a casa (y lo que te va a vender).",
      href: "/dashboard/plans",
      cta: "Generar",
      done: (pdfCount ?? 0) > 0,
    },
    {
      key: "brand",
      title: "Pon tu marca en el PDF",
      description: "Nombre, cédula y logo: aparece en la cabecera.",
      href: "/dashboard/settings",
      cta: "Agregar",
      done: hasBrand,
    },
  ];

  const stats = [
    {
      label: "Pacientes",
      labelEn: "Patients",
      value: patientsCount ?? 0,
      description: "Pacientes en tu lista",
      href: "/dashboard/patients",
      icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
    },
    {
      label: "Planes",
      labelEn: "Plans",
      value: plansCount ?? 0,
      description: "Planes de nutrición creados",
      href: "/dashboard/plans",
      icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
    },
    {
      label: "Plantillas",
      labelEn: "Templates",
      value: templatesCount ?? 0,
      description: "Plantillas reutilizables",
      href: "/dashboard/templates",
      icon: "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
    },
    {
      label: "Equivalentes",
      labelEn: "Equivalents",
      value: equivalentsCount ?? 0,
      description: "Alimentos en catálogo",
      href: "/dashboard/equivalents",
      icon: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2 M7 2v20 M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7",
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
          className="mt-3"
          style={{
            fontFamily: "var(--font-cormorant), ui-serif, Georgia, serif",
            fontSize: "52px",
            color: "var(--ink-strong)",
            letterSpacing: "-0.02em",
            lineHeight: 1.02,
          }}
        >
        {/* Primera visita (sin pacientes ni planes) ≠ "bienvenido de vuelta". */}
        {isFirstRun ? "Empecemos." : "Bienvenido de vuelta."}
        </h1>
        <p
          className="mt-3 max-w-xl text-base"
          style={{ color: "var(--ink-muted)" }}
        >
          {isFirstRun
            ? "Tu primer plan está a tres pasos: crea un paciente, arma su plan y genera el PDF. Unos 10 minutos."
            : "Tu estudio profesional para construir planes de nutrición de alto nivel."}
        </p>
      </div>

      <ActivationChecklist
        steps={activationSteps}
        extraAction={
          (patientsCount ?? 0) === 0 ? (
            <form action={createDemoPatient}>
              <button type="submit" className="btn btn-ghost">
                Cargar caso de práctica (Ana Pérez)
              </button>
              <p className="mt-2 text-[11px]" style={{ color: "var(--ink-subtle)" }}>
                Crea un paciente de ejemplo con antropometría y un plan con la meta
                de equivalentes ya calculada, para que practiques sin usar datos reales.
              </p>
            </form>
          ) : undefined
        }
      />

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
              <div className="flex items-center justify-between">
                <p
                  className="text-[10px] font-medium uppercase tracking-[0.18em]"
                  style={{ color: "var(--ink-subtle)" }}
                >
                  {stat.label}
                </p>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d={stat.icon} />
                </svg>
              </div>
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
