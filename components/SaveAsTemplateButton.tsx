"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SaveAsTemplateButton({
  planId,
  planTitle,
  planKcal,
  planNotes,
}: {
  planId: string;
  planTitle: string;
  planKcal: number | null;
  planNotes: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      // 1. Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("No autorizado");
        setSaving(false);
        return;
      }

      // 2. Create template from plan metadata
      const { data: tpl, error: tplErr } = await supabase
        .from("templates")
        .insert({
          user_id: user.id,
          name: planTitle.replace(/^Plan\s*[-—·]\s*/i, "").trim() || planTitle,
          description: planNotes,
          kcal_target: planKcal,
          is_seed: false,
          is_public: false,
        })
        .select("id")
        .single();

      if (tplErr || !tpl) {
        setError(tplErr?.message ?? "Error creando plantilla");
        setSaving(false);
        return;
      }

      // 3. Clone plan_meals into template_meals
      const { data: meals } = await supabase
        .from("plan_meals")
        .select("meal_name, meal_order, equivalent_id, servings, notes")
        .eq("plan_id", planId)
        .order("meal_order", { ascending: true });

      if (meals && meals.length > 0) {
        const rows = meals.map((m) => ({
          template_id: tpl.id,
          meal_name: m.meal_name,
          meal_order: m.meal_order,
          equivalent_id: m.equivalent_id ?? null,
          servings: m.servings ?? 1,
          notes: m.notes ?? null,
        }));
        await supabase.from("template_meals").insert(rows);
      }

      setDone(true);
      router.refresh();
    } catch (e) {
      setError("Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
        style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Guardado como plantilla
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="btn btn-ghost"
        style={{ opacity: saving ? 0.6 : 1 }}
        title="Guardar este plan como plantilla reutilizable"
      >
        {saving ? (
          <span className="spinner" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
        )}
        Guardar como plantilla
      </button>
      {error && (
        <p className="absolute left-0 top-full mt-1 text-[11px]" style={{ color: "#fb7185" }}>
          {error}
        </p>
      )}
    </div>
  );
}
