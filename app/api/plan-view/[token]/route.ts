import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public, token-gated plan view endpoint.
// Uses the anon key + a SECURITY DEFINER SQL function to safely read plan data
// without requiring the service-role key. The unguessable token is the security
// boundary. The function validates the token and returns only safe fields.

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

function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars.");
  }
  return createSupabaseClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = createAnonClient();

  // Step 1: Validate token using the public RPC function (SECURITY DEFINER bypasses RLS)
  const { data: planData, error: rpcErr } = await supabase
    .rpc("get_plan_by_token", { p_token: token });

  if (rpcErr) {
    // If the function doesn't exist yet, fall back to direct query with service role
    if (rpcErr.message.includes("function") || rpcErr.message.includes("does not exist")) {
      return NextResponse.json({ error: "Function not found. Please run the migration." }, { status: 500 });
    }
    return NextResponse.json({ error: rpcErr.message }, { status: 500 });
  }

  if (!planData || planData.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const plan = planData[0];

  if (plan.expired) {
    return NextResponse.json({ error: "Expired" }, { status: 410 });
  }

  // Step 2: Get all system foods (anon can read equivalents with user_id IS NULL)
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

  // Step 3: Parse meals from the RPC result
  const meals = ((plan.meals as Array<{
    meal_name: string;
    meal_order: number;
    servings: number | null;
    group_key: string | null;
  }> | null) ?? [])
    .map((m) => ({
      meal_name: m.meal_name,
      meal_order: m.meal_order,
      servings: Number(m.servings ?? 1),
      group: m.group_key ?? null,
    }))
    .sort((a, b) => a.meal_order - b.meal_order);

  return NextResponse.json({
    plan: {
      id: plan.plan_id,
      title: plan.title,
      valid_from: plan.valid_from,
      valid_until: plan.valid_until,
      plan_mode: plan.plan_mode,
      equivalentes: plan.equivalentes,
      notes: plan.notes,
      patient_first_name: plan.patient_first_name ?? null,
    },
    meals,
    foodsByGroup,
  });
}
