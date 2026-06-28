import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { PlanPdf, type PlanPdfData } from "@/lib/pdf/PlanPdf";

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
        first_name, last_name, sex, birth_date, sport, goal, weight_kg, height_cm
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

  // Fetch practitioner profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const patient = Array.isArray(plan.patient) ? plan.patient[0] : plan.patient;

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
    patient: patient ?? null,
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
    equivalentes:
      (plan as { equivalentes?: PlanPdfData["equivalentes"] }).equivalentes ??
      null,
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
