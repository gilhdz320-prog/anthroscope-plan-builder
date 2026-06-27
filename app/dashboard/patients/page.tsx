import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deletePatient } from "./actions";

const goalLabel: Record<string, string> = {
  weight_loss: "Pérdida de peso",
  maintenance: "Mantenimiento",
  muscle_gain: "Ganancia muscular",
  performance: "Rendimiento",
};

export default async function PatientsPage() {
  const supabase = await createClient();
  const { data: patients, error } = await supabase
    .from("patients")
    .select(
      "id, first_name, last_name, email, sex, birth_date, sport, goal, created_at",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-6 rise">
        <div>
          <p className="eyebrow">Pacientes</p>
          <h1
            className="font-display mt-3"
            style={{
              fontSize: "38px",
              color: "var(--ink-strong)",
              letterSpacing: "-0.025em",
              lineHeight: 1.02,
            }}
          >
            Tus pacientes
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--ink-muted)" }}
          >
            Administra los expedientes de tus pacientes activos.
          </p>
        </div>
        <Link href="/dashboard/patients/new" className="btn btn-brand">
          + Nuevo paciente
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

      {!patients || patients.length === 0 ? (
        <div
          className="card-luxe px-6 py-20 text-center rise rise-1"
          style={{ borderStyle: "dashed" }}
        >
          <p
            className="font-display"
            style={{ fontSize: "22px", color: "var(--ink-strong)" }}
          >
            Aún no hay pacientes.
          </p>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--ink-muted)" }}
          >
            Agrega tu primer paciente para comenzar.
          </p>
          <Link
            href="/dashboard/patients/new"
            className="btn btn-brand mt-6"
          >
            Agregar paciente
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
                  Nombre
                </th>
                <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em]">
                  Correo
                </th>
                <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em]">
                  Deporte
                </th>
                <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em]">
                  Objetivo
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-[0.16em]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr
                  key={p.id}
                  className="border-t transition-colors hover:bg-[var(--surface-sunken)]/50"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <td
                    className="px-5 py-3.5 font-medium"
                    style={{ color: "var(--ink-strong)" }}
                  >
                    {p.first_name} {p.last_name}
                  </td>
                  <td className="px-5 py-3.5" style={{ color: "var(--ink-muted)" }}>
                    {p.email ?? "—"}
                  </td>
                  <td className="px-5 py-3.5" style={{ color: "var(--ink-muted)" }}>
                    {p.sport ?? "—"}
                  </td>
                  <td className="px-5 py-3.5" style={{ color: "var(--ink-muted)" }}>
                    {p.goal ? goalLabel[p.goal] ?? p.goal : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <form action={deletePatient} className="inline">
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="text-xs transition-colors"
                        style={{ color: "var(--danger)" }}
                      >
                        Eliminar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
