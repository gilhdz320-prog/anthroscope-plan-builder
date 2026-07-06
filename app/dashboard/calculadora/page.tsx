import { createClient } from "@/lib/supabase/server";
import { CalculadoraClient } from "./CalculadoraClient";

export default async function CalculadoraPage() {
  const supabase = await createClient();
  const { data: patients } = await supabase
    .from("patients")
    .select("id, first_name, last_name, sex, birth_date, weight_kg, height_cm, body_fat_pct, activity_level, goal, sport")
    .order("first_name", { ascending: true });

  return (
    <div className="space-y-8">
      <div className="rise">
        <p className="eyebrow">Herramientas</p>
        <h1
          className="font-display mt-3"
          style={{
            fontSize: "38px",
            color: "var(--ink-strong)",
            letterSpacing: "-0.025em",
            lineHeight: 1.02,
          }}
        >
          Calculadora
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
          TMB · TDEE · % grasa corporal · Distribución de macros
        </p>
      </div>
      <CalculadoraClient patients={patients ?? []} />
    </div>
  );
}
