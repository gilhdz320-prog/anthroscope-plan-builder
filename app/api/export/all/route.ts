import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { datedFilename } from "@/lib/export/csv";
import { trackEvent } from "@/lib/analytics/track";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Exportación completa en JSON: portabilidad real.
 *
 * Incluye pacientes, planes, comidas de cada plan, plantillas e intakes.
 * RLS filtra por user_id automáticamente en cada tabla.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticada" }, { status: 401 });
  }

  const [patients, plans, planMeals, templates, templateMeals] =
    await Promise.all([
      supabase.from("patients").select("*").order("created_at"),
      supabase.from("plans").select("*").order("created_at"),
      supabase.from("plan_meals").select("*").order("created_at"),
      supabase.from("templates").select("*").order("created_at"),
      supabase.from("template_meals").select("*").order("created_at"),
    ]);

  // `intakes` puede no existir en instalaciones antiguas: no debe romper la exportación.
  let intakesData: unknown[] = [];
  try {
    const { data } = await supabase.from("intakes").select("*").order("created_at");
    intakesData = data ?? [];
  } catch {
    intakesData = [];
  }

  const errors = [
    patients.error?.message,
    plans.error?.message,
    planMeals.error?.message,
    templates.error?.message,
    templateMeals.error?.message,
  ].filter(Boolean);

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" | ") }, { status: 500 });
  }

  const payload = {
    exported_at: new Date().toISOString(),
    format_version: 1,
    account: { id: user.id, email: user.email ?? null },
    patients: patients.data ?? [],
    plans: plans.data ?? [],
    plan_meals: planMeals.data ?? [],
    templates: templates.data ?? [],
    template_meals: templateMeals.data ?? [],
    intakes: intakesData,
  };

  await trackEvent({
    name: "export_downloaded",
    userId: user.id,
    props: { kind: "all", patients: payload.patients.length, plans: payload.plans.length },
  });

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${datedFilename("anthroscope-export", "json")}"`,
      "Cache-Control": "no-store",
    },
  });
}
