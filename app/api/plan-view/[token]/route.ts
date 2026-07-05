import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public, token-gated plan view endpoint.
// The unguessable token is the security boundary, so this handler uses the
// service-role client and exposes only what the patient view needs: the plan's
// equivalents distribution, the patient's first name, and the food catalog
// grouped by exchange category. It NEVER returns the nutritionist id, patient
// email, or other patients' data.

interface FoodOut {
  id: string;
  group: string;
  es: string;
  en: string;
  serving_es: string;
  serving_en: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: tokenRow, error: tokErr } = await supabase
    .from("plan_view_tokens")
    .select("plan_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (tokErr) {
    return NextResponse.json({ error: tokErr.message }, { status: 500 });
  }
  if (!tokenRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: "Expired" }, { status: 410 });
  }

  const { data: plan, error: planErr } = await supabase
    .from("plans")
    .select(
      `
      id, title, valid_from, valid_until, plan_mode, equivalentes, notes,
      patient:patients ( first_name ),
      meals:plan_meals (
        meal_name, meal_order, servings,
        equivalent:equivalents (
          group_key, food_name_es, food_name_en, serving_desc_es, serving_desc_en,
          kcal, protein_g, carbs_g, fat_g
        )
      )
    `,
    )
    .eq("id", tokenRow.plan_id)
    .maybeSingle();

  if (planErr) {
    return NextResponse.json({ error: planErr.message }, { status: 500 });
  }
  if (!plan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const patient = Array.isArray(plan.patient) ? plan.patient[0] : plan.patient;

  // All system foods grouped by DB group_key (macros included).
  const { data: foods, error: foodsErr } = await supabase
    .from("equivalents")
    .select(
      "id, group_key, food_name_es, food_name_en, serving_desc_es, serving_desc_en, kcal, protein_g, carbs_g, fat_g",
    )
    .is("user_id", null)
    .order("group_key", { ascending: true })
    .order("food_name_es", { ascending: true });

  if (foodsErr) {
    return NextResponse.json({ error: foodsErr.message }, { status: 500 });
  }

  const foodsByGroup: Record<string, FoodOut[]> = {};
  for (const f of foods ?? []) {
    const g = (f.group_key as string) ?? "otros";
    (foodsByGroup[g] ??= []).push({
      id: f.id as string,
      group: g,
      es: (f.food_name_es as string) ?? (f.food_name_en as string) ?? "",
      en: (f.food_name_en as string) ?? (f.food_name_es as string) ?? "",
      serving_es: (f.serving_desc_es as string) ?? "",
      serving_en: (f.serving_desc_en as string) ?? "",
      kcal: Number(f.kcal ?? 0),
      protein: Number(f.protein_g ?? 0),
      carbs: Number(f.carbs_g ?? 0),
      fat: Number(f.fat_g ?? 0),
    });
  }

  type MealRow = {
    meal_name: string;
    meal_order: number;
    servings: number | null;
    equivalent:
      | {
          group_key: string | null;
          food_name_es: string | null;
          food_name_en: string | null;
          serving_desc_es: string | null;
          serving_desc_en: string | null;
        }
      | { group_key: string | null }[]
      | null;
  };

  const meals = ((plan.meals as MealRow[] | null) ?? [])
    .map((m) => {
      const eq = Array.isArray(m.equivalent) ? m.equivalent[0] : m.equivalent;
      return {
        meal_name: m.meal_name,
        meal_order: m.meal_order,
        servings: Number(m.servings ?? 1),
        group: (eq && "group_key" in eq ? eq.group_key : null) ?? null,
      };
    })
    .sort((a, b) => a.meal_order - b.meal_order);

  return NextResponse.json({
    plan: {
      id: plan.id,
      title: plan.title,
      valid_from: plan.valid_from,
      valid_until: plan.valid_until,
      plan_mode: plan.plan_mode,
      equivalentes: plan.equivalentes,
      notes: plan.notes,
      patient_first_name: patient?.first_name ?? null,
    },
    meals,
    foodsByGroup,
  });
}
