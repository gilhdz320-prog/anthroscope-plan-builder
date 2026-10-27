import { NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { PlanPdf, type PlanPdfData } from "@/lib/pdf/PlanPdf";
import { buildDemo } from "@/lib/demo/fixture";
import { EQUIVALENTES_GRUPOS } from "@/lib/equivalentes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PDF de ejemplo de la demo pública (/demo).
 * Se genera con el mismo componente que usan los planes reales, así que
 * muestra exactamente lo que recibirá el paciente.
 */
export async function GET() {
  const demo = buildDemo();
  const { patient } = demo;

  const meals: PlanPdfData["meals"] = demo.meals.flatMap((meal, mealIndex) =>
    meal.items.map((item, itemIndex) => ({
      id: `demo-${mealIndex}-${itemIndex}`,
      meal_name: meal.name,
      meal_order: mealIndex + 1,
      notes: null,
      servings: item.count,
      equivalent: {
        food_name: item.foods,
        food_name_es: item.foods,
        food_name_en: item.foods,
        serving_desc: "1 equivalente",
        serving_desc_es: "1 equivalente",
        serving_desc_en: "1 exchange",
        kcal: EQUIVALENTES_GRUPOS[item.grupo].kcal,
        protein_g: EQUIVALENTES_GRUPOS[item.grupo].protein,
        carbs_g: EQUIVALENTES_GRUPOS[item.grupo].carbs,
        fat_g: EQUIVALENTES_GRUPOS[item.grupo].fat,
      },
    })),
  );

  const today = new Date();
  const inAMonth = new Date();
  inAMonth.setDate(inAMonth.getDate() + 30);

  const data: PlanPdfData = {
    plan: {
      id: "demo",
      title: "Plan de pérdida de grasa",
      status: "active",
      valid_from: today.toISOString().slice(0, 10),
      valid_until: inAMonth.toISOString().slice(0, 10),
      notes: "Plan de ejemplo generado por el Plan Builder.",
      created_at: today.toISOString(),
    },
    patient: {
      first_name: patient.first_name,
      last_name: patient.last_name,
      sex: patient.sex,
      birth_date: "1994-03-12",
      sport: patient.sport,
      goal: patient.goal,
      weight_kg: patient.weight_kg,
      height_cm: patient.height_cm,
      body_fat_pct: patient.body_fat_pct,
      lean_mass_kg:
        Math.round(patient.weight_kg * (1 - patient.body_fat_pct / 100) * 10) / 10,
    },
    meals,
    practitioner: {
      full_name: "Tu marca",
      email: "hola@anthroscope.pro",
    },
    equivalentes: {
      mode: "equivalentes",
      kcalTarget: demo.targetKcal,
      groups: demo.totals,
    },
  };

  try {
    const buffer = await renderToBuffer(
      createElement(PlanPdf, { data }) as ReactElement<DocumentProps>,
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="plan-ejemplo-anthroscope.pdf"',
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[demo/pdf]", err);
    return NextResponse.json(
      { error: "No se pudo generar el PDF de ejemplo." },
      { status: 500 },
    );
  }
}
