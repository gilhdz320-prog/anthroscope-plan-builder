import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  calculateCalories,
  type ActivityLevel,
  type Goal,
} from "@/lib/caloric-calculator";
import { IntakeResultClient } from "./IntakeResultClient";

export const dynamic = "force-dynamic";

type IntakeForm = {
  id: string;
  client_name: string | null;
  status: string;
  age: number | null;
  sex: "male" | "female" | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: ActivityLevel | null;
  goal: Goal | null;
  has_body_comp: boolean | null;
  body_fat_pct: number | null;
  lean_mass_kg: number | null;
  client_notes: string | null;
  completed_at: string | null;
};

export default async function IntakeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("intake_forms")
    .select(
      "id, client_name, status, age, sex, height_cm, weight_kg, activity_level, goal, has_body_comp, body_fat_pct, lean_mass_kg, client_notes, completed_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const form = data as IntakeForm;

  const ready =
    form.status === "completed" &&
    form.age != null &&
    form.sex != null &&
    form.height_cm != null &&
    form.weight_kg != null &&
    form.activity_level != null &&
    form.goal != null;

  const result = ready
    ? calculateCalories({
        age: form.age!,
        sex: form.sex!,
        height_cm: Number(form.height_cm),
        weight_kg: Number(form.weight_kg),
        activity_level: form.activity_level!,
        goal: form.goal!,
        has_body_comp: Boolean(form.has_body_comp),
        body_fat_pct: form.body_fat_pct ?? undefined,
        lean_mass_kg: form.lean_mass_kg ?? undefined,
      })
    : null;

  return (
    <div className="space-y-8">
      <div className="rise">
        <Link href="/dashboard/intake/new" className="text-xs" style={{ color: "var(--ink-subtle)" }}>
          ← Volver a intakes
        </Link>
        <p className="eyebrow mt-4" style={{ color: "var(--gold)" }}>
          Resultados del intake
        </p>
        <h1
          className="mt-2"
          style={{
            fontFamily: "var(--font-cormorant), ui-serif, Georgia, serif",
            fontSize: "40px",
            color: "var(--ink-strong)",
            letterSpacing: "-0.02em",
            lineHeight: 1.02,
          }}
        >
          {form.client_name || "Cliente sin nombre"}
        </h1>
      </div>

      {!ready || !result ? (
        <div
          className="card-luxe max-w-xl p-6 text-sm rise rise-1"
          style={{ color: "var(--ink-muted)" }}
        >
          Este formulario todavía no ha sido completado por el cliente, o le
          faltan datos para calcular. Comparte el enlace nuevamente si es
          necesario.
        </div>
      ) : (
        <IntakeResultClient
          intakeId={form.id}
          clientName={form.client_name}
          client={{
            age: form.age!,
            sex: form.sex!,
            height_cm: Number(form.height_cm),
            weight_kg: Number(form.weight_kg),
            activity_level: form.activity_level!,
            goal: form.goal!,
            has_body_comp: Boolean(form.has_body_comp),
            body_fat_pct: form.body_fat_pct,
            lean_mass_kg: form.lean_mass_kg,
            client_notes: form.client_notes,
          }}
          result={result}
        />
      )}
    </div>
  );
}
