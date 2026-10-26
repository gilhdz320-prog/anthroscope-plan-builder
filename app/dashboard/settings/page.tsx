import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AvatarUpload } from "@/components/AvatarUpload";
import { NutritionistProfileForm } from "@/components/NutritionistProfileForm";
import { getProfile } from "./profile-actions";
import { getAccess } from "@/lib/billing/access";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(user.id) : null;
  const access = user ? await getAccess(supabase, user.id) : null;

  const accessLabel = (() => {
    if (!access) return "—";
    if (access.kind === "legacy") return "Acceso de por vida (compra original)";
    if (access.kind === "active") return "Suscripción activa";
    if (access.kind === "trial")
      return `Prueba — ${access.trialDaysLeft} ${access.trialDaysLeft === 1 ? "día" : "días"} restantes`;
    if (access.kind === "past_due")
      return `Pago rechazado — ${access.graceDaysLeft} ${access.graceDaysLeft === 1 ? "día" : "días"} de gracia`;
    return "Sin acceso";
  })();

  return (
    <div className="space-y-10">
      <div className="rise">
        <p className="eyebrow">Ajustes</p>
        <h1
          className="font-display mt-3"
          style={{
            fontSize: "38px",
            color: "var(--ink-strong)",
            letterSpacing: "-0.025em",
            lineHeight: 1.02,
          }}
        >
          Tu cuenta
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
          Administra tu perfil, marca y preferencias.
        </p>
      </div>

      {/* Profile */}
      <section className="card-luxe max-w-2xl p-7 rise rise-1">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Perfil</p>
          <span
            className="font-display italic text-xs"
            style={{ color: "var(--ink-subtle)" }}
          >
            Profile
          </span>
        </div>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
          Tu información de cuenta.
        </p>

        {user && <AvatarUpload userId={user.id} />}

        <div className="mt-5 space-y-4">
          <div>
            <label className="label">Correo</label>
            <input
              type="email"
              defaultValue={user?.email ?? ""}
              disabled
              className="input"
              style={{ background: "var(--surface-sunken)", color: "var(--ink-muted)" }}
            />
          </div>
          <div>
            <label className="label">Idioma</label>
            <select className="input" defaultValue="es" disabled style={{ background: "var(--surface-sunken)" }}>
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
            <p className="mt-1.5 text-[11px]" style={{ color: "var(--ink-subtle)" }}>
              Detección automática por navegador.
            </p>
          </div>
        </div>
      </section>

      {/* Nutritionist branding profile — powers the PDF */}
      <section className="card-luxe max-w-2xl p-7 rise rise-2">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Perfil profesional</p>
          <span
            className="font-display italic text-xs"
            style={{ color: "var(--ink-subtle)" }}
          >
            Practice profile
          </span>
        </div>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
          Estos datos aparecen en el encabezado, pie y marca de tus PDFs.
        </p>

        <NutritionistProfileForm profile={profile} />
      </section>

      {/* Brand / logo upload */}
      <section className="card-luxe max-w-2xl p-7 rise rise-2">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Marca</p>
          <span
            className="font-display italic text-xs"
            style={{ color: "var(--ink-subtle)" }}
          >
            Branding
          </span>
        </div>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
          Agrega tu logotipo. Aparecerá en los PDFs que generes.
        </p>

        <div
          className="mt-5 flex items-center gap-5 rounded-lg border-2 border-dashed p-6"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div
            className="flex h-20 w-20 items-center justify-center rounded-md"
            style={{
              background: "var(--surface-sunken)",
              color: "var(--ink-subtle)",
            }}
          >
            <span className="font-display italic text-sm">Logo</span>
          </div>
          <div className="flex-1">
            <p
              className="font-display"
              style={{ fontSize: "17px", color: "var(--ink-strong)" }}
            >
              Sube tu logotipo
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
              PNG o SVG, fondo transparente recomendado.
            </p>
          </div>
          <button type="button" disabled className="btn btn-ghost" style={{ opacity: 0.5, cursor: "not-allowed" }}>
            Subir
          </button>
        </div>
      </section>

      {/* Suscripción */}
      <section className="card-luxe max-w-2xl p-7 rise rise-2">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Suscripción</p>
          <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
            {accessLabel}
          </span>
        </div>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
          Cambia tu tarjeta, descarga facturas o cancela cuando quieras. Sin
          contratos forzosos.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/suscripcion" className="btn btn-ghost">
            Gestionar suscripción
          </Link>
          <Link href="/suscripcion" className="btn btn-ghost">
            Ver planes
          </Link>
        </div>
      </section>

      {/* Exportar datos */}
      <section className="card-luxe max-w-2xl p-7 rise rise-3">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Tus datos</p>
          <span className="text-xs" style={{ color: "var(--ink-subtle)" }}>
            Exportación
          </span>
        </div>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
          Tus pacientes y planes son tuyos. Descárgalos cuando quieras; sirven
          para respaldo o para migrar a otro sistema.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/api/export/patients" download className="btn btn-ghost">
            Pacientes (CSV)
          </a>
          <a href="/api/export/plans" download className="btn btn-ghost">
            Planes (CSV)
          </a>
          <a href="/api/export/all" download className="btn btn-ghost">
            Todo (JSON)
          </a>
        </div>
        <p className="mt-3 text-[11px]" style={{ color: "var(--ink-subtle)" }}>
          El CSV abre directo en Excel. El JSON es el respaldo completo
          (pacientes, planes, comidas, plantillas).
        </p>
      </section>

      {/* Upgrade CTA */}
      <section
        className="rise rise-3 relative overflow-hidden rounded-2xl p-8 max-w-2xl"
        style={{
          background: "linear-gradient(135deg, var(--ink-strong) 0%, var(--brand-900) 100%)",
          color: "var(--ink-inverse)",
        }}
      >
        <div
          className="absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, var(--gold-500) 0%, transparent 70%)",
          }}
        />
        <p
          className="text-[10px] font-medium uppercase tracking-[0.22em]"
          style={{ color: "var(--gold-300)" }}
        >
          Edición completa
        </p>
        <h2
          className="font-display mt-3"
          style={{ fontSize: "30px", letterSpacing: "-0.025em", lineHeight: 1.05 }}
        >
          Lleva tu práctica al siguiente nivel con{" "}
          <span className="italic" style={{ color: "var(--gold-300)" }}>
            Anthroscope
          </span>
          .
        </h2>
        <p className="mt-3 text-sm" style={{ color: "rgba(248,245,238,0.78)", maxWidth: "520px" }}>
          Antropometría, periodización, hidratación, evaluaciones avanzadas y AI coaching.
          Diseñado para nutriólogos, dietistas y entrenadores de élite.
        </p>
        <Link
          href="https://app.anthroscope.pro"
          target="_blank"
          rel="noopener noreferrer"
          className="btn mt-6"
          style={{
            background: "var(--gold-500)",
            color: "var(--ink-strong)",
            fontWeight: 600,
          }}
        >
          Descubrir Anthroscope →
        </Link>
      </section>
    </div>
  );
}
