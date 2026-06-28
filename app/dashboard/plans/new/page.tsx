import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createPlan } from "../actions";
import {
  calculateCalories,
  type ActivityLevel,
  type Goal,
} from "@/lib/caloric-calculator";

type SP = {
  error?: string;
  from_intake?: string;
  template_id?: string;
  mode?: string;
  kcal?: string;
  protein?: string;
  carbs?: string;
  fat?: string;
};

function parseMacros(description: string | null) {
  if (!description) return null;
  const m = description.match(/P\s*(\d+)\s*\/\s*C\s*(\d+)\s*\/\s*[GF]\s*(\d+)/i);
  if (!m) return null;
  return { protein: Number(m[1]), carbs: Number(m[2]), fat: Number(m[3]) };
}

export default async function NewPlanPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
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

  // ---- Prefill from intake or template -------------------------------------
  const planMode = sp.mode === "equivalentes" ? "equivalentes" : "macros";
  let defaultTitle = "";
  let intakeBanner: string | null = null;
  let templateBanner: string | null = null;
  let kcal: number | "" = sp.kcal ? Number(sp.kcal) : "";
  let protein: number | "" = sp.protein ? Number(sp.protein) : "";
  let carbs: number | "" = sp.carbs ? Number(sp.carbs) : "";
  let fat: number | "" = sp.fat ? Number(sp.fat) : "";

  if (sp.from_intake) {
    const { data: intake } = await supabase
      .from("intake_forms")
      .select(
        "client_name, age, sex, height_cm, weight_kg, activity_level, goal, has_body_comp, body_fat_pct, lean_mass_kg",
      )
      .eq("id", sp.from_intake)
      .maybeSingle();

    if (intake) {
      const name = intake.client_name as string | null;
      intakeBanner = `Plan creado a partir del intake de ${name ?? "el cliente"}`;
      if (name) defaultTitle = `Plan — ${name}`;

      // If the macros/kcal were not passed through the URL, compute them.
      if (kcal === "" && intake.age != null && intake.sex && intake.activity_level && intake.goal) {
        const r = calculateCalories({
          age: Number(intake.age),
          sex: intake.sex as "male" | "female",
          height_cm: Number(intake.height_cm),
          weight_kg: Number(intake.weight_kg),
          activity_level: intake.activity_level as ActivityLevel,
          goal: intake.goal as Goal,
          has_body_comp: Boolean(intake.has_body_comp),
          body_fat_pct: intake.body_fat_pct ?? undefined,
          lean_mass_kg: intake.lean_mass_kg ?? undefined,
        });
        kcal = r.target_kcal;
        protein = r.suggested_macros.protein_g;
        carbs = r.suggested_macros.carbs_g;
        fat = r.suggested_macros.fat_g;
      }
    }
  }

  const selectedTemplateId = sp.template_id ?? "";
  if (sp.template_id) {
    const { data: tpl } = await supabase
      .from("templates")
      .select("name, kcal_target, description")
      .eq("id", sp.template_id)
      .maybeSingle();
    if (tpl) {
      templateBanner = `Basado en plantilla: ${tpl.name}`;
      if (!defaultTitle) defaultTitle = `Plan — ${tpl.name}`;
      if (kcal === "" && tpl.kcal_target != null) kcal = Number(tpl.kcal_target);
      const macros = parseMacros(tpl.description as string | null);
      if (macros && protein === "") {
        protein = macros.protein;
        carbs = macros.carbs;
        fat = macros.fat;
      }
    }
  }

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

      {intakeBanner && (
        <div
          className="max-w-xl rounded-md p-3.5 text-sm rise"
          style={{
            background: "rgba(201,169,97,0.1)",
            border: "1px solid var(--gold)",
            color: "var(--gold-soft)",
          }}
        >
          {intakeBanner}
        </div>
      )}

      {templateBanner && (
        <div
          className="max-w-xl rounded-md p-3 text-xs rise"
          style={{
            background: "var(--surface-sunken)",
            border: "1px solid #2a2a2a",
            color: "var(--ink-muted)",
          }}
        >
          {templateBanner}
        </div>
      )}

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
        <input type="hidden" name="plan_mode" value={planMode} />

        <div>
          <label htmlFor="title" className="label">Título del plan *</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={defaultTitle}
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
          <select id="template_id" name="template_id" defaultValue={selectedTemplateId} className="input">
            <option value="">Sin plantilla — desde cero</option>
            {(templates ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.kcal_target ? ` — ${t.kcal_target} kcal` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Target energy + macros (prefilled from intake / template) */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="kcal_target" className="label">Meta (kcal)</label>
            <input id="kcal_target" name="kcal_target" type="number" defaultValue={kcal} className="input" />
          </div>
          <div>
            <label htmlFor="protein_g" className="label">Proteína (g)</label>
            <input id="protein_g" name="protein_g" type="number" defaultValue={protein} className="input" />
          </div>
          <div>
            <label htmlFor="carbs_g" className="label">Carbos (g)</label>
            <input id="carbs_g" name="carbs_g" type="number" defaultValue={carbs} className="input" />
          </div>
          <div>
            <label htmlFor="fat_g" className="label">Grasa (g)</label>
            <input id="fat_g" name="fat_g" type="number" defaultValue={fat} className="input" />
          </div>
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
