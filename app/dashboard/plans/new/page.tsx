import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createPlan } from "../actions";

export default async function NewPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: patients }, { data: templates }] = await Promise.all([
    supabase
      .from("patients")
      .select("id, first_name, last_name")
      .order("first_name", { ascending: true }),
    supabase
      .from("templates")
      .select("id, name, kcal_target")
      .order("is_seed", { ascending: false })
      .order("name", { ascending: true }),
  ]);

  const hasPatients = (patients ?? []).length > 0;

  return (
    <div className="space-y-8">
      <div className="rise">
        <Link
          href="/dashboard/plans"
          className="text-xs"
          style={{ color: "var(--ink-subtle)" }}
        >
          ← Volver a planes
        </Link>
        <p className="eyebrow mt-4">Nuevo plan</p>
        <h1
          className="font-display mt-2"
          style={{
            fontSize: "36px",
            color: "var(--ink-strong)",
            letterSpacing: "-0.025em",
            lineHeight: 1.02,
          }}
        >
          Construir plan
        </h1>
        <p
          className="mt-2 max-w-xl text-sm"
          style={{ color: "var(--ink-muted)" }}
        >
          Crea un plan a partir de un paciente y, opcionalmente, una plantilla base.
        </p>
      </div>

      {sp.error && (
        <div
          className="max-w-lg rounded-md border p-3 text-xs"
          style={{
            background: "var(--danger-bg)",
            borderColor: "rgba(184,60,42,0.2)",
            color: "var(--danger)",
          }}
        >
          {sp.error}
        </div>
      )}

      {!hasPatients && (
        <div
          className="max-w-lg rounded-md border p-3 text-xs"
          style={{
            background: "var(--warning-bg)",
            borderColor: "rgba(180,116,36,0.25)",
            color: "var(--warning)",
          }}
        >
          Aún no tienes pacientes.{" "}
          <Link
            href="/dashboard/patients/new"
            className="font-medium underline"
          >
            Agrega uno primero
          </Link>
          .
        </div>
      )}

      <form action={createPlan} className="card-luxe max-w-xl space-y-5 p-8 rise rise-1">
        <div>
          <label htmlFor="title" className="label">Título del plan *</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="Ej. Plan de pérdida de peso — Junio 2026"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="patient_id" className="label">Paciente *</label>
          <select id="patient_id" name="patient_id" required className="input">
            <option value="">Seleccionar paciente</option>
            {(patients ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="template_id" className="label">
            Plantilla inicial <span style={{ color: "var(--ink-subtle)" }}>(opcional)</span>
          </label>
          <select id="template_id" name="template_id" className="input">
            <option value="">Sin plantilla — desde cero</option>
            {(templates ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.kcal_target ? ` — ${t.kcal_target} kcal` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="valid_from" className="label">Vigente desde</label>
            <input id="valid_from" name="valid_from" type="date" className="input" />
          </div>
          <div>
            <label htmlFor="valid_until" className="label">Vigente hasta</label>
            <input id="valid_until" name="valid_until" type="date" className="input" />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="label">Notas</label>
          <textarea id="notes" name="notes" rows={3} className="input resize-none" />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={!hasPatients}
            className="btn btn-brand"
            style={!hasPatients ? { opacity: 0.4, cursor: "not-allowed" } : {}}
          >
            Crear plan
          </button>
          <Link
            href="/dashboard/plans"
            className="text-sm"
            style={{ color: "var(--ink-muted)" }}
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
