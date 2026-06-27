import Link from "next/link";
import { signup } from "./actions";
import { PoweredByAnthroscope } from "@/components/PoweredByAnthroscope";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-block">
              <p className="eyebrow">Plan Builder · Pro</p>
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
              Crea tu cuenta y comienza a construir planes profesionales.
            </p>
          </div>

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
                <label htmlFor="full_name" className="label">
                  Nombre completo
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
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="input"
                  placeholder="tu@correo.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={6}
                  className="input"
                  placeholder="Mínimo 6 caracteres"
                />
                <p
                  className="mt-1.5 text-[11px]"
                  style={{ color: "var(--ink-subtle)" }}
                >
                  Usa al menos 6 caracteres.
                </p>
              </div>

              <button type="submit" className="btn btn-brand w-full">
                Crear cuenta
              </button>
            </form>

            <p
              className="mt-6 text-center text-xs"
              style={{ color: "var(--ink-muted)" }}
            >
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/login"
                className="font-display italic"
                style={{ color: "var(--brand-700)" }}
              >
                Inicia sesión
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
