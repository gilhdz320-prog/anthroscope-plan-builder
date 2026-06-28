"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/components/LocaleProvider";
import {
  EQUIVALENTES_GRUPOS,
  GRUPO_KEYS,
  calcularEquivalentes,
  equivalentesToMacros,
  type Equivalentes,
  type GrupoKey,
} from "@/lib/equivalentes";

export type PlanMode = "macros" | "equivalentes";

export interface PlanEquivalentesData {
  mode: PlanMode;
  kcalTarget: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  groups: Equivalentes;
}

const cormorant = {
  fontFamily: "var(--font-cormorant), ui-serif, Georgia, serif",
};

function t(locale: "es" | "en", es: string, en: string): string {
  return locale === "en" ? en : es;
}

const emptyGroups: Equivalentes = GRUPO_KEYS.reduce((acc, k) => {
  acc[k] = 0;
  return acc;
}, {} as Equivalentes);

export function EquivalentesEditor({
  planId,
  initialMode = "macros",
  initialData,
}: {
  planId: string;
  initialMode?: PlanMode;
  initialData?: PlanEquivalentesData | null;
}) {
  const { locale } = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<PlanMode>(initialData?.mode ?? initialMode);

  // Shared kcal target
  const [kcal, setKcal] = useState<number>(initialData?.kcalTarget ?? 2000);

  // Mode A — direct macro grams
  const [proteinG, setProteinG] = useState<number>(initialData?.proteinG ?? 150);
  const [carbsG, setCarbsG] = useState<number>(initialData?.carbsG ?? 200);
  const [fatG, setFatG] = useState<number>(initialData?.fatG ?? 67);

  // Mode B — macro percentage distribution
  const [proteinPct, setProteinPct] = useState<number>(initialData?.proteinPct ?? 20);
  const [carbsPct, setCarbsPct] = useState<number>(initialData?.carbsPct ?? 55);
  const [fatPct, setFatPct] = useState<number>(initialData?.fatPct ?? 25);

  // Computed equivalents (after "Calcular"), editable in adjust mode
  const [groups, setGroups] = useState<Equivalentes | null>(
    initialData?.mode === "equivalentes" ? initialData.groups : null,
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const pctSum = proteinPct + carbsPct + fatPct;
  const pctValid = pctSum === 100;

  const real = useMemo(
    () => (groups ? equivalentesToMacros(groups) : null),
    [groups],
  );

  function handleCalcular() {
    if (!pctValid) return;
    setGroups(calcularEquivalentes(kcal, proteinPct, carbsPct, fatPct));
    setSavedMsg(null);
  }

  function adjustGroup(key: GrupoKey, value: number) {
    if (!groups) return;
    setGroups({ ...groups, [key]: Math.max(0, Math.round(value || 0)) });
    setSavedMsg(null);
  }

  async function persist(payload: {
    mode: PlanMode;
    equivalentes: PlanEquivalentesData;
  }) {
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    const { error: updErr } = await supabase
      .from("plans")
      .update({ plan_mode: payload.mode, equivalentes: payload.equivalentes })
      .eq("id", planId);
    setSaving(false);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setSavedMsg(t(locale, "Guardado", "Saved"));
    router.refresh();
  }

  async function saveMacros() {
    await persist({
      mode: "macros",
      equivalentes: {
        mode: "macros",
        kcalTarget: kcal,
        proteinPct,
        carbsPct,
        fatPct,
        proteinG,
        carbsG,
        fatG,
        groups: emptyGroups,
      },
    });
  }

  async function saveEquivalentes() {
    if (!groups) return;
    await persist({
      mode: "equivalentes",
      equivalentes: {
        mode: "equivalentes",
        kcalTarget: kcal,
        proteinPct,
        carbsPct,
        fatPct,
        proteinG: Math.round((kcal * proteinPct) / 100 / 4),
        carbsG: Math.round((kcal * carbsPct) / 100 / 4),
        fatG: Math.round((kcal * fatPct) / 100 / 9),
        groups,
      },
    });
  }

  const kcalDiff = real ? real.kcal - kcal : 0;
  const kcalOff = Math.abs(kcalDiff) > 50;

  return (
    <div className="card-luxe p-6 rise rise-2" style={{ background: "#141414" }}>
      {/* Header + mode toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow" style={{ color: "var(--gold)" }}>
            {t(locale, "Modo de planeación", "Planning mode")}
          </p>
          <h2
            className="mt-1"
            style={{ ...cormorant, fontSize: "24px", color: "var(--ink-strong)" }}
          >
            {t(locale, "Macros / Equivalentes", "Macros / Equivalents")}
          </h2>
        </div>
        <div
          className="inline-flex rounded-full p-1"
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        >
          {(["macros", "equivalentes"] as PlanMode[]).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setSavedMsg(null);
                }}
                className="rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: active ? "var(--gold)" : "transparent",
                  color: active ? "#0a0a0a" : "var(--ink-muted)",
                }}
              >
                {m === "macros"
                  ? t(locale, "Macros/Kcal", "Macros/Kcal")
                  : t(locale, "Equivalentes", "Equivalents")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <label className="label">
          {t(locale, "Meta calórica (kcal)", "Calorie target (kcal)")}
        </label>
        <input
          type="number"
          className="input"
          style={{ maxWidth: 220 }}
          value={kcal}
          min={0}
          onChange={(e) => setKcal(Number(e.target.value) || 0)}
        />
      </div>

      {/* ─────────────── Mode A: Macros ─────────────── */}
      {mode === "macros" && (
        <div className="mt-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">{t(locale, "Proteína (g)", "Protein (g)")}</label>
              <input
                type="number"
                className="input"
                value={proteinG}
                min={0}
                onChange={(e) => setProteinG(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="label">{t(locale, "Carbohidratos (g)", "Carbs (g)")}</label>
              <input
                type="number"
                className="input"
                value={carbsG}
                min={0}
                onChange={(e) => setCarbsG(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="label">{t(locale, "Grasas (g)", "Fat (g)")}</label>
              <input
                type="number"
                className="input"
                value={fatG}
                min={0}
                onChange={(e) => setFatG(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <p className="mt-3 font-mono-tabular text-xs" style={{ color: "var(--ink-muted)" }}>
            {t(locale, "Energía de macros", "Energy from macros")}:{" "}
            {Math.round(proteinG * 4 + carbsG * 4 + fatG * 9)} kcal
          </p>
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={saveMacros}
              disabled={saving}
              className="btn btn-brand"
              style={{ opacity: saving ? 0.6 : 1 }}
            >
              {saving && <span className="spinner" />}
              {t(locale, "Guardar macros", "Save macros")}
            </button>
          </div>
        </div>
      )}

      {/* ─────────────── Mode B: Equivalentes ─────────────── */}
      {mode === "equivalentes" && (
        <div className="mt-6 space-y-5">
          <Slider
            label={t(locale, "Proteína", "Protein")}
            value={proteinPct}
            min={0}
            max={35}
            onChange={setProteinPct}
          />
          <Slider
            label={t(locale, "Carbohidratos", "Carbs")}
            value={carbsPct}
            min={35}
            max={65}
            onChange={setCarbsPct}
          />
          <Slider
            label={t(locale, "Grasas", "Fat")}
            value={fatPct}
            min={15}
            max={35}
            onChange={setFatPct}
          />

          <div className="flex items-center justify-between">
            <p
              className="font-mono-tabular text-xs"
              style={{ color: pctValid ? "var(--ink-muted)" : "#fb7185" }}
            >
              {t(locale, "Suma", "Sum")}: {pctSum}%
              {!pctValid &&
                ` — ${t(locale, "debe sumar 100%", "must add up to 100%")}`}
            </p>
            <button
              type="button"
              onClick={handleCalcular}
              disabled={!pctValid}
              className="btn btn-brand"
              style={{ opacity: pctValid ? 1 : 0.4 }}
            >
              {t(locale, "Calcular", "Calculate")}
            </button>
          </div>

          {groups && real && (
            <div className="mt-2">
              <div className="overflow-hidden rounded-lg" style={{ border: "1px solid #2a2a2a" }}>
                <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--gold)", color: "#0a0a0a" }}>
                      <Th>{t(locale, "Grupo", "Group")}</Th>
                      <Th right>{t(locale, "Equiv.", "Equiv.")}</Th>
                      <Th right>Kcal</Th>
                      <Th right>{t(locale, "Prot", "Prot")}</Th>
                      <Th right>HC</Th>
                      <Th right>{t(locale, "Gras", "Fat")}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {GRUPO_KEYS.map((key) => {
                      const g = EQUIVALENTES_GRUPOS[key];
                      const n = groups[key] ?? 0;
                      return (
                        <tr key={key} style={{ borderTop: "1px solid #2a2a2a" }}>
                          <Td>
                            <span style={{ color: "var(--ink-strong)" }}>
                              {g.label[locale]}
                            </span>
                          </Td>
                          <Td right>
                            <input
                              type="number"
                              min={0}
                              value={n}
                              onChange={(e) => adjustGroup(key, Number(e.target.value))}
                              className="w-14 rounded px-2 py-1 text-right font-mono-tabular text-xs"
                              style={{
                                background: "#1a1a1a",
                                border: "1px solid #2a2a2a",
                                color: "var(--ink-strong)",
                              }}
                            />
                          </Td>
                          <Td right muted>{g.kcal * n}</Td>
                          <Td right muted>{g.protein * n}</Td>
                          <Td right muted>{g.carbs * n}</Td>
                          <Td right muted>{g.fat * n}</Td>
                        </tr>
                      );
                    })}
                    <tr
                      style={{
                        borderTop: "2px solid var(--gold)",
                        background: "#1a1a1a",
                      }}
                    >
                      <Td>
                        <span style={{ color: "var(--gold)", fontWeight: 700 }}>
                          {t(locale, "Total", "Total")}
                        </span>
                      </Td>
                      <Td right />
                      <Td right gold>{real.kcal}</Td>
                      <Td right gold>{real.proteinG}</Td>
                      <Td right gold>{real.carbsG}</Td>
                      <Td right gold>{real.fatG}</Td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Meta vs Real */}
              <div
                className="mt-3 flex items-center justify-between rounded-lg px-4 py-3 font-mono-tabular text-xs"
                style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
              >
                <span style={{ color: "var(--ink-muted)" }}>
                  {t(locale, "Meta", "Target")}: {kcal} kcal
                </span>
                <span style={{ color: "var(--ink-muted)" }}>
                  {t(locale, "Real", "Actual")}: {real.kcal} kcal
                </span>
                <span style={{ color: kcalOff ? "#fb7185" : "#34d399" }}>
                  {kcalDiff >= 0 ? "+" : ""}
                  {kcalDiff} kcal
                </span>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={saveEquivalentes}
                  disabled={saving}
                  className="btn btn-brand"
                  style={{ opacity: saving ? 0.6 : 1 }}
                >
                  {saving && <span className="spinner" />}
                  {t(locale, "Usar estos equivalentes", "Use these equivalents")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs" style={{ color: "#fb7185" }}>
          {error}
        </p>
      )}
      {savedMsg && (
        <p className="mt-3 text-xs" style={{ color: "#34d399" }}>
          {savedMsg}
        </p>
      )}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="label" style={{ marginBottom: 0 }}>
          {label}
        </label>
        <span className="font-mono-tabular text-sm" style={{ color: "var(--gold)" }}>
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full"
        style={{ accentColor: "var(--gold)" }}
      />
    </div>
  );
}

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <th
      className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
      style={{ textAlign: right ? "right" : "left" }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  right,
  muted,
  gold,
}: {
  children?: React.ReactNode;
  right?: boolean;
  muted?: boolean;
  gold?: boolean;
}) {
  return (
    <td
      className="px-3 py-2 font-mono-tabular text-xs"
      style={{
        textAlign: right ? "right" : "left",
        color: gold ? "var(--gold)" : muted ? "var(--ink-muted)" : undefined,
        fontWeight: gold ? 700 : undefined,
      }}
    >
      {children}
    </td>
  );
}

export default EquivalentesEditor;
