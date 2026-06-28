"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export type IntakeRow = {
  id: string;
  client_name: string | null;
  token: string;
  status: "pending" | "completed";
  created_at: string;
  completed_at: string | null;
};

const cormorant = {
  fontFamily: "var(--font-cormorant), ui-serif, Georgia, serif",
};

function intakeUrl(token: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/intake/${token}`;
  }
  return `https://planbuilder.anthroscope.pro/intake/${token}`;
}

function fmt(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

export function IntakeNewClient({
  initialForms,
  userId,
}: {
  initialForms: IntakeRow[];
  userId: string | null;
}) {
  const supabase = createClient();
  const [forms, setForms] = useState<IntakeRow[]>(initialForms);
  const [clientName, setClientName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleCreate() {
    if (!userId) {
      setError("Sesión no válida.");
      return;
    }
    setCreating(true);
    setError(null);
    const { data, error: insErr } = await supabase
      .from("intake_forms")
      .insert({
        nutritionist_id: userId,
        client_name: clientName.trim() || null,
      })
      .select("id, client_name, token, status, created_at, completed_at")
      .single();
    setCreating(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    if (data) {
      setForms((prev) => [data as IntakeRow, ...prev]);
      setClientName("");
    }
  }

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(intakeUrl(token));
      setCopied(token);
      setTimeout(() => setCopied((c) => (c === token ? null : c)), 2000);
    } catch {
      setError("No se pudo copiar al portapapeles.");
    }
  }

  return (
    <div className="space-y-8">
      <div className="rise">
        <Link href="/dashboard/plans" className="text-xs" style={{ color: "var(--ink-subtle)" }}>
          ← Volver
        </Link>
        <p className="eyebrow mt-4" style={{ color: "var(--gold)" }}>
          Intake del cliente
        </p>
        <h1
          className="mt-2"
          style={{ ...cormorant, fontSize: "40px", color: "var(--ink-strong)", letterSpacing: "-0.02em", lineHeight: 1.02 }}
        >
          Generar link de intake
        </h1>
        <p className="mt-2 max-w-xl text-sm" style={{ color: "var(--ink-muted)" }}>
          Crea un enlace para que tu cliente complete sus datos. Con sus
          respuestas calcularemos sus calorías y macros automáticamente.
        </p>
      </div>

      <div className="card-luxe max-w-xl space-y-4 p-6 rise rise-1">
        <div>
          <label className="label">Nombre del cliente (opcional)</label>
          <input
            className="input"
            placeholder="Ej. María González"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>
        {error && (
          <p className="text-xs" style={{ color: "#fb7185" }}>
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="btn btn-brand"
          style={{ opacity: creating ? 0.6 : 1 }}
        >
          {creating && <span className="spinner" />}
          Generar link de intake
        </button>
      </div>

      <div className="rise rise-2">
        <p className="eyebrow mb-3" style={{ color: "var(--gold)" }}>
          Formularios enviados
        </p>
        {forms.length === 0 ? (
          <div className="card-luxe px-5 py-12 text-center text-sm" style={{ color: "var(--ink-subtle)" }}>
            Aún no has generado ningún intake.
          </div>
        ) : (
          <div className="card-luxe overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                  <Th>Cliente</Th>
                  <Th>Estado</Th>
                  <Th>Creado</Th>
                  <Th>Link</Th>
                  <Th> </Th>
                </tr>
              </thead>
              <tbody>
                {forms.map((f) => (
                  <tr key={f.id} style={{ borderBottom: "1px solid #1f1f1f" }}>
                    <td className="px-4 py-3" style={{ color: "var(--ink-strong)" }}>
                      {f.client_name || <span style={{ color: "var(--ink-subtle)" }}>Sin nombre</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide"
                        style={
                          f.status === "completed"
                            ? { background: "rgba(201,169,97,0.15)", color: "var(--gold)", border: "1px solid rgba(201,169,97,0.4)" }
                            : { background: "var(--surface-sunken)", color: "var(--ink-muted)", border: "1px solid #2a2a2a" }
                        }
                      >
                        {f.status === "completed" ? "Completado" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--ink-muted)" }}>
                      {fmt(f.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => copy(f.token)}
                        className="text-xs underline"
                        style={{ color: "var(--gold)" }}
                      >
                        {copied === f.token ? "¡Copiado!" : "Copiar enlace"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {f.status === "completed" && (
                        <Link
                          href={`/dashboard/intake/${f.id}`}
                          className="btn btn-ghost"
                          style={{ padding: "5px 12px", fontSize: "12px" }}
                        >
                          Ver resultados
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.14em]"
      style={{ color: "var(--ink-subtle)" }}
    >
      {children}
    </th>
  );
}
