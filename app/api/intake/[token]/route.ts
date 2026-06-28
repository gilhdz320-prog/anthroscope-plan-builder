import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public, token-gated intake form endpoint.
// The unguessable token is the security boundary, so these handlers use the
// service-role client and must NEVER expose the nutritionist_id or full row to
// the client beyond the fields needed to render the form.

const PUBLIC_FIELDS =
  "client_name, status, age, sex, height_cm, weight_kg, activity_level, goal, has_body_comp, body_fat_pct, lean_mass_kg, client_notes, steps_per_day, job_type, daily_activity, sport_type, exercise_days_per_week, exercise_session_duration";

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
  steps_per_day?: "under_3k" | "steps_3k_7k" | "steps_7k_10k" | "over_10k" | null;
  job_type?: "desk" | "driver" | "standing" | "physical" | null;
  daily_activity?: "low" | "moderate" | "active" | null;
  sport_type?: string[] | null;
  exercise_days_per_week?: number | null;
  exercise_session_duration?:
    | "under_30"
    | "30_60"
    | "60_90"
    | "over_90"
    | null;
};

const ACTIVITY = new Set([
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
]);
const GOALS = new Set(["lose_fat", "maintain", "gain_muscle"]);
const STEPS = new Set(["under_3k", "steps_3k_7k", "steps_7k_10k", "over_10k"]);
const JOBS = new Set(["desk", "driver", "standing", "physical"]);
const DAILY = new Set(["low", "moderate", "active"]);
const DURATIONS = new Set(["under_30", "30_60", "60_90", "over_90"]);

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
  const steps_per_day =
    body.steps_per_day && STEPS.has(body.steps_per_day)
      ? body.steps_per_day
      : null;
  const job_type =
    body.job_type && JOBS.has(body.job_type) ? body.job_type : null;
  const daily_activity =
    body.daily_activity && DAILY.has(body.daily_activity)
      ? body.daily_activity
      : null;
  const sport_type = Array.isArray(body.sport_type)
    ? body.sport_type.filter((s): s is string => typeof s === "string")
    : null;
  const exercise_days_per_week = (() => {
    const n = num(body.exercise_days_per_week);
    if (n === null) return null;
    return Math.min(7, Math.max(0, Math.round(n)));
  })();
  const exercise_session_duration =
    body.exercise_session_duration &&
    DURATIONS.has(body.exercise_session_duration)
      ? body.exercise_session_duration
      : null;

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
    steps_per_day,
    job_type,
    daily_activity,
    sport_type,
    exercise_days_per_week,
    exercise_session_duration,
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
