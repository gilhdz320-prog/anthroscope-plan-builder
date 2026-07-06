import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  EquivalentesEditor,
  type PlanEquivalentesData,
  type PlanMode,
} from "@/components/EquivalentesEditor";
import { SharePlanButton } from "@/components/SharePlanButton";
import { SaveAsTemplateButton } from "@/components/SaveAsTemplateButton";
import { MealBuilder, type MealItem } from "@/components/MealBuilder";
import type { FoodSearchItem } from "@/components/FoodSearch";
import { ClinicToggle, type ClinicData, type ClinicFoodOption } from "./PlanClinicView";
import { CLINICAL_TO_DB_GROUPS } from "@/lib/food-groups";
import { GRUPO_KEYS, type GrupoKey } from "@/lib/equivalentes";

const statusLabel: Record<string, string> = {
  draft: "Borrador",
  active: "Activo",
  archived: "Archivado",
};

const goalLabel: Record<string, string> = {
  weight_loss: "Pérdida de peso",
  maintenance: "Mantenimiento",
  muscle_gain: "Ganancia muscular",
  performance: "Rendimiento",
};

const sexLabel: Record<string, string> = {
  female: "Femenino",
  male: "Masculino",
  other: "Otro",
};

function fmt(d: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

function ageFrom(birth: string | null) {
  if (!birth) return null;
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return null;
  return Math.floor(
    (Date.now() - b.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
}

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("plans")
    .select(
      `
      id, title, status, valid_from, valid_until, notes, created_at, plan_mode, equivalentes, template_id,
      patient:patients (
        id, first_name, last_name, sex, birth_date, sport, goal, weight_kg, height_cm, body_fat_pct
      ),
      template:templates ( name )
    `,
    )
    .eq("id", id)
    .single();

  if (!plan) {
    notFound();
  }

  // Auto-clone template_meals into plan_meals on first load if the plan was
  // created from a template but has no meals yet (handles redirect-interrupted server actions).
  const planTemplateId = (plan as unknown as { template_id?: string | null }).template_id;
  if (planTemplateId) {
    const { count: existingMealsCount } = await supabase
      .from('plan_meals')
      .select('id', { count: 'exact', head: true })
      .eq('plan_id', id);
    if (!existingMealsCount || existingMealsCount === 0) {
      try {
        const admin = createAdminClient();
        const { data: tplMeals } = await admin
          .from('template_meals')
          .select('meal_name, meal_order, equivalent_id, servings, notes')
          .eq('template_id', planTemplateId)
          .order('meal_order', { ascending: true });
        if (tplMeals && tplMeals.length > 0) {
          await admin.from('plan_meals').insert(
            tplMeals.map((m) => ({
              plan_id: id,
              meal_name: m.meal_name,
              meal_order: m.meal_order,
              equivalent_id: m.equivalent_id ?? null,
              servings: m.servings ?? 1,
              notes: m.notes ?? null,
            }))
          );
        }
      } catch (_cloneErr) {
        // Non-fatal — plan still renders without pre-loaded meals
      }
    }
  }

  const { data: meals } = await supabase
    .from("plan_meals")
    .select(
      `
      id, meal_name, meal_order, servings, notes, equivalent_id,
      equivalent:equivalents (
        food_name, food_name_es, food_name_en,
        serving_desc, serving_desc_es, serving_desc_en,
        kcal, protein_g, carbs_g, fat_g
      )
    `,
    )
    .eq("plan_id", id)
    .order("meal_order", { ascending: true });

  // Food catalog (system foods + this nutritionist's own) for the meal builder.
  const { data: catalog } = await supabase
    .from("equivalents")
    .select(
      "id, group_key, food_name_es, food_name_en, serving_desc_es, serving_desc_en, kcal, protein_g, carbs_g, fat_g",
    )
    .order("group_key", { ascending: true })
    .order("food_name_es", { ascending: true });

  const foods: FoodSearchItem[] = (catalog ?? []).map((f) => ({
    id: f.id as string,
    es: (f.food_name_es as string) ?? (f.food_name_en as string) ?? "",
    en: (f.food_name_en as string) ?? (f.food_name_es as string) ?? "",
    group: (f.group_key as string) ?? "otros",
    serving:
      (f.serving_desc_es as string) ?? (f.serving_desc_en as string) ?? "",
    kcal: Number(f.kcal ?? 0),
    protein: Number(f.protein_g ?? 0),
    carbs: Number(f.carbs_g ?? 0),
    fat: Number(f.fat_g ?? 0),
  }));

  type MealRow = {
    id: string;
    meal_name: string;
    meal_order: number;
    servings: number;
    notes: string | null;
    equivalent_id: string | null;
    equivalent:
      | {
          food_name: string | null;
          food_name_es: string | null;
          food_name_en: string | null;
          serving_desc: string | null;
          serving_desc_es: string | null;
          serving_desc_en: string | null;
          kcal: number | null;
          protein_g: number | null;
          carbs_g: number | null;
          fat_g: number | null;
        }
      | null;
  };

  const rows: MealRow[] = (meals ?? []).map((m) => ({
    id: m.id,
    meal_name: m.meal_name,
    meal_order: m.meal_order,
    servings: Number(m.servings ?? 1),
    notes: m.notes,
    equivalent_id: (m as { equivalent_id: string | null }).equivalent_id,
    equivalent: Array.isArray(m.equivalent) ? m.equivalent[0] : m.equivalent,
  }));

  const mealItems: MealItem[] = rows.map((m) => ({
    id: m.id,
    meal_name: m.meal_name,
    meal_order: m.meal_order,
    servings: m.servings,
    food_es:
      m.equivalent?.food_name_es ??
      m.equivalent?.food_name_en ??
      m.equivalent?.food_name ??
      "Alimento",
    food_en:
      m.equivalent?.food_name_en ??
      m.equivalent?.food_name_es ??
      m.equivalent?.food_name ??
      "Food",
    serving_es:
      m.equivalent?.serving_desc_es ?? m.equivalent?.serving_desc ?? "—",
    serving_en:
      m.equivalent?.serving_desc_en ?? m.equivalent?.serving_desc ?? "—",
    kcal: Number(m.equivalent?.kcal ?? 0),
  }));

  // Aggregate macros
  const totals = rows.reduce(
    (acc, m) => {
      const e = m.equivalent;
      if (!e) return acc;
      const s = m.servings || 1;
      acc.kcal += (e.kcal ?? 0) * s;
      acc.protein += (e.protein_g ?? 0) * s;
      acc.carbs += (e.carbs_g ?? 0) * s;
      acc.fat += (e.fat_g ?? 0) * s;
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const patient = Array.isArray(plan.patient) ? plan.patient[0] : plan.patient;
  const template = Array.isArray(plan.template)
    ? plan.template[0]
    : plan.template;

  const planMode = ((plan as { plan_mode?: string }).plan_mode ?? "macros") as PlanMode;
  const planEquivalentes =
    ((plan as { equivalentes?: PlanEquivalentesData | null }).equivalentes ??
      null) as PlanEquivalentesData | null;

  // ── Clinical view data ────────────────────────────────────────────────
  // Prefer the saved equivalentes distribution; otherwise fall back to the
  // macro totals aggregated from the plan's meals.
  const reqKcal = planEquivalentes?.kcalTarget ?? Math.round(totals.kcal);
  const reqProteinG = planEquivalentes?.proteinG ?? Math.round(totals.protein);
  const reqCarbsG = planEquivalentes?.carbsG ?? Math.round(totals.carbs);
  const reqFatG = planEquivalentes?.fatG ?? Math.round(totals.fat);
  const macroKcal = reqProteinG * 4 + reqCarbsG * 4 + reqFatG * 9 || 1;
  const proteinPct =
    planEquivalentes?.proteinPct ?? Math.round(((reqProteinG * 4) / macroKcal) * 100);
  const carbsPct =
    planEquivalentes?.carbsPct ?? Math.round(((reqCarbsG * 4) / macroKcal) * 100);
  const fatPct =
    planEquivalentes?.fatPct ?? Math.round(((reqFatG * 9) / macroKcal) * 100);

  const weightNum = patient?.weight_kg != null ? Number(patient.weight_kg) : null;
  const bodyFatNum =
    (patient as { body_fat_pct?: number | null } | null)?.body_fat_pct != null
      ? Number((patient as { body_fat_pct?: number | null }).body_fat_pct)
      : null;
  const leanMass =
    weightNum != null && bodyFatNum != null
      ? Math.round(weightNum * (1 - bodyFatNum / 100) * 10) / 10
      : null;
  const waterMl = weightNum != null ? Math.round(weightNum * 35) : reqKcal;

  // Top 3 food options per clinical group from the catalog.
  const foodsByGroup: Partial<Record<GrupoKey, ClinicFoodOption[]>> = {};
  for (const g of GRUPO_KEYS) {
    const dbKeys = CLINICAL_TO_DB_GROUPS[g] ?? [];
    const opts: ClinicFoodOption[] = [];
    for (const f of catalog ?? []) {
      if (opts.length >= 3) break;
      if (dbKeys.includes((f.group_key as string) ?? "")) {
        opts.push({
          es: (f.food_name_es as string) ?? (f.food_name_en as string) ?? "",
          en: (f.food_name_en as string) ?? (f.food_name_es as string) ?? "",
          serving_es: (f.serving_desc_es as string) ?? "",
          serving_en: (f.serving_desc_en as string) ?? "",
        });
      }
    }
    if (opts.length > 0) foodsByGroup[g] = opts;
  }

  const dateLabel = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const clinicData: ClinicData = {
    planTitle: plan.title,
    dateLabel,
    patient: {
      first_name: patient?.first_name ?? "",
      last_name: patient?.last_name ?? "",
      sex: patient?.sex ?? null,
      age: ageFrom(patient?.birth_date ?? null),
      sport: patient?.sport ?? null,
      goal: patient?.goal ?? null,
      weight_kg: weightNum,
      height_cm: patient?.height_cm != null ? Number(patient.height_cm) : null,
      body_fat_pct: bodyFatNum,
      lean_mass_kg: leanMass,
    },
    requirements: {
      kcal: reqKcal,
      proteinG: reqProteinG,
      carbsG: reqCarbsG,
      fatG: reqFatG,
      proteinPct,
      carbsPct,
      fatPct,
      waterMl,
    },
    groups: planEquivalentes?.groups ?? null,
    foodsByGroup,
    nutritionistName: null,
  };

  return (
    <div className="space-y-8">
      <div className="rise no-print">
        <Link
          href="/dashboard/plans"
          className="text-xs"
          style={{ color: "var(--ink-subtle)" }}
        >
          ← Volver a planes
        </Link>
        <div className="mt-4 flex items-start justify-between gap-6">
          <div>
            <p className="eyebrow">
              {statusLabel[plan.status] ?? plan.status} ·{" "}
              {template?.name ?? "Sin plantilla"}
            </p>
            <h1
              className="font-display mt-3"
              style={{
                fontSize: "40px",
                color: "var(--ink-strong)",
                letterSpacing: "-0.025em",
                lineHeight: 1.02,
              }}
            >
              {plan.title}
            </h1>
            {patient && (
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--ink-muted)" }}
              >
                Para{" "}
                <span
                  className="font-display italic"
                  style={{ color: "var(--ink-strong)" }}
                >
                  {patient.first_name} {patient.last_name}
                </span>{" "}
                · {fmt(plan.valid_from)} → {fmt(plan.valid_until)}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <SaveAsTemplateButton
              planId={plan.id}
              planTitle={plan.title}
              planKcal={planEquivalentes?.kcalTarget ?? null}
              planNotes={plan.notes}
            />
            <SharePlanButton planId={plan.id} />
            <a
              href={`/api/plans/${plan.id}/pdf`}
              download
              className="btn btn-brand"
            >
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Descargar PDF
            </a>
          </div>
        </div>
      </div>

      <ClinicToggle clinical={clinicData}>
        <div className="space-y-8">
      {/* Patient strip */}
      {patient && (
        <div className="card-luxe p-6 rise rise-1">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.16em]"
                style={{ color: "var(--ink-subtle)" }}
              >
                Paciente
              </p>
              <p
                className="font-display mt-2"
                style={{ fontSize: "17px", color: "var(--ink-strong)" }}
              >
                {patient.first_name} {patient.last_name}
              </p>
            </div>
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.16em]"
                style={{ color: "var(--ink-subtle)" }}
              >
                Edad · Sexo
              </p>
              <p
                className="font-display mt-2"
                style={{ fontSize: "17px", color: "var(--ink-strong)" }}
              >
                {ageFrom(patient.birth_date) ?? "—"}
                {ageFrom(patient.birth_date) ? " años" : ""} ·{" "}
                {patient.sex ? sexLabel[patient.sex] ?? patient.sex : "—"}
              </p>
            </div>
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.16em]"
                style={{ color: "var(--ink-subtle)" }}
              >
                Peso · Estatura
              </p>
              <p
                className="font-display mt-2"
                style={{ fontSize: "17px", color: "var(--ink-strong)" }}
              >
                {patient.weight_kg ? `${patient.weight_kg} kg` : "—"} ·{" "}
                {patient.height_cm ? `${patient.height_cm} cm` : "—"}
              </p>
            </div>
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.16em]"
                style={{ color: "var(--ink-subtle)" }}
              >
                Objetivo
              </p>
              <p
                className="font-display mt-2"
                style={{ fontSize: "17px", color: "var(--ink-strong)" }}
              >
                {patient.goal ? goalLabel[patient.goal] ?? patient.goal : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dual-mode planner: Macros / Equivalentes */}
      <EquivalentesEditor
        planId={plan.id}
        initialMode={planMode}
        initialData={planEquivalentes}
      />

      {/* Macros */}
      <div className="rise rise-2">
        <p className="eyebrow mb-3">Totales del día</p>
        <div
          className="grid grid-cols-2 gap-0 overflow-hidden rounded-xl md:grid-cols-4"
          style={{
            background:
              "linear-gradient(135deg, var(--ink-strong) 0%, var(--brand-900) 100%)",
            color: "var(--ink-inverse)",
          }}
        >
          {[
            { label: "Energía", value: Math.round(totals.kcal), unit: "kcal" },
            {
              label: "Proteína",
              value: Math.round(totals.protein),
              unit: "g",
            },
            {
              label: "Carbohidratos",
              value: Math.round(totals.carbs),
              unit: "g",
            },
            { label: "Lípidos", value: Math.round(totals.fat), unit: "g" },
          ].map((m, i) => (
            <div
              key={m.label}
              className="px-6 py-5"
              style={{
                borderRight:
                  i < 3 ? "1px solid rgba(248,245,238,0.08)" : "none",
              }}
            >
              <p
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: "var(--gold-300)" }}
              >
                {m.label}
              </p>
              <p
                className="font-display mt-2"
                style={{
                  fontSize: "32px",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                {m.value}
                <span
                  className="ml-1 text-sm"
                  style={{ color: "rgba(248,245,238,0.55)" }}
                >
                  {m.unit}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Meals — interactive builder */}
      <MealBuilder planId={plan.id} foods={foods} items={mealItems} />

      {plan.notes && (
        <div className="card-luxe p-6 rise rise-4">
          <p className="eyebrow mb-3">Notas del plan</p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--ink-default)" }}>
            {plan.notes}
          </p>
        </div>
      )}
        </div>
      </ClinicToggle>
    </div>
  );
}
