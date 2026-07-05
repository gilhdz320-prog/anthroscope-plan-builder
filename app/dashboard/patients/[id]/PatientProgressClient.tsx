"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import {
  addProgressEntry,
  updateProgressEntry,
  deleteProgressEntry,
  type ProgressEntry,
  type ProgressInput,
} from "../progress-actions";

function t(locale: "es" | "en", es: string, en: string): string {
  return locale === "en" ? en : es;
}

function fmtDate(d: string, locale: "es" | "en"): string {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString(
      locale === "en" ? "en-US" : "es-MX",
      { year: "numeric", month: "short", day: "numeric" },
    );
  } catch {
    return d;
  }
}

const today = () => new Date().toISOString().slice(0, 10);

interface Point {
  x: number;
  y: number;
}

// Build an SVG polyline path from a series of {date,value} points.
function LineChart({
  series,
  color,
  unit,
  locale,
  height = 140,
}: {
  series: { date: string; value: number }[];
  color: string;
  unit: string;
  locale: "es" | "en";
  height?: number;
}) {
  const width = 640;
  const padX = 8;
  const padY = 16;

  const pts = series.filter((s) => Number.isFinite(s.value));
  if (pts.length === 0) {
    return (
      <p className="text-xs" style={{ color: "var(--ink-subtle)" }}>
        {t(locale, "Sin datos aún", "No data yet")}
      </p>
    );
  }

  const values = pts.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const coords: Point[] = pts.map((p, i) => {
    const x =
      pts.length === 1 ? width / 2 : padX + (i / (pts.length - 1)) * innerW;
    const y = padY + innerH - ((p.value - min) / range) * innerH;
    return { x, y };
  });

  const path = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    `M${coords[0].x.toFixed(1)},${(height - padY).toFixed(1)} ` +
    coords.map((c) => `L${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ") +
    ` L${coords[coords.length - 1].x.toFixed(1)},${(height - padY).toFixed(1)} Z`;

  const gid = `grad-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      role="img"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gid})`} stroke="none" />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="3" fill={color} />
      ))}
      {/* min/max labels */}
      <text x={padX} y={12} fontSize="10" fill="var(--ink-subtle)">
        {max.toFixed(1)} {unit}
      </text>
      <text x={padX} y={height - 4} fontSize="10" fill="var(--ink-subtle)">
        {min.toFixed(1)} {unit}
      </text>
    </svg>
  );
}

function DualLineChart({
  seriesA,
  seriesB,
  colorA,
  colorB,
  labelA,
  labelB,
  locale,
  height = 140,
}: {
  seriesA: { date: string; value: number }[];
  seriesB: { date: string; value: number }[];
  colorA: string;
  colorB: string;
  labelA: string;
  labelB: string;
  locale: "es" | "en";
  height?: number;
}) {
  const width = 640;
  const padX = 8;
  const padY = 16;
  const a = seriesA.filter((s) => Number.isFinite(s.value));
  const b = seriesB.filter((s) => Number.isFinite(s.value));
  const all = [...a, ...b].map((p) => p.value);

  if (all.length === 0) {
    return (
      <p className="text-xs" style={{ color: "var(--ink-subtle)" }}>
        {t(locale, "Sin datos aún", "No data yet")}
      </p>
    );
  }

  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  function toPath(pts: { date: string; value: number }[]) {
    if (pts.length === 0) return "";
    return pts
      .map((p, i) => {
        const x =
          pts.length === 1 ? width / 2 : padX + (i / (pts.length - 1)) * innerW;
        const y = padY + innerH - ((p.value - min) / range) * innerH;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        role="img"
      >
        <path d={toPath(a)} fill="none" stroke={colorA} strokeWidth="2" strokeLinejoin="round" />
        <path d={toPath(b)} fill="none" stroke={colorB} strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <div className="mt-2 flex gap-4 text-[11px]" style={{ color: "var(--ink-muted)" }}>
        <span className="inline-flex items-center gap-1.5">
          <span style={{ width: 10, height: 3, background: colorA, display: "inline-block" }} />
          {labelA}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span style={{ width: 10, height: 3, background: colorB, display: "inline-block" }} />
          {labelB}
        </span>
      </div>
    </div>
  );
}

const blank: ProgressInput = {
  recorded_at: today(),
  weight_kg: null,
  body_fat_pct: null,
  lean_mass_kg: null,
  waist_cm: null,
  hip_cm: null,
  notes: null,
};

export function PatientProgressClient({
  patientId,
  history,
}: {
  patientId: string;
  history: ProgressEntry[];
}) {
  const { locale } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgressInput>(blank);
  const [error, setError] = useState<string | null>(null);

  // Auto lean-mass preview when weight + body-fat present and lean not typed.
  const leanPreview = useMemo(() => {
    if (form.lean_mass_kg != null) return null;
    if (form.weight_kg != null && form.body_fat_pct != null) {
      return Math.round(form.weight_kg * (1 - form.body_fat_pct / 100) * 100) / 100;
    }
    return null;
  }, [form.weight_kg, form.body_fat_pct, form.lean_mass_kg]);

  const weightSeries = history
    .filter((h) => h.weight_kg != null)
    .map((h) => ({ date: h.recorded_at, value: Number(h.weight_kg) }));
  const bodyFatSeries = history
    .filter((h) => h.body_fat_pct != null)
    .map((h) => ({ date: h.recorded_at, value: Number(h.body_fat_pct) }));
  const leanSeries = history
    .filter((h) => h.lean_mass_kg != null)
    .map((h) => ({ date: h.recorded_at, value: Number(h.lean_mass_kg) }));
  const waistSeries = history
    .filter((h) => h.waist_cm != null)
    .map((h) => ({ date: h.recorded_at, value: Number(h.waist_cm) }));
  const hipSeries = history
    .filter((h) => h.hip_cm != null)
    .map((h) => ({ date: h.recorded_at, value: Number(h.hip_cm) }));

  // Trend helpers: latest vs ~30 days earlier.
  function trend(series: { date: string; value: number }[]) {
    if (series.length === 0) return null;
    const latest = series[series.length - 1];
    const latestDate = new Date(latest.date).getTime();
    const target = latestDate - 30 * 86400000;
    let ref = series[0];
    for (const s of series) {
      if (new Date(s.date).getTime() <= target) ref = s;
    }
    return { latest: latest.value, delta: latest.value - ref.value };
  }

  const wTrend = trend(weightSeries);
  const bfTrend = trend(bodyFatSeries);
  const leanTrend = trend(leanSeries);

  function openNew() {
    setEditId(null);
    setForm({ ...blank, recorded_at: today() });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(e: ProgressEntry) {
    setEditId(e.id);
    setForm({
      recorded_at: e.recorded_at,
      weight_kg: e.weight_kg,
      body_fat_pct: e.body_fat_pct,
      lean_mass_kg: e.lean_mass_kg,
      waist_cm: e.waist_cm,
      hip_cm: e.hip_cm,
      notes: e.notes,
    });
    setError(null);
    setModalOpen(true);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = editId
        ? await updateProgressEntry(editId, form)
        : await addProgressEntry(patientId, form);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setModalOpen(false);
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!confirm(t(locale, "¿Eliminar este registro?", "Delete this entry?"))) return;
    startTransition(async () => {
      const res = await deleteProgressEntry(id);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function setField(key: keyof ProgressInput, value: string) {
    if (key === "recorded_at" || key === "notes") {
      setForm((f) => ({ ...f, [key]: value === "" ? null : value }));
    } else {
      const n = value === "" ? null : Number(value);
      setForm((f) => ({ ...f, [key]: n }));
    }
  }

  const deltaStr = (d: number, unit: string) =>
    `${d > 0 ? "↑ +" : d < 0 ? "↓ " : ""}${d.toFixed(1)} ${unit}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display" style={{ fontSize: 24, color: "var(--ink-strong)" }}>
          {t(locale, "Progreso", "Progress")}
        </h2>
        <button type="button" onClick={openNew} className="btn btn-brand">
          + {t(locale, "Registrar hoy", "Log today")}
        </button>
      </div>

      {/* Weight chart */}
      <div className="card-luxe p-5">
        <div className="flex items-center justify-between">
          <p className="eyebrow" style={{ color: "var(--gold)" }}>
            {t(locale, "Peso corporal", "Body weight")}
          </p>
          {wTrend && (
            <p className="font-mono-tabular text-xs" style={{ color: "var(--ink-muted)" }}>
              {t(locale, "Actual", "Current")}: {wTrend.latest.toFixed(1)} kg{" "}
              <span style={{ color: wTrend.delta <= 0 ? "#34d399" : "#fb7185" }}>
                {deltaStr(wTrend.delta, "kg")}
              </span>{" "}
              {t(locale, "vs hace 30 días", "vs 30 days ago")}
            </p>
          )}
        </div>
        <div className="mt-3">
          <LineChart series={weightSeries} color="#c9a961" unit="kg" locale={locale} />
        </div>
      </div>

      {/* Body composition */}
      <div className="card-luxe p-5">
        <div className="flex items-center justify-between">
          <p className="eyebrow" style={{ color: "var(--gold)" }}>
            {t(locale, "Composición corporal", "Body composition")}
          </p>
          {(bfTrend || leanTrend) && (
            <p className="font-mono-tabular text-xs" style={{ color: "var(--ink-muted)" }}>
              {bfTrend && (
                <>
                  {t(locale, "Grasa", "Fat")}: {bfTrend.latest.toFixed(1)}%{" "}
                </>
              )}
              {leanTrend && (
                <>
                  · {t(locale, "Magra", "Lean")}: {leanTrend.latest.toFixed(1)} kg
                </>
              )}
            </p>
          )}
        </div>
        <div className="mt-3">
          <DualLineChart
            seriesA={leanSeries}
            seriesB={bodyFatSeries}
            colorA="#7fae8e"
            colorB="#d98c5f"
            labelA={t(locale, "Masa magra (kg)", "Lean mass (kg)")}
            labelB={t(locale, "% Grasa", "Body fat %")}
            locale={locale}
          />
        </div>
      </div>

      {/* Measurements */}
      <div className="card-luxe p-5">
        <p className="eyebrow" style={{ color: "var(--gold)" }}>
          {t(locale, "Medidas (cm)", "Measurements (cm)")}
        </p>
        <div className="mt-3">
          <DualLineChart
            seriesA={waistSeries}
            seriesB={hipSeries}
            colorA="#c9a961"
            colorB="#8fa3c9"
            labelA={t(locale, "Cintura", "Waist")}
            labelB={t(locale, "Cadera", "Hip")}
            locale={locale}
          />
        </div>
      </div>

      {/* History table */}
      <div className="card-luxe overflow-hidden" style={{ padding: 0 }}>
        <table className="w-full text-sm">
          <thead
            className="text-left"
            style={{ background: "var(--surface-sunken)", color: "var(--ink-subtle)" }}
          >
            <tr>
              {[
                t(locale, "Fecha", "Date"),
                t(locale, "Peso", "Weight"),
                t(locale, "% Grasa", "Body fat"),
                t(locale, "Masa magra", "Lean mass"),
                t(locale, "Cintura", "Waist"),
                t(locale, "Cadera", "Hip"),
                t(locale, "Notas", "Notes"),
                "",
              ].map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.14em]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center" style={{ color: "var(--ink-muted)" }}>
                  {t(locale, "Sin registros. Agrega el primero.", "No entries yet. Add the first one.")}
                </td>
              </tr>
            ) : (
              [...history]
                .reverse()
                .map((h) => (
                  <tr
                    key={h.id}
                    className="border-t"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <td className="px-4 py-3" style={{ color: "var(--ink-strong)" }}>
                      {fmtDate(h.recorded_at, locale)}
                    </td>
                    <td className="px-4 py-3 font-mono-tabular" style={{ color: "var(--ink-muted)" }}>
                      {h.weight_kg != null ? `${h.weight_kg} kg` : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono-tabular" style={{ color: "var(--ink-muted)" }}>
                      {h.body_fat_pct != null ? `${h.body_fat_pct}%` : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono-tabular" style={{ color: "var(--ink-muted)" }}>
                      {h.lean_mass_kg != null ? `${h.lean_mass_kg} kg` : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono-tabular" style={{ color: "var(--ink-muted)" }}>
                      {h.waist_cm != null ? `${h.waist_cm} cm` : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono-tabular" style={{ color: "var(--ink-muted)" }}>
                      {h.hip_cm != null ? `${h.hip_cm} cm` : "—"}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--ink-muted)" }}>
                      {h.notes ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(h)}
                        className="text-xs"
                        style={{ color: "var(--gold)" }}
                      >
                        ✏️ {t(locale, "Editar", "Edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(h.id)}
                        className="ml-3 text-xs"
                        style={{ color: "var(--danger)" }}
                      >
                        🗑 {t(locale, "Eliminar", "Delete")}
                      </button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="card-luxe w-full max-w-md p-6"
            style={{ background: "#141414" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display" style={{ fontSize: 22, color: "var(--ink-strong)" }}>
              {editId
                ? t(locale, "Editar registro", "Edit entry")
                : t(locale, "Registrar hoy", "Log today")}
            </h3>

            <div className="mt-4 space-y-4">
              <div>
                <label className="label">{t(locale, "Fecha", "Date")}</label>
                <input
                  type="date"
                  className="input"
                  value={form.recorded_at ?? ""}
                  onChange={(e) => setField("recorded_at", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">{t(locale, "Peso (kg)", "Weight (kg)")}</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={form.weight_kg ?? ""}
                    onChange={(e) => setField("weight_kg", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">{t(locale, "% Grasa", "Body fat %")}</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={form.body_fat_pct ?? ""}
                    onChange={(e) => setField("body_fat_pct", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label">
                  {t(locale, "Masa magra (kg)", "Lean mass (kg)")}
                  {leanPreview != null && (
                    <span className="ml-2 text-xs" style={{ color: "var(--gold)" }}>
                      {t(locale, "auto", "auto")}: {leanPreview} kg
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  placeholder={leanPreview != null ? String(leanPreview) : ""}
                  value={form.lean_mass_kg ?? ""}
                  onChange={(e) => setField("lean_mass_kg", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">{t(locale, "Cintura (cm)", "Waist (cm)")}</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={form.waist_cm ?? ""}
                    onChange={(e) => setField("waist_cm", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">{t(locale, "Cadera (cm)", "Hip (cm)")}</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={form.hip_cm ?? ""}
                    onChange={(e) => setField("hip_cm", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label">{t(locale, "Notas", "Notes")}</label>
                <textarea
                  className="input"
                  rows={2}
                  value={form.notes ?? ""}
                  onChange={(e) => setField("notes", e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="mt-3 text-xs" style={{ color: "#fb7185" }}>
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn btn-ghost"
              >
                {t(locale, "Cancelar", "Cancel")}
              </button>
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="btn btn-brand"
                style={{ opacity: pending ? 0.6 : 1 }}
              >
                {pending && <span className="spinner" />}
                {t(locale, "Guardar", "Save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientProgressClient;
