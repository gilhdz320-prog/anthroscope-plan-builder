import Link from "next/link";
import { createPatient } from "../actions";
import { PatientForm } from "@/components/patients/PatientForm";

export default async function NewPatientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="space-y-8">
      <div className="rise">
        <Link
          href="/dashboard/patients"
          className="text-xs"
          style={{ color: "var(--ink-subtle)" }}
        >
          ← Volver a pacientes
        </Link>
        <p className="eyebrow mt-4">Nuevo paciente</p>
        <h1
          className="font-display mt-2"
          style={{
            fontSize: "36px",
            color: "var(--ink-strong)",
            letterSpacing: "-0.025em",
            lineHeight: 1.02,
          }}
        >
          Crear expediente
        </h1>
        <p className="mt-2 max-w-xl text-sm" style={{ color: "var(--ink-muted)" }}>
          Solo nombre y apellido son obligatorios. El resto es opcional pero ayuda
          a personalizar el plan.
        </p>
      </div>

      <PatientForm
        action={createPatient}
        submitLabel="Guardar paciente"
        error={sp.error}
        cancelHref="/dashboard/patients"
      />
    </div>
  );
}
