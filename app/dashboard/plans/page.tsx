import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deletePlan } from "./actions";

const statusLabel: Record<string, string> = {
  draft: "Borrador",
  active: "Activo",
  archived: "Archivado",
};

export default async function PlansPage() {
  const supabase = await createClient();
  const { data: plans, error } = await supabase
    .from("plans")
    .select(
      "id, title, status, valid_from, valid_until, created_at, patient:patients(first_name, last_name), template:templates(name)",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-6 rise">
        <div>
          <p className="eyebrow">Planes</p>
          <h1
            className="font-display mt-3"
            style={{
              fontSize: "38px",
              color: "var(--ink-strong)",
              letterSpacing: "-0.025em",
              lineHeight: 1.02,
            }}
          >
            Planes de nutrición
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
            Planes que has construido para tus pacientes.
          </p>
        </div>
        <Link href="/dashboard/plans/new" className="btn btn-brand">
          + Nuevo plan
        </Link>
      </div>

      {error && (
        <div
          className="rounded-md border p-3 text-xs"
          style={{
            background: "var(--danger-bg)",
            borderColor: "rgba(184,60,42,0.2)",
            color: "var(--danger)",
          }}
        >
          {error.message}
        </div>
      )}

      {!plans || plans.length === 0 ? (
        <div
          className="card-luxe px-6 py-20 text-center rise rise-1"
          style={{ borderStyle: "dashed" }}
        >
          <p
            className="font-display"
            style={{ fontSize: "22px", color: "var(--ink-strong)" }}
          >
            Aún no hay planes.
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
            Crea tu primer plan de nutrición para un paciente.
          </p>
          <Link href="/dashboard/plans/new" className="btn btn-brand mt-6">
            Crear plan
          </Link>
        </div>
      ) : (
        <div className="card-luxe overflow-hidden rise rise-1" style={{ padding: 0 }}>
          <table className="w-full text-sm">
            <thead
              className="text-left"
              style={{
                background: "var(--surface-sunken)",
                color: "var(--ink-subtle)",
              }}
            >
              <tr>
                <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em]">
                  Título
                </th>
                <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em]">
                  Paciente
                </th>
                <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em]">
                  Plantilla
                </th>
                <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em]">
                  Estado
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-[0.16em]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => {
                const patient = Array.isArray(p.patient) ? p.patient[0] : p.patient;
                const template = Array.isArray(p.template) ? p.template[0] : p.template;
                return (
                  <tr
                    key={p.id}
                    className="border-t transition-colors hover:bg-[var(--surface-sunken)]/50"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/dashboard/plans/${p.id}`}
                        className="font-medium hover:underline"
                        style={{ color: "var(--ink-strong)" }}
                      >
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: "var(--ink-muted)" }}>
                      {patient ? `${patient.first_name} ${patient.last_name}` : "—"}
                    </td>
                    <td className="px-5 py-3.5" style={{ color: "var(--ink-muted)" }}>
                      {template?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="chip">
                        {statusLabel[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <Link
                          href={`/dashboard/plans/${p.id}`}
                          className="text-xs"
                          style={{ color: "var(--brand-700)" }}
                        >
                          Abrir
                        </Link>
                        <form action={deletePlan} className="inline">
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="text-xs"
                            style={{ color: "var(--danger)" }}
                          >
                            Eliminar
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
