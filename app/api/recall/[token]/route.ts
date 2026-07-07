import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PUBLIC_FIELDS = "id, client_name, recall_type, status, nutritionist_id";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("dietary_recalls")
    .select(PUBLIC_FIELDS)
    .eq("token", token)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get coach name for display
  let coachName = "tu nutriólogo";
  if (data.nutritionist_id) {
    const { data: profile } = await supabase
      .from("nutritionist_profiles")
      .select("display_name")
      .eq("id", data.nutritionist_id)
      .maybeSingle();
    if (profile?.display_name) coachName = profile.display_name;
  }

  return NextResponse.json({
    recall: {
      id: data.id,
      clientName: data.client_name,
      recallType: data.recall_type,
      status: data.status,
      coachName,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = createAdminClient();

  // Validate the token exists and is still pending
  const { data: existing, error: lookupErr } = await supabase
    .from("dietary_recalls")
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
      { error: "Este recordatorio ya fue completado." },
      { status: 409 },
    );
  }

  let body: { responses: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.responses || typeof body.responses !== "object") {
    return NextResponse.json({ error: "Missing responses" }, { status: 400 });
  }

  const { error: updErr } = await supabase
    .from("dietary_recalls")
    .update({
      responses: body.responses,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
