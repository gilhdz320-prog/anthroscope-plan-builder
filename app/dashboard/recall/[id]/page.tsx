import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const RECALL_LABELS: Record<string, string> = {
  "24h": "24 horas",
  "3day": "3 días",
  "7day": "7 días",
};

const MEAL_LABELS: Record<string, string> = {
  desayuno: "Desayuno",
  colacion_am: "Colación AM",
  comida: "Comida",
  colacion_pm: "Colación PM",
  cena: "Cena",
  agua: "Agua",
  notas: "Notas del día",
};

const cormorant = {
  fontFamily: "var(--font-cormorant), ui-serif, Georgia, serif",
};

export default async function RecallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("dietary_recalls")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return notFound();

  const responses = (data.responses ?? {}) as Record<string, unknown>;
  const days = Object.keys(responses)
    .filter((k) => k.startsWith("day_"))
    .sort();

  return (
    <div className="space-y-8">
      <div className="rise">
        <Link href="/dashboard/recall/new" className="text-xs" style={{ color: "var(--ink-subtle)" }}>
          ← Volver a recalls
        </Link>
        <p className="eyebrow mt-4" style={{ color: "var(--gold)" }}>
          Recall Dietético · {RECALL_LABELS[data.recall_type] || data.recall_type}
        </p>
        <h1
          className="mt-2"
          style={{ ...cormorant, fontSize: "36px", color: "var(--ink-strong)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
        >
          {data.client_name || data.client_email || "Sin nombre"}
        </h1>
        <p className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
          Completado: {data.completed_at ? new Date(data.completed_at).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }) : "—"}
        </p>
      </div>

      {/* Day cards */}
      {days.map((dayKey) => {
        const dayData = responses[dayKey] as Record<string, unknown>;
        return (
          <div key={dayKey} className="card-luxe p-5 rise">
            <h3
              className="mb-3 text-base font-semibold"
              style={{ color: "var(--gold)" }}
            >
              {(dayData?.label as string) || dayKey.replace("_", " ").toUpperCase()}
            </h3>
            <div className="space-y-3">
              {["desayuno", "colacion_am", "comida", "colacion_pm", "cena", "agua", "notas"].map((meal) => {
                const value = dayData?.[meal] as string | undefined;
                if (!value) return null;
                return (
                  <div key={meal}>
                    <p className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: "var(--ink-subtle)" }}>
                      {MEAL_LABELS[meal] || meal}
                    </p>
                    <p className="text-sm whitespace-pre-line" style={{ color: "var(--ink-strong)" }}>
                      {value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Extras */}
      {(responses.tipico || responses.suplementos || responses.notas_generales) && (
        <div className="card-luxe p-5 rise">
          <h3 className="mb-3 text-base font-semibold" style={{ color: "var(--gold)" }}>
            Información adicional
          </h3>
          <div className="space-y-3">
            {responses.tipico && (
              <div>
                <p className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: "var(--ink-subtle)" }}>
                  ¿Fue un día típico?
                </p>
                <p className="text-sm" style={{ color: "var(--ink-strong)" }}>{String(responses.tipico)}</p>
              </div>
            )}
            {responses.suplementos && (
              <div>
                <p className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: "var(--ink-subtle)" }}>
                  Suplementos
                </p>
                <p className="text-sm whitespace-pre-line" style={{ color: "var(--ink-strong)" }}>{String(responses.suplementos)}</p>
              </div>
            )}
            {responses.notas_generales && (
              <div>
                <p className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: "var(--ink-subtle)" }}>
                  Notas generales
                </p>
                <p className="text-sm whitespace-pre-line" style={{ color: "var(--ink-strong)" }}>{String(responses.notas_generales)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
