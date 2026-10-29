import Link from "next/link";
import { AnthropometryFields } from "./AnthropometryFields";

export type PatientDefaults = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  sex?: string | null;
  sport?: string | null;
  activity_level?: string | null;
  goal?: string | null;
  notes?: string | null;
  weight_kg?: number | string | null;
  height_cm?: number | string | null;
  body_fat_pct?: number | string | null;
  waist_cm?: number | string | null;
  hip_cm?: number | string | null;
  [key: string]: unknown;
};

/**
 * Formulario de paciente compartido por "nuevo" y "editar".
 * Un solo lugar para los campos evita que se desincronicen las dos pantallas.
 */
export function PatientForm({
  action,
  defaults = {},
  submitLabel,
  cancelHref = "/dashboard/patients",
  error,
  hidden,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: PatientDefaults;
  submitLabel: string;
  cancelHref?: string;
  error?: string | null;
  /** Campos ocultos (ej. id del paciente al editar). */
  hidden?: Record<string, string>;
}) {
  const value = (key: keyof PatientDefaults) => {
    const raw = defaults[key];
    return raw == null ? "" : String(raw);
  };

  return (
    <>
      {error && (
        <div
          className="max-w-2xl rounded-md border p-3 text-xs"
          style={{
            background: "var(--danger-bg)",
            borderColor: "rgba(184,60,42,0.2)",
            color: "var(--danger)",
          }}
        >
          {error}
        </div>
      )}

      <form action={action} className="card-luxe max-w-3xl space-y-8 p-8 rise rise-1">
        {hidden &&
          Object.entries(hidden).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
        {/* Basics */}
        <section className="space-y-5">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Datos básicos</p>
            <span className="font-display italic text-xs" style={{ color: "var(--ink-subtle)" }}>
              Basics
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="label">Nombre *</label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                defaultValue={value("first_name")}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="label">Apellido *</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                defaultValue={value("last_name")}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="label">Correo</label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={value("email")}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="phone" className="label">Teléfono</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={value("phone")}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="birth_date" className="label">Fecha de nacimiento</label>
              <input
                id="birth_date"
                name="birth_date"
                type="date"
                defaultValue={value("birth_date")}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="sex" className="label">Sexo</label>
              <select id="sex" name="sex" defaultValue={value("sex")} className="input">
                <option value="">Seleccionar</option>
                <option value="female">Femenino</option>
                <option value="male">Masculino</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>
        </section>

        {/* Anthropometry */}
        <section className="space-y-5 border-t pt-7" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Antropometría (opcional)</p>
            <span className="font-display italic text-xs" style={{ color: "var(--ink-subtle)" }}>
              Anthropometry
            </span>
          </div>
          {/* Campos + índices derivados en vivo (IMC, ICC, ICT, %grasa est.) */}
          <AnthropometryFields defaults={defaults} />
        </section>

        {/* Sport */}
        <section className="space-y-5 border-t pt-7" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Deporte y actividad</p>
            <span className="font-display italic text-xs" style={{ color: "var(--ink-subtle)" }}>
              Sport &amp; activity
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="sport" className="label">Deporte</label>
              <input
                id="sport"
                name="sport"
                type="text"
                placeholder="Fútbol, Atletismo…"
                defaultValue={value("sport")}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="activity_level" className="label">Nivel de actividad</label>
              <select
                id="activity_level"
                name="activity_level"
                defaultValue={value("activity_level")}
                className="input"
              >
                <option value="">Seleccionar</option>
                <option value="sedentary">Sedentario</option>
                <option value="light">Ligero</option>
                <option value="moderate">Moderado</option>
                <option value="active">Activo</option>
                <option value="very_active">Muy activo</option>
              </select>
            </div>
            <div>
              <label htmlFor="goal" className="label">Objetivo</label>
              <select id="goal" name="goal" defaultValue={value("goal")} className="input">
                <option value="">Seleccionar</option>
                <option value="weight_loss">Pérdida de peso</option>
                <option value="maintenance">Mantenimiento</option>
                <option value="muscle_gain">Ganancia muscular</option>
                <option value="performance">Rendimiento</option>
              </select>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className="border-t pt-7" style={{ borderColor: "var(--border-subtle)" }}>
          <label htmlFor="notes" className="label">Notas</label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Alergias, condiciones relevantes, contexto…"
            defaultValue={value("notes")}
            className="input resize-none"
          />
        </section>

        <div className="flex items-center gap-3 border-t pt-7" style={{ borderColor: "var(--border-subtle)" }}>
          <button type="submit" className="btn btn-brand">
            {submitLabel}
          </button>
          <Link href={cancelHref} className="text-sm" style={{ color: "var(--ink-muted)" }}>
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}
