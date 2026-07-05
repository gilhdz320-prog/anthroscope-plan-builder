import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { PlanPdf, type PlanPdfData } from "@/lib/pdf/PlanPdf";
import {
  calculateCalories,
  type ActivityLevel,
  type Goal,
} from "@/lib/caloric-calculator";
import {
  EQUIVALENTES_GRUPOS,
  GRUPO_KEYS,
  type Equivalentes,
} from "@/lib/equivalentes";
import { CLINICAL_TO_DB_GROUPS } from "@/lib/food-groups";

const ACTIVITY_LEVELS: ActivityLevel[] = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
];

function toActivityLevel(v: unknown): ActivityLevel {
  return ACTIVITY_LEVELS.includes(v as ActivityLevel)
    ? (v as ActivityLevel)
    : "moderate";
}

function toGoal(v: unknown): Goal {
  const s = String(v ?? "");
  if (s === "weight_loss" || s === "lose_fat") return "lose_fat";
  if (s === "muscle_gain" || s === "gain_muscle") return "gain_muscle";
  return "maintain";
}

function ageFromBirth(birth: string | null): number | null {
  if (!birth) return null;
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return null;
  return Math.floor(
    (Date.now() - b.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch plan + patient
  const { data: plan, error: planErr } = await supabase
    .from("plans")
    .select(
      `
      id, title, status, valid_from, valid_until, notes, created_at, plan_mode, equivalentes,
      patient:patients (
        first_name, last_name, sex, birth_date, sport, goal, weight_kg, height_cm,
        body_fat_pct, activity_level
      )
    `,
    )
    .eq("id", id)
    .single();

  if (planErr || !plan) {
    return NextResponse.json(
      { error: planErr?.message ?? "Plan no encontrado" },
      { status: 404 },
    );
  }

  // Fetch meals + equivalent details
  const { data: meals } = await supabase
    .from("plan_meals")
    .select(
      `
      id, meal_name, meal_order, servings, notes,
      equivalent:equivalents (
        food_name, food_name_es, food_name_en,
        serving_desc, serving_desc_es, serving_desc_en,
        kcal, protein_g, carbs_g, fat_g
      )
    `,
    )
    .eq("plan_id", id)
    .order("meal_order", { ascending: true });

  // Fetch practitioner profile (name)
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  // Fetch nutritionist branding profile (drives the premium header/footer).
  const { data: nutriProfile } = await supabase
    .from("nutritionist_profiles")
    .select(
      "clinic_name, professional_name, license_number, specialty, phone, address, website, accent_color, logo_url, signature_url",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const rawPatient = Array.isArray(plan.patient)
    ? plan.patient[0]
    : plan.patient;

  const eqStored = (
    plan as {
      equivalentes?:
        | {
            mode?: string;
            kcalTarget?: number;
            proteinG?: number;
            carbsG?: number;
            fatG?: number;
            groups?: Equivalentes | null;
          }
        | null;
    }
  ).equivalentes;

  // Derive lean mass and energy requirements when we have enough anthropometry.
  let leanMass: number | null = null;
  let energy: PlanPdfData["energy"] = null;
  if (rawPatient?.weight_kg && rawPatient?.body_fat_pct != null) {
    leanMass =
      Math.round(
        rawPatient.weight_kg * (1 - rawPatient.body_fat_pct / 100) * 10,
      ) / 10;
  }

  const age = ageFromBirth(rawPatient?.birth_date ?? null);
  if (
    rawPatient?.weight_kg &&
    rawPatient?.height_cm &&
    age != null &&
    (rawPatient.sex === "male" || rawPatient.sex === "female")
  ) {
    const hasBodyComp = rawPatient.body_fat_pct != null;
    const result = calculateCalories({
      age,
      sex: rawPatient.sex,
      height_cm: rawPatient.height_cm,
      weight_kg: rawPatient.weight_kg,
      activity_level: toActivityLevel(rawPatient.activity_level),
      goal: toGoal(rawPatient.goal),
      has_body_comp: hasBodyComp,
      body_fat_pct: rawPatient.body_fat_pct ?? undefined,
      lean_mass_kg: leanMass ?? undefined,
    });

    // Prefer the nutritionist's chosen plan target/macros when present.
    const finalKcal = Math.round(eqStored?.kcalTarget ?? result.target_kcal);
    const proteinG = Math.round(eqStored?.proteinG ?? result.suggested_macros.protein_g);
    const carbsG = Math.round(eqStored?.carbsG ?? result.suggested_macros.carbs_g);
    const fatG = Math.round(eqStored?.fatG ?? result.suggested_macros.fat_g);
    const kcalBase = finalKcal || 1;

    energy = {
      formula: result.formula_used,
      bmr: result.bmr,
      activityFactor:
        result.breakdown.base_multiplier + result.breakdown.neat_bonus,
      tdee: result.tdee,
      goalAdjustment: result.breakdown.goal_adjustment,
      finalKcal,
      waterMl: Math.round(rawPatient.weight_kg * 35),
      protein: { g: proteinG, pct: Math.round(((proteinG * 4) / kcalBase) * 100) },
      carbs: { g: carbsG, pct: Math.round(((carbsG * 4) / kcalBase) * 100) },
      fat: { g: fatG, pct: Math.round(((fatG * 9) / kcalBase) * 100) },
    };
  }

  // Build the intercambios reference: top foods per active clinical group.
  const eqGroups = eqStored?.groups ?? null;
  let intercambios: PlanPdfData["intercambios"] = null;
  if (eqGroups) {
    const activeKeys = GRUPO_KEYS.filter((k) => (eqGroups[k] ?? 0) > 0);
    if (activeKeys.length > 0) {
      const dbKeys = Array.from(
        new Set(activeKeys.flatMap((k) => CLINICAL_TO_DB_GROUPS[k] ?? [])),
      );
      const { data: foods } = await supabase
        .from("equivalents")
        .select("group_key, food_name_es, food_name_en, serving_desc_es, serving_desc_en")
        .is("user_id", null)
        .in("group_key", dbKeys);

      const byGroup: Record<string, { name: string; serving: string }[]> = {};
      for (const f of foods ?? []) {
        const key = f.group_key as string;
        (byGroup[key] ??= []).push({
          name: (f.food_name_es as string) ?? (f.food_name_en as string) ?? "—",
          serving:
            (f.serving_desc_es as string) ?? (f.serving_desc_en as string) ?? "—",
        });
      }

      intercambios = activeKeys.map((k) => {
        const meta = EQUIVALENTES_GRUPOS[k];
        const foodList = (CLINICAL_TO_DB_GROUPS[k] ?? []).flatMap(
          (dk) => byGroup[dk] ?? [],
        );
        return {
          key: k,
          label: meta.label.es,
          equivalents: eqGroups[k] ?? 0,
          perEquiv: {
            kcal: meta.kcal,
            protein: meta.protein,
            carbs: meta.carbs,
            fat: meta.fat,
          },
          foods: foodList.slice(0, 5),
        };
      });
    }
  }

  const patient: PlanPdfData["patient"] = rawPatient
    ? {
        first_name: rawPatient.first_name,
        last_name: rawPatient.last_name,
        sex: rawPatient.sex,
        birth_date: rawPatient.birth_date,
        sport: rawPatient.sport,
        goal: rawPatient.goal,
        weight_kg: rawPatient.weight_kg,
        height_cm: rawPatient.height_cm,
        body_fat_pct: rawPatient.body_fat_pct ?? null,
        lean_mass_kg: leanMass,
      }
    : null;

  const data: PlanPdfData = {
    plan: {
      id: plan.id,
      title: plan.title,
      status: plan.status,
      valid_from: plan.valid_from,
      valid_until: plan.valid_until,
      notes: plan.notes,
      created_at: plan.created_at,
    },
    patient,
    meals: (meals ?? []).map((m) => ({
      id: m.id,
      meal_name: m.meal_name,
      meal_order: m.meal_order,
      notes: m.notes,
      servings: Number(m.servings ?? 1),
      equivalent: Array.isArray(m.equivalent) ? m.equivalent[0] : m.equivalent,
    })),
    practitioner: {
      full_name: profile?.full_name ?? null,
      email: user.email ?? null,
    },
    equivalentes: eqStored ?? null,
    profile: nutriProfile ?? null,
    energy,
    intercambios,
  };

  try {
    const element = createElement(PlanPdf, { data }) as unknown as ReactElement<DocumentProps>;
    const buffer = await renderToBuffer(element);

    const safeTitle = data.plan.title
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 60) || "plan";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error generando PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
