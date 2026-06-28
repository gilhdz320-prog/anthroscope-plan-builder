"use client";

import { useEffect, useState } from "react";

const cormorant = {
  fontFamily: "var(--font-cormorant), ui-serif, Georgia, serif",
};

type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
type Goal = "lose_fat" | "maintain" | "gain_muscle";

const ACTIVITY_OPTIONS: {
  value: ActivityLevel;
  emoji: string;
  title: string;
  desc: string;
}[] = [
  { value: "sedentary", emoji: "🪑", title: "Sedentario", desc: "Poco o ningún ejercicio" },
  { value: "light", emoji: "🚶", title: "Ligero", desc: "1-3 días/semana" },
  { value: "moderate", emoji: "🏃", title: "Moderado", desc: "3-5 días/semana" },
  { value: "active", emoji: "💪", title: "Activo", desc: "6-7 días/semana" },
  { value: "very_active", emoji: "🔥", title: "Muy activo", desc: "Atleta / doble sesión" },
];

const GOAL_OPTIONS: { value: Goal; emoji: string; title: string }[] = [
  { value: "lose_fat", emoji: "⬇️", title: "Perder grasa" },
  { value: "maintain", emoji: "↔️", title: "Mantener peso" },
  { value: "gain_muscle", emoji: "⬆️", title: "Ganar músculo" },
];

function Logo() {
  return (
    <div className="text-center">
      <p
        className="text-[11px] font-medium uppercase tracking-[0.24em]"
        style={{ color: "var(--gold)" }}
      >
        Anthroscope
      </p>
      <h1
        className="mt-1"
        style={{ ...cormorant, fontSize: "34px", color: "var(--ink-strong)", lineHeight: 1.05 }}
      >
        Tu plan personalizado
      </h1>
    </div>
  );
}

