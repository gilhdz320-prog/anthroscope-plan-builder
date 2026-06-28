"use client";

import { useState } from "react";
import { PoweredByAnthroscope } from "@/components/PoweredByAnthroscope";

export default function ComprarPage({
  searchParams,
}: {
  searchParams?: { canceled?: string; error?: string };
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canceled = searchParams?.canceled === "1";
  const urlError = searchParams?.error;

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "No se pudo iniciar el pago");
      }
      window.location.href = data.url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          <div className="text-center">
            <p className="eyebrow rise">Acceso unico — De por vida</p>

            <h1
              className="font-display mt-5 rise rise-1"
              style={{
                fontSize: "52px",
                color: "var(--ink-strong)",
                letterSpacing: "-0.03em",
                lineHeight: 1.0,
              }}
            >
              Anthroscope{" "}
              <span className="italic" style={{ color: "var(--brand-700)" }}>
                Plan Builder
              </span>
            </h1>

            <p
              className="mx-auto mt-6 max-w-lg text-base leading-relaxed rise rise-2"
              style={{ color: "var(--ink-muted)" }}
            >
              Tu plan nutricional personalizado, con 224 alimentos USDA
              bilingues, equivalencias mexicanas y PDF descargable. Pago unico,
              acceso de por vida.
            </p>
          </div>

          <div className="card-luxe mt-10 p-8 rise rise-3">
            <div className="flex items-baseline justify-between">
              <div>
                <p
                  className="text-sm uppercase tracking-wider"
                  style={{ color: "var(--ink-muted)" }}
                >
                  Pago unico
                </p>
                <p
                  className="font-display mt-1"
                  style={{
                    fontSize: "56px",
                    color: "var(--ink-strong)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  $57
                  <span
                    style={{
                      fontSize: "18px",
                      color: "var(--ink-muted)",
                      letterSpacing: 0,
                      marginLeft: "6px",
                    }}
                  >
                    USD
                  </span>
                </p>
              </div>
              <div
                className="rounded-full px-3 py-1 text-xs uppercase tracking-wider"
                style={{
                  background: "var(--brand-50)",
                  color: "var(--brand-700)",
                  border: "1px solid var(--brand-200)",
                }}
              >
                De por vida
              </div>
            </div>

            <ul className="mt-7 space-y-3 text-sm">
              {[
                "224 alimentos USDA con equivalencias mexicanas",
                "Calculo automatico de macros y porciones",
                "PDF luxury descargable, listo para imprimir",
                "Codigo de acceso unico enviado por email",
                "Pago seguro procesado por Stripe",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-3"
                  style={{ color: "var(--ink-strong)" }}
                >
                  <span
                    aria-hidden
                    style={{
                      color: "var(--brand-700)",
                      fontSize: "14px",
                      marginTop: "2px",
                    }}
                  >
                    ✦
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="btn-luxe mt-8 w-full"
              style={{
                padding: "16px 24px",
                fontSize: "16px",
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "Redirigiendo a Stripe…" : "Comprar ahora — $57"}
            </button>

            <p
              className="mt-4 text-center text-xs"
              style={{ color: "var(--ink-muted)" }}
            >
              Procesado de forma segura por Stripe. Aceptamos tarjetas de todo
              el mundo.
            </p>

            {canceled && (
              <div
                className="mt-5 rounded-md border px-4 py-3 text-sm"
                style={{
                  borderColor: "#f0d9a8",
                  background: "#fdf6e7",
                  color: "#7a5a14",
                }}
              >
                Cancelaste el pago. Puedes intentarlo de nuevo cuando quieras.
              </div>
            )}

            {urlError && (
              <div
                className="mt-5 rounded-md border px-4 py-3 text-sm"
                style={{
                  borderColor: "#f3c2c2",
                  background: "#fdecec",
                  color: "#7a1414",
                }}
              >
                Error al iniciar el pago: {decodeURIComponent(urlError)}
              </div>
            )}

            {error && (
              <div
                className="mt-5 rounded-md border px-4 py-3 text-sm"
                style={{
                  borderColor: "#f3c2c2",
                  background: "#fdecec",
                  color: "#7a1414",
                }}
              >
                {error}
              </div>
            )}
          </div>

          <p
            className="mt-8 text-center text-xs"
            style={{ color: "var(--ink-muted)" }}
          >
            Tras el pago recibiras un codigo unico de acceso por correo
            electronico para crear tu cuenta.
          </p>
        </div>
      </div>

      <PoweredByAnthroscope />
    </main>
  );
}
