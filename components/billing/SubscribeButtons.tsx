"use client";

import { useState } from "react";

type Props = {
  /** null si no hay sesión: entonces solo mostramos el CTA de registro. */
  isLoggedIn: boolean;
  hasSubscription: boolean;
};

type Plan = "monthly" | "annual";

async function postJson(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
    loginUrl?: string;
  };
  if (!res.ok) throw new Error(data.error ?? "No se pudo completar la operación.");
  return data;
}

export function SubscribeButtons({ isLoggedIn, hasSubscription }: Props) {
  const [loading, setLoading] = useState<Plan | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: Plan) {
    setError(null);
    setLoading(plan);
    try {
      if (!isLoggedIn) {
        window.location.href = `/signup?plan=${plan}`;
        return;
      }
      const { url } = await postJson("/api/checkout", { interval: plan });
      if (url) window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      if (message.toLowerCase().includes("sesión")) {
        window.location.href = "/login?redirect=/suscripcion";
        return;
      }
      setError(message);
    } finally {
      setLoading(null);
    }
  }

  async function openPortal() {
    setError(null);
    setLoading("portal");
    try {
      const { url } = await postJson("/api/stripe/portal");
      if (url) window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => startCheckout("monthly")}
          disabled={loading !== null}
          className="btn btn-primary flex-1"
        >
          {loading === "monthly" ? "Abriendo pago…" : "Empezar — $199 MXN/mes"}
        </button>
        <button
          type="button"
          onClick={() => startCheckout("annual")}
          disabled={loading !== null}
          className="btn btn-ghost flex-1"
        >
          {loading === "annual" ? "Abriendo pago…" : "Anual — $1,990 MXN"}
        </button>
      </div>

      {hasSubscription && (
        <button
          type="button"
          onClick={openPortal}
          disabled={loading !== null}
          className="text-xs underline underline-offset-4"
          style={{ color: "var(--ink-muted)" }}
        >
          {loading === "portal"
            ? "Abriendo portal…"
            : "Gestionar mi suscripción (tarjeta, facturas, cancelar)"}
        </button>
      )}

      {error && (
        <p className="text-xs" style={{ color: "#9B2C2C" }}>
          {error}
        </p>
      )}

      <p className="text-[11px]" style={{ color: "var(--ink-subtle)" }}>
        14 días de prueba incluidos si es tu primera suscripción. Sin contrato
        forzoso: cancelas cuando quieras desde el portal.
      </p>
    </div>
  );
}
