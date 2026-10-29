import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PatientForm } from "@/components/patients/PatientForm";
import { updatePatient } from "../../actions";

export default async function EditPatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!patient) notFound();

  return (
    <div className="space-y-8">
      <div className="rise">
        <Link
          href={`/dashboard/patients/${id}`}
          className="text-xs"
          style={{ color: "var(--ink-subtle)" }}
        >
          ← Volver al paciente
        </Link>
        <p className="eyebrow mt-4">Editar paciente</p>
        <h1
          className="font-display mt-2"
          style={{
            fontSize: "36px",
            color: "var(--ink-strong)",
            letterSpacing: "-0.025em",
            lineHeight: 1.02,
          }}
        >
          {patient.first_name} {patient.last_name}
        </h1>
        <p className="mt-2 max-w-xl text-sm" style={{ color: "var(--ink-muted)" }}>
          Corregir datos no borra nada: el historial de progreso y los planes se
          mantienen.
        </p>
      </div>

      <PatientForm
        action={updatePatient}
        defaults={patient as Record<string, unknown>}
        hidden={{ id }}
        submitLabel="Guardar cambios"
        error={sp.error}
        cancelHref={`/dashboard/patients/${id}`}
      />
    </div>
  );
}
