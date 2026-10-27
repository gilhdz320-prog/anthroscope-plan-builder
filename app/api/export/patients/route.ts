import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { csvResponse, datedFilename, toCsv } from "@/lib/export/csv";
import { trackEvent } from "@/lib/analytics/track";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PatientRow = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  sex: string | null;
  weight_kg: number | string | null;
  height_cm: number | string | null;
  body_fat_pct: number | string | null;
  waist_cm: number | string | null;
  hip_cm: number | string | null;
  sport: string | null;
  activity_level: string | null;
  goal: string | null;
  notes: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

/**
 * Exporta los pacientes de la usuaria en CSV.
 * La RLS de Supabase filtra por user_id: no hace falta comprobarlo aquí.
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
    .from("patients")
    .select(
      "first_name, last_name, email, phone, birth_date, sex, weight_kg, height_cm, body_fat_pct, waist_cm, hip_cm, sport, activity_level, goal, notes, is_active, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as PatientRow[];

  const csv = toCsv(
    rows.map((row) => ({
      nombre: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim(),
      email: row.email,
      telefono: row.phone,
      nacimiento: row.birth_date,
      sexo: row.sex,
      peso_kg: row.weight_kg,
      talla_cm: row.height_cm,
      grasa_pct: row.body_fat_pct,
      cintura_cm: row.waist_cm,
      cadera_cm: row.hip_cm,
      deporte: row.sport,
      actividad: row.activity_level,
      objetivo: row.goal,
      activo: row.is_active ? "sí" : "no",
      alta: row.created_at?.slice(0, 10),
      notas: row.notes,
    })),
    [
      { key: "nombre", header: "Nombre" },
      { key: "email", header: "Email" },
      { key: "telefono", header: "Teléfono" },
      { key: "nacimiento", header: "Fecha de nacimiento" },
      { key: "sexo", header: "Sexo" },
      { key: "peso_kg", header: "Peso (kg)" },
      { key: "talla_cm", header: "Talla (cm)" },
      { key: "grasa_pct", header: "Grasa (%)" },
      { key: "cintura_cm", header: "Cintura (cm)" },
      { key: "cadera_cm", header: "Cadera (cm)" },
      { key: "deporte", header: "Deporte" },
      { key: "actividad", header: "Nivel de actividad" },
      { key: "objetivo", header: "Objetivo" },
      { key: "activo", header: "Activo" },
      { key: "alta", header: "Fecha de alta" },
      { key: "notas", header: "Notas" },
    ],
  );

  await trackEvent({
    name: "export_downloaded",
    userId: user.id,
    props: { kind: "patients", rows: rows.length },
  });

  return csvResponse(csv, datedFilename("pacientes", "csv"));
}