export function IntakeFormClient({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "">("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activity, setActivity] = useState<ActivityLevel | "">("");
  const [goal, setGoal] = useState<Goal | "">("");
  const [hasBodyComp, setHasBodyComp] = useState(false);
  const [bodyFat, setBodyFat] = useState("");
  const [leanMass, setLeanMass] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/intake/${token}`, { cache: "no-store" });
        if (!active) return;
        if (res.status === 404) {
          setNotFound(true);
        } else if (res.ok) {
          const json = await res.json();
          if (json.intake?.status === "completed") setAlreadyDone(true);
          if (json.intake?.client_name) setFullName(json.intake.client_name);
        } else {
          setNotFound(true);
        }
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  function validate(): string | null {
    if (!fullName.trim()) return "Por favor escribe tu nombre completo.";
    const ageN = Number(age);
    if (!age || ageN < 10 || ageN > 100) return "Edad inválida (10-100).";
    if (sex !== "male" && sex !== "female") return "Selecciona tu sexo.";
    const hN = Number(heightCm);
    if (!heightCm || hN < 100 || hN > 250) return "Estatura inválida (100-250 cm).";
    const wN = Number(weightKg);
    if (!weightKg || wN < 30 || wN > 300) return "Peso inválido (30-300 kg).";
    if (!activity) return "Selecciona tu nivel de actividad.";
    if (!goal) return "Selecciona tu objetivo.";
    if (hasBodyComp) {
      const bf = Number(bodyFat);
      if (!bodyFat || bf < 3 || bf > 50) return "% de grasa inválido (3-50).";
      if (!leanMass || Number(leanMass) <= 0) return "Masa muscular inválida.";
    }
    return null;
  }

  async function handleSubmit() {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/intake/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: fullName,
          age: Number(age),
          sex,
          height_cm: Number(heightCm),
          weight_kg: Number(weightKg),
          activity_level: activity,
          goal,
          has_body_comp: hasBodyComp,
          body_fat_pct: hasBodyComp ? Number(bodyFat) : null,
          lean_mass_kg: hasBodyComp ? Number(leanMass) : null,
          client_notes: notes || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "No se pudo enviar. Intenta de nuevo.");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("No se pudo enviar. Revisa tu conexión e intenta de nuevo.");
      setSubmitting(false);
    }
  }

  const shell = (children: React.ReactNode) => (
    <div
      className="dashboard-dark flex min-h-screen flex-col items-center px-4 py-10"
      style={{ background: "#0a0a0a" }}
    >
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );

  if (loading) {
    return shell(
      <div className="card-luxe p-10 text-center" style={{ color: "var(--ink-muted)" }}>
        <span className="spinner" /> Cargando…
      </div>,
    );
  }

  if (notFound) {
    return shell(
      <div className="card-luxe p-10 text-center">
        <Logo />
        <p className="mt-6 text-sm" style={{ color: "var(--ink-muted)" }}>
          Este enlace no es válido o ya no está disponible. Pide a tu nutriólogo
          un nuevo enlace.
        </p>
      </div>,
    );
  }

  if (alreadyDone || submitted) {
    return shell(
      <div className="card-luxe p-10 text-center">
        <Logo />
        <div
          className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "rgba(201,169,97,0.12)", color: "var(--gold)" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className="mt-5" style={{ ...cormorant, fontSize: "26px", color: "var(--ink-strong)" }}>
          ¡Gracias!
        </h2>
        <p className="mt-3 text-sm" style={{ color: "var(--ink-muted)" }}>
          Tu nutriólogo recibirá tus datos y preparará tu plan personalizado.
        </p>
      </div>,
    );
  }

  return shell(
    <div className="space-y-6">
      <div className="card-luxe p-8">
        <Logo />
        <p className="mt-4 text-center text-sm" style={{ color: "var(--ink-muted)" }}>
          Completa tus datos para que tu nutriólogo prepare un plan a tu medida.
        </p>
      </div>

      {/* Sección 1 */}
      <Section title="Datos personales" eyebrow="Sección 1">
        <Field label="Nombre completo">
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Edad">
            <input className="input" type="number" min={10} max={100} value={age} onChange={(e) => setAge(e.target.value)} />
          </Field>
          <Field label="Sexo">
            <div className="flex gap-2">
              {(["male", "female"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSex(s)}
                  className="flex-1 rounded-md px-3 py-2 text-sm transition-colors"
                  style={{
                    background: sex === s ? "var(--gold)" : "var(--surface-sunken)",
                    color: sex === s ? "#0a0a0a" : "var(--ink-muted)",
                    border: `1px solid ${sex === s ? "var(--gold)" : "#2a2a2a"}`,
                    fontWeight: sex === s ? 600 : 500,
                  }}
                >
                  {s === "male" ? "Hombre" : "Mujer"}
                </button>
              ))}
            </div>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Estatura (cm)">
            <input className="input" type="number" min={100} max={250} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
          </Field>
          <Field label="Peso actual (kg)">
            <input className="input" type="number" min={30} max={300} step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Sección 2 */}
      <Section title="Actividad física" eyebrow="Sección 2">
        <div className="space-y-2.5">
          {ACTIVITY_OPTIONS.map((o) => {
            const active = activity === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setActivity(o.value)}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors"
                style={{
                  background: active ? "rgba(201,169,97,0.12)" : "var(--surface-sunken)",
                  border: `1px solid ${active ? "var(--gold)" : "#2a2a2a"}`,
                }}
              >
                <span className="text-2xl">{o.emoji}</span>
                <span>
                  <span className="block text-sm font-semibold" style={{ color: active ? "var(--gold)" : "var(--ink-strong)" }}>
                    {o.title}
                  </span>
                  <span className="block text-xs" style={{ color: "var(--ink-subtle)" }}>
                    {o.desc}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Sección 3 */}
      <Section title="Objetivo" eyebrow="Sección 3">
        <div className="grid grid-cols-3 gap-2.5">
          {GOAL_OPTIONS.map((o) => {
            const active = goal === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setGoal(o.value)}
                className="flex flex-col items-center gap-2 rounded-lg p-3 text-center transition-colors"
                style={{
                  background: active ? "rgba(201,169,97,0.12)" : "var(--surface-sunken)",
                  border: `1px solid ${active ? "var(--gold)" : "#2a2a2a"}`,
                }}
              >
                <span className="text-2xl">{o.emoji}</span>
                <span className="text-xs font-medium" style={{ color: active ? "var(--gold)" : "var(--ink-strong)" }}>
                  {o.title}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Sección 4 */}
      <Section title="Composición corporal" eyebrow="Sección 4 · opcional">
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" checked={hasBodyComp} onChange={(e) => setHasBodyComp(e.target.checked)} />
          <span className="text-sm" style={{ color: "var(--ink-muted)" }}>
            ¿Tienes una evaluación de composición corporal reciente?
          </span>
        </label>
        {hasBodyComp && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="% grasa corporal">
                <input className="input" type="number" min={3} max={50} step="0.1" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
              </Field>
              <Field label="Masa muscular (kg)">
                <input className="input" type="number" min={1} step="0.1" value={leanMass} onChange={(e) => setLeanMass(e.target.value)} />
              </Field>
            </div>
            <p className="text-xs" style={{ color: "var(--ink-subtle)" }}>
              Si tienes estos datos, el cálculo será más preciso.
            </p>
          </div>
        )}
      </Section>

      {/* Sección 5 */}
      <Section title="Notas adicionales" eyebrow="Sección 5 · opcional">
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="Alergias, preferencias, lesiones, contexto…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Section>

      {error && (
        <div
          className="rounded-md border p-3 text-xs"
          style={{ background: "rgba(244,63,94,0.1)", borderColor: "rgba(244,63,94,0.3)", color: "#fb7185" }}
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="btn btn-brand w-full justify-center"
        style={{ opacity: submitting ? 0.6 : 1, padding: "12px" }}
      >
        {submitting && <span className="spinner" />}
        Enviar mis datos al nutriólogo
      </button>

      <p className="pb-6 text-center text-[11px]" style={{ color: "var(--ink-subtle)" }}>
        Powered by Anthroscope
      </p>
    </div>,
  );
}

function Section({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-luxe space-y-4 p-6">
      <div>
        <p className="eyebrow" style={{ color: "var(--gold)" }}>
          {eyebrow}
        </p>
        <h2 className="mt-1" style={{ ...cormorant, fontSize: "22px", color: "var(--ink-strong)" }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
