"use client";

import { useState } from "react";
import { createPlanViewToken } from "@/app/dashboard/plans/actions";
import { generateQR, qrToSvg } from "@/lib/qrcode";

const SHARE_HOST = "planbuilder.anthroscope.pro";

export function SharePlanButton({
  planId,
  planTitle,
}: {
  planId: string;
  planTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    setOpen(true);
    if (url || loading) return;
    setLoading(true);
    setError(null);
    const res = await createPlanViewToken(planId);
    setLoading(false);
    if (res.error || !res.token) {
      setError(res.error ?? "No se pudo generar el enlace");
      return;
    }
    const link = `${SHARE_HOST}/plan/${res.token}`;
    setUrl(link);
    try {
      setQrSvg(qrToSvg(generateQR(`https://${link}`), 180, 4));
    } catch {
      setQrSvg(null);
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(`https://${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <>
      <button type="button" onClick={handleShare} className="btn btn-ghost">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Compartir con paciente
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setOpen(false)}
          />
          <div
            className="relative w-full max-w-md rounded-2xl p-6"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <p
              className="font-display"
              style={{ fontSize: 22, color: "var(--ink-strong)", letterSpacing: "-0.02em" }}
            >
              Compartir con paciente
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
              Comparte este enlace o código QR. El paciente podrá ver su plan e
              intercambiar alimentos sin perder sus macros.
            </p>

            {loading && (
              <div className="flex items-center justify-center py-10">
                <span className="spinner" />
              </div>
            )}

            {error && (
              <p className="mt-4 text-sm" style={{ color: "var(--danger, #c0392b)" }}>
                {error}
              </p>
            )}

            {url && (
              <div className="mt-5 space-y-4">
                {qrSvg && (
                  <div className="flex justify-center">
                    <div
                      className="rounded-xl p-3"
                      style={{ background: "#ffffff", border: "1px solid var(--border-subtle)" }}
                      dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                  </div>
                )}
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{ background: "var(--surface-muted)", border: "1px solid var(--border-subtle)" }}
                >
                  <span
                    className="min-w-0 flex-1 truncate font-mono-tabular text-xs"
                    style={{ color: "var(--ink-strong)" }}
                  >
                    {url}
                  </span>
                  <button
                    type="button"
                    onClick={copy}
                    className="shrink-0 rounded-md px-3 py-1.5 text-xs font-medium"
                    style={{ background: "rgba(201,169,97,0.16)", color: "var(--gold-700)" }}
                  >
                    {copied ? "✓ Copiado" : "Copiar"}
                  </button>
                </div>

                {/* WhatsApp: el canal real por el que se manda el plan en México */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Hola, te comparto tu plan de alimentación${
                      planTitle ? ` "${planTitle}"` : ""
                    }: https://${url}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold"
                  style={{ background: "#25D366", color: "#0B2E13" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20.5 3.5A11.8 11.8 0 0 0 12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6A12 12 0 0 0 12 24c6.6 0 12-5.4 12-12 0-3.2-1.3-6.2-3.5-8.5zM12 21.8c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 21.8 12c0 5.4-4.4 9.8-9.8 9.8zm5.4-7.3c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.3 2.4 1 2.9.8 3.4.8.5 0 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.2-.3-.3-.5-.4z" />
                  </svg>
                  Enviar por WhatsApp
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-ghost mt-6 w-full"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
