import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public, token-gated intake form endpoint.
// The unguessable token is the security boundary, so these handlers use the
// service-role client and must NEVER expose the nutritionist_id or full row to
// the client beyond the fields needed to render the form.

const PUBLIC_FIELDS =
  "client_name, status, age, sex, height_cm, weight_kg, activity_level, goal, has_body_comp, body_fat_pct, lean_mass_kg, client_notes";

type IntakePatch = {
  client_name?: string | null;
  age?: number | null;
  sex?: "male" | "female" | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  activity_level?:
    | "sedentary"
    | "light"
    | "moderate"
    | "active"
    | "very_active"
    | null;
  goal?: "lose_fat" | "maintain" | "gain_muscle" | null;
  has_body_comp?: boolean;
  body_fat_pct?: number | null;
  lean_mass_kg?: number | null;
  client_notes?: string | null;
};

const ACTIVITY = new Set([
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
]);
const GOALS = new Set(["lose_fat", "maintain", "gain_muscle"]);

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("intake_forms")
    .select(PUBLIC_FIELDS)
    .eq("token", token)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ intake: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = createAdminClient();

  // Validate the token exists and is still pending.
  const { data: existing, error: lookupErr } = await supabase
    .from("intake_forms")
    .select("id, status")
    .eq("token", token)
    .maybeSingle();

  if (lookupErr) {
    return NextResponse.json({ error: lookupErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status === "completed") {
    return NextResponse.json(
      { error: "Este formulario ya fue completado." },
      { status: 409 },
    );
  }

  let body: IntakePatch;
  try {
    body = (await req.json()) as IntakePatch;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sex = body.sex === "male" || body.sex === "female" ? body.sex : null;
  const activity_level =
    body.activity_level && ACTIVITY.has(body.activity_level)
      ? body.activity_level
      : null;
  const goal = body.goal && GOALS.has(body.goal) ? body.goal : null;
  const has_body_comp = Boolean(body.has_body_comp);

  const update = {
    client_name:
      typeof body.client_name === "string" && body.client_name.trim() !== ""
        ? body.client_name.trim()
        : null,
    age: num(body.age),
    sex,
    height_cm: num(body.height_cm),
    weight_kg: num(body.weight_kg),
    activity_level,
    goal,
    has_body_comp,
    body_fat_pct: has_body_comp ? num(body.body_fat_pct) : null,
    lean_mass_kg: has_body_comp ? num(body.lean_mass_kg) : null,
    client_notes:
      typeof body.client_notes === "string" && body.client_notes.trim() !== ""
        ? body.client_notes.trim()
        : null,
    status: "completed" as const,
    completed_at: new Date().toISOString(),
  };

  const { error: updErr } = await supabase
    .from("intake_forms")
    .update(update)
    .eq("id", existing.id);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
