"use client";
import { useEffect, useState, useMemo } from "react";

const cormorant = {
  fontFamily: "var(--font-cormorant), ui-serif, Georgia, serif",
};

type RecallType = "24h" | "3day" | "7day";

const MEAL_KEYS = ["desayuno", "colacion_am", "comida", "colacion_pm", "cena"] as const;
const MEAL_LABELS: Record<string, { emoji: string; label: string }> = {
  desayuno: { emoji: "🌅", label: "Desayuno" },
  colacion_am: { emoji: "🍎", label: "Colación AM" },
  comida: { emoji: "🍽️", label: "Comida" },
  colacion_pm: { emoji: "🥤", label: "Colación PM" },
  cena: { emoji: "🌙", label: "Cena" },
};

const RECALL_TYPE_LABELS: Record<RecallType, string> = {
  "24h": "Recordatorio de 24 horas",
  "3day": "Recordatorio de 3 días",
  "7day": "Recordatorio de 7 días",
};

function getDayCount(type: RecallType): number {
  return type === "24h" ? 1 : type === "3day" ? 3 : 7;
}

function getDayLabel(type: RecallType, dayIndex: number): string {
  if (type === "24h") return "Ayer (últimas 24 horas)";
  const today = new Date();
  const date = new Date(today);
  date.setDate(today.getDate() - (dayIndex + 1));
  const weekdays = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return `${weekdays[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
}

function getPlaceholder(meal: string): string {
  const placeholders: Record<string, string> = {
    desayuno: "Ej: 2 huevos revueltos, 2 tortillas, 1 taza de café con leche, 1 plátano...",
    colacion_am: "Ej: 1 manzana, 10 almendras, 1 yogurt...",
    comida: "Ej: 1 plato de arroz con pollo, ensalada, 2 tortillas, agua de limón...",
    colacion_pm: "Ej: 1 licuado de proteína, 1 barra de granola...",
    cena: "Ej: 1 sandwich de jamón con queso, 1 vaso de leche...",
  };
  return placeholders[meal] || "Describe lo que comiste y la cantidad aproximada...";
}

export function RecallFormClient({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coachName, setCoachName] = useState("tu nutriólogo");
  const [recallType, setRecallType] = useState<RecallType>("24h");
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [currentDay, setCurrentDay] = useState(0);
  const [showExtras, setShowExtras] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [extras, setExtras] = useState<Record<string, string>>({});

  const dayCount = useMemo(() => getDayCount(recallType), [recallType]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/recall/${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "No disponible");
        if (!active) return;
        setCoachName(data.recall?.coachName || "tu nutriólogo");
        setRecallType(data.recall?.recallType || "24h");
        if (data.recall?.status === "completed") setAlreadyDone(true);
      } catch (e: any) {
        if (active) setError(e?.message || "Este formulario no está disponible.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [token]);

  const setMealValue = (day: number, meal: string, val: string) => {
    setValues((prev) => ({
      ...prev,
      [`day_${day}`]: { ...(prev[`day_${day}`] || {}), [meal]: val },
    }));
  };

  const setDayField = (day: number, field: string, val: string) => {
    setValues((prev) => ({
      ...prev,
      [`day_${day}`]: { ...(prev[`day_${day}`] || {}), [field]: val },
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const responses: Record<string, unknown> = {};
      for (let i = 0; i < dayCount; i++) {
        responses[`day_${i}`] = {
          label: getDayLabel(recallType, i),
          ...(values[`day_${i}`] || {}),
        };
      }
      if (extras.tipico) responses.tipico = extras.tipico;
      if (extras.suplementos) responses.suplementos = extras.suplementos;
      if (extras.notas_generales) responses.notas_generales = extras.notas_generales;

      const res = await fetch(`/api/recall/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al enviar");
      setDone(true);
    } catch (e: any) {
      setError(e?.message || "No se pudo enviar. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = useMemo(() => {
    if (showExtras) return 100;
    return Math.round(((currentDay + 1) / (dayCount + 1)) * 100);
  }, [currentDay, dayCount, showExtras]);

  // Loading state
  if (loading) {
    return (
      <Shell>
        <p style={{ color: "var(--ink-muted)" }}>Cargando…</p>
      </Shell>
    );
  }

  // Error state (initial load)
  if (error && !done && !showExtras && currentDay === 0) {
    return (
      <Shell>
        <div className="card-luxe p-8 text-center">
          <h2 style={{ ...cormorant, fontSize: "28px", color: "var(--ink-strong)" }}>
            Formulario no disponible
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>{error}</p>
        </div>
      </Shell>
    );
  }

  // Done state
  if (done || alreadyDone) {
    return (
      <Shell>
        <div className="card-luxe p-8 text-center">
          <div style={{ fontSize: 44, marginBottom: 8 }}>✓</div>
          <h2 style={{ ...cormorant, fontSize: "28px", color: "var(--ink-strong)" }}>
            ¡Gracias!
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
            {alreadyDone && !done
              ? "Este recordatorio dietético ya fue completado."
              : "Tu nutriólogo revisará tus respuestas para personalizar tu plan."}
          </p>
        </div>
      </Shell>
    );
  }

  // Extras page (final step)
  if (showExtras) {
    return (
      <Shell>
        <div className="card-luxe p-6 space-y-5">
          <Header coachName={coachName} recallType={recallType} />
          <ProgressBar progress={progress} />
          <p className="text-xs" style={{ color: "var(--ink-subtle)" }}>
            Paso final · Información adicional
          </p>

          <h2 style={{ ...cormorant, fontSize: "24px", color: "var(--ink-strong)", margin: 0 }}>
            Información adicional
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">¿Fue un día típico de alimentación?</label>
              <select
                className="input"
                value={extras.tipico ?? ""}
                onChange={(e) => setExtras((v) => ({ ...v, tipico: e.target.value }))}
              >
                <option value="">Selecciona…</option>
                <option value="si">Sí, fue un día normal</option>
                <option value="no_mas">No, comí más de lo normal</option>
                <option value="no_menos">No, comí menos de lo normal</option>
                <option value="enfermo">Estuve enfermo/a</option>
              </select>
            </div>

            <div>
              <label className="label">Suplementos que tomaste</label>
              <textarea
                className="input"
                value={extras.suplementos ?? ""}
                onChange={(e) => setExtras((v) => ({ ...v, suplementos: e.target.value }))}
                placeholder="Ej: Proteína whey, creatina, multivitamínico..."
                rows={2}
                style={{ resize: "vertical" }}
              />
            </div>

            <div>
              <label className="label">Notas adicionales</label>
              <textarea
                className="input"
                value={extras.notas_generales ?? ""}
                onChange={(e) => setExtras((v) => ({ ...v, notas_generales: e.target.value }))}
                placeholder="Algo más que quieras comentar sobre tu alimentación..."
                rows={2}
                style={{ resize: "vertical" }}
              />
            </div>
          </div>

          {error && <p className="text-xs" style={{ color: "#fb7185" }}>{error}</p>}

          <div className="flex justify-between gap-3 pt-2">
            <button className="btn btn-ghost" onClick={() => setShowExtras(false)}>
              Atrás
            </button>
            <button
              className="btn btn-brand"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? "Enviando…" : "Enviar recordatorio"}
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // Day form
  const dayLabel = getDayLabel(recallType, currentDay);
  const dayValues = values[`day_${currentDay}`] || {};

  return (
    <Shell>
      <div className="card-luxe p-6 space-y-5">
        <Header coachName={coachName} recallType={recallType} />
        <ProgressBar progress={progress} />
        <p className="text-xs" style={{ color: "var(--ink-subtle)" }}>
          Día {currentDay + 1} de {dayCount} · {dayLabel}
        </p>

        <h2 style={{ ...cormorant, fontSize: "24px", color: "var(--ink-strong)", margin: 0 }}>
          {dayLabel}
        </h2>
        <p className="text-sm" style={{ color: "var(--ink-muted)", marginTop: 0 }}>
          Registra todo lo que comiste y bebiste. Incluye cantidades aproximadas.
        </p>

        <div className="space-y-4">
          {MEAL_KEYS.map((meal) => (
            <div key={meal}>
              <label className="label">
                {MEAL_LABELS[meal].emoji} {MEAL_LABELS[meal].label}
              </label>
              <textarea
                className="input"
                value={dayValues[meal] ?? ""}
                onChange={(e) => setMealValue(currentDay, meal, e.target.value)}
                placeholder={getPlaceholder(meal)}
                rows={3}
                style={{ resize: "vertical" }}
              />
            </div>
          ))}

          <div>
            <label className="label">💧 Agua (vasos o litros)</label>
            <input
              className="input"
              type="text"
              value={dayValues.agua ?? ""}
              onChange={(e) => setDayField(currentDay, "agua", e.target.value)}
              placeholder="Ej: 8 vasos, 2 litros..."
            />
          </div>

          <div>
            <label className="label">📝 Notas del día</label>
            <textarea
              className="input"
              value={dayValues.notas ?? ""}
              onChange={(e) => setDayField(currentDay, "notas", e.target.value)}
              placeholder="¿Algo especial? ¿Entrenaste? ¿Comiste fuera?"
              rows={2}
              style={{ resize: "vertical" }}
            />
          </div>
        </div>

        {error && <p className="text-xs" style={{ color: "#fb7185" }}>{error}</p>}

        <div className="flex justify-between gap-3 pt-2">
          <button
            className="btn btn-ghost"
            onClick={() => setCurrentDay((d) => Math.max(0, d - 1))}
            disabled={currentDay === 0}
            style={{ opacity: currentDay === 0 ? 0.4 : 1 }}
          >
            Atrás
          </button>
          {currentDay < dayCount - 1 ? (
            <button className="btn btn-brand" onClick={() => setCurrentDay((d) => d + 1)}>
              Siguiente día
            </button>
          ) : (
            <button className="btn btn-brand" onClick={() => setShowExtras(true)}>
              Continuar
            </button>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 640 }}>
        <div className="flex items-center gap-2 mb-6">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0a0a0a",
              fontWeight: 900,
              fontSize: 14,
            }}
          >
            A
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "var(--ink-strong)" }}>
            Anthroscope
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

function Header({ coachName, recallType }: { coachName: string; recallType: RecallType }) {
  return (
    <p className="text-xs" style={{ color: "var(--ink-muted)", margin: 0 }}>
      {RECALL_TYPE_LABELS[recallType]} · Enviado por{" "}
      <strong style={{ color: "var(--ink-strong)" }}>{coachName}</strong>
    </p>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div
      style={{
        height: 6,
        background: "var(--surface-sunken)",
        borderRadius: 99,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: "100%",
          background: "var(--gold)",
          transition: "width 0.3s",
          borderRadius: 99,
        }}
      />
    </div>
  );
}
