import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { csvResponse, datedFilename, toCsv } from "@/lib/export/csv";
import { trackEvent } from "@/lib/analytics/track";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlanRow = {
  title: string | null;
  status: string | null;
  plan_mode: string | null;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string | null;
  notes: string | null;
  patients: { first_name: string | null; last_name: string | null } | null;
};

/**
 * Exporta los planes con el nombre del paciente.
 * La relación con patients viene embebida (FK patient_id), filtrada por RLS.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticada" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("plans")
    .select(
      "title, status, plan_mode, valid_from, valid_until, created_at, notes, patients ( first_name, last_name )",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as PlanRow[];

  const csv = toCsv(
    rows.map((row) => ({
      paciente: `${row.patients?.first_name ?? ""} ${row.patients?.last_name ?? ""}`.trim(),
      plan: row.title,
      estado: row.status,
      modo: row.plan_mode,
      vigente_desde: row.valid_from,
      vigente_hasta: row.valid_until,
      creado: row.created_at?.slice(0, 10),
      notas: row.notes,
    })),
    [
      { key: "paciente", header: "Paciente" },
      { key: "plan", header: "Plan" },
      { key: "estado", header: "Estado" },
      { key: "modo", header: "Modo" },
      { key: "vigente_desde", header: "Vigente desde" },
      { key: "vigente_hasta", header: "Vigente hasta" },
      { key: "creado", header: "Creado" },
      { key: "notas", header: "Notas" },
    ],
  );

  await trackEvent({
    name: "export_downloaded",
    userId: user.id,
    props: { kind: "plans", rows: rows.length },
  });

  return csvResponse(csv, datedFilename("planes", "csv"));
}
