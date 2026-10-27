import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProgressHistory } from "../progress-actions";
import { PatientProgressClient } from "./PatientProgressClient";
import { deriveMetrics } from "@/lib/anthropometry";

const goalLabel: Record<string, string> = {
  weight_loss: "Pérdida de peso",
  maintenance: "Mantenimiento",
  muscle_gain: "Ganancia muscular",
  performance: "Rendimiento deportivo",
};

const sexLabel: Record<string, string> = {
  female: "Femenino",
  male: "Masculino",
  other: "Otro",
};

function ageFrom(birth: string | null): number | null {
  if (!birth) return null;
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return null;
  return Math.floor((Date.now() - b.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // select("*") en vez de columnas explícitas: así la ficha no se rompe si la
  // migración de medidas ISAK todavía no se aplicó en la base.
  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!patient) {
    notFound();
  }

  const { data: activePlan } = await supabase
    .from("plans")
    .select("id, title, status")
    .eq("patient_id", id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const history = await getProgressHistory(id, 90);

  const age = ageFrom(patient.birth_date);
  const weight =
    patient.weight_kg != null ? Number(patient.weight_kg) : null;

  // Índices derivados (IMC, cintura/cadera, cintura/altura, grasa ISAK/masa magra)
  const metrics = deriveMetrics({
    weightKg: patient.weight_kg,
    heightCm: patient.height_cm,
    waistCm: patient.waist_cm,
    hipCm: patient.hip_cm,
    bodyFatPct: patient.body_fat_pct,
    birthDate: patient.birth_date,
    sex: patient.sex,
    folds: {
      triceps: patient.fold_triceps_mm,
      subscapular: patient.fold_subscapular_mm,
      biceps: patient.fold_biceps_mm,
      iliac: patient.fold_iliac_mm,
      supraspinal: patient.fold_supraspinal_mm,
      abdominal: patient.fold_abdominal_mm,
      thigh: patient.fold_thigh_mm,
      calf: patient.fold_calf_mm,
    },
  });

  // Perímetros capturados (solo se muestran si existen)
  const girths = [
    { label: "Brazo", value: patient.girth_arm_cm },
    { label: "Muslo", value: patient.girth_thigh_cm },
    { label: "Pantorrilla", value: patient.girth_calf_cm },
    { label: "Tórax", value: patient.girth_chest_cm },
  ].filter((girth) => girth.value != null);

  const stats = [
    {
      label: "Peso",
      value: weight != null ? `${weight} kg` : "—",
    },
    ...metrics.map((metric) => ({ label: metric.label, value: metric.value })),
  ];

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

        <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold"
              style={{ border: "2px solid var(--gold)", background: "#1a1a1a", color: "var(--gold)" }}
            >
              {(patient.first_name?.[0] ?? "?").toUpperCase()}
            </div>
            <div>
              <h1
                className="font-display"
                style={{
                  fontSize: "34px",
                  color: "var(--ink-strong)",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.05,
                }}
              >
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
                {[
                  age != null ? `${age} años` : null,
                  patient.sex ? sexLabel[patient.sex] ?? patient.sex : null,
                  patient.sport,
                  patient.goal ? goalLabel[patient.goal] ?? patient.goal : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
            </div>
          </div>

          {activePlan ? (
            <Link href={`/dashboard/plans/${activePlan.id}`} className="btn btn-brand">
              Plan activo: {activePlan.title}
            </Link>
          ) : (
            <Link href="/dashboard/plans/new" className="btn btn-ghost">
              + Crear plan
            </Link>
          )}
        </div>
      </div>

      {/* Current stats */}
      <div className="card-luxe p-6 rise rise-1">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p
                className="text-[10px] uppercase tracking-[0.16em]"
                style={{ color: "var(--ink-subtle)" }}
              >
                {s.label}
              </p>
              <p
                className="font-display mt-2"
                style={{ fontSize: "24px", color: "var(--ink-strong)" }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {girths.length > 0 && (
          <p
            className="mt-5 border-t pt-4 text-[11px]"
            style={{ borderColor: "var(--border-subtle, #2a2a2a)", color: "var(--ink-muted)" }}
          >
            <span style={{ color: "var(--ink-subtle)" }}>Perímetros ISAK:</span>{" "}
            {girths
              .map((girth) => `${girth.label} ${Number(girth.value)} cm`)
              .join(" · ")}
          </p>
        )}
      </div>

      <div className="rise rise-2">
        <PatientProgressClient
          patientId={id}
          patientSex={patient.sex}
          history={history}
        />
      </div>
    </div>
  );
}
