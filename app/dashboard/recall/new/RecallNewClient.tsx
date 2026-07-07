"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export type RecallRow = {
  id: string;
  client_name: string | null;
  client_email: string | null;
  token: string;
  recall_type: "24h" | "3day" | "7day";
  status: "pending" | "completed";
  created_at: string;
  completed_at: string | null;
};

const cormorant = {
  fontFamily: "var(--font-cormorant), ui-serif, Georgia, serif",
};

const RECALL_LABELS: Record<string, string> = {
  "24h": "24 horas",
  "3day": "3 días",
  "7day": "7 días",
};

function recallUrl(token: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/recall/${token}`;
  }
  return `https://planbuilder.anthroscope.pro/recall/${token}`;
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

export function RecallNewClient({
  initialRecalls,
  userId,
}: {
  initialRecalls: RecallRow[];
  userId: string | null;
}) {
  const supabase = createClient();
  const [recalls, setRecalls] = useState<RecallRow[]>(initialRecalls);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [recallType, setRecallType] = useState<"24h" | "3day" | "7day">("24h");
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
      .from("dietary_recalls")
      .insert({
        nutritionist_id: userId,
        client_name: clientName.trim() || null,
        client_email: clientEmail.trim() || null,
        recall_type: recallType,
      })
      .select("id, client_name, client_email, token, recall_type, status, created_at, completed_at")
      .single();

    setCreating(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    if (data) {
      setRecalls((prev) => [data as RecallRow, ...prev]);
      setClientName("");
      setClientEmail("");
    }
  }

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(recallUrl(token));
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      alert("No se pudo copiar. Copia manualmente:\n" + recallUrl(token));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este recall?")) return;
    const { error: delErr } = await supabase
      .from("dietary_recalls")
      .delete()
      .eq("id", id);
    if (delErr) {
      alert("Error: " + delErr.message);
      return;
    }
    setRecalls((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-8">
      <div className="rise">
        <Link href="/dashboard/plans" className="text-xs" style={{ color: "var(--ink-subtle)" }}>
          ← Volver
        </Link>
        <p className="eyebrow mt-4" style={{ color: "var(--gold)" }}>
          Recall Dietético
        </p>
        <h1
          className="mt-2"
          style={{ ...cormorant, fontSize: "40px", color: "var(--ink-strong)", letterSpacing: "-0.02em", lineHeight: 1.02 }}
        >
          Recordatorio de alimentación
        </h1>
        <p className="mt-2 max-w-xl text-sm" style={{ color: "var(--ink-muted)" }}>
          Envía un formulario a tu cliente para conocer qué come de forma aproximada.
          Elige entre recordatorio de 24 horas, 3 días o 7 días.
        </p>
      </div>

      <div className="card-luxe max-w-xl space-y-4 p-6 rise rise-1">
        {/* Recall type selector */}
        <div>
          <label className="label">Tipo de recall</label>
          <div className="flex gap-2 mt-1">
            {(["24h", "3day", "7day"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setRecallType(t)}
                className="btn"
                style={
                  recallType === t
                    ? { background: "var(--gold)", color: "#0a0a0a", fontWeight: 700 }
                    : { background: "var(--surface-sunken)", color: "var(--ink-muted)", border: "1px solid #2a2a2a" }
                }
              >
                {RECALL_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Nombre del cliente (opcional)</label>
          <input
            className="input"
            placeholder="Ej. María González"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Email del cliente (opcional)</label>
          <input
            className="input"
            placeholder="Ej. maria@email.com"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
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
          Generar link de recall
        </button>
      </div>

      {/* List of existing recalls */}
      <div className="rise rise-2">
        <p className="eyebrow mb-3" style={{ color: "var(--gold)" }}>
          Recalls enviados
        </p>
        {recalls.length === 0 ? (
          <div className="card-luxe px-5 py-12 text-center text-sm" style={{ color: "var(--ink-subtle)" }}>
            Aún no has generado ningún recall dietético.
          </div>
        ) : (
          <div className="card-luxe overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                  <Th>Cliente</Th>
                  <Th>Tipo</Th>
                  <Th>Estado</Th>
                  <Th>Creado</Th>
                  <Th>Link</Th>
                  <Th> </Th>
                </tr>
              </thead>
              <tbody>
                {recalls.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #1f1f1f" }}>
                    <td className="px-4 py-3" style={{ color: "var(--ink-strong)" }}>
                      {r.client_name || r.client_email || <span style={{ color: "var(--ink-subtle)" }}>Sin nombre</span>}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--ink-muted)" }}>
                      {RECALL_LABELS[r.recall_type]}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide"
                        style={
                          r.status === "completed"
                            ? { background: "rgba(201,169,97,0.15)", color: "var(--gold)", border: "1px solid rgba(201,169,97,0.4)" }
                            : { background: "var(--surface-sunken)", color: "var(--ink-muted)", border: "1px solid #2a2a2a" }
                        }
                      >
                        {r.status === "completed" ? "Completado" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--ink-muted)" }}>
                      {fmt(r.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => copy(r.token)}
                        className="text-xs underline"
                        style={{ color: "var(--gold)" }}
                      >
                        {copied === r.token ? "¡Copiado!" : "Copiar enlace"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {r.status === "completed" && (
                          <Link
                            href={`/dashboard/recall/${r.id}`}
                            className="btn btn-ghost"
                            style={{ padding: "5px 12px", fontSize: "12px" }}
                          >
                            Ver
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          className="btn btn-ghost"
                          style={{ padding: "5px 12px", fontSize: "12px", color: "#fb7185" }}
                        >
                          Eliminar
                        </button>
                      </div>
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
