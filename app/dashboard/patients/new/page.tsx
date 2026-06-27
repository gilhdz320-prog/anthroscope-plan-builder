import Link from "next/link";
import { createPatient } from "../actions";

export default async function NewPatientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="space-y-8">
      <div className="rise">
        <Link
          href="/dashboard/patients"
          className="text-xs"
          style={{ color: "var(--ink-subtle)" }}
        >
          ← Volver a pacientes
        </Link>
        <p className="eyebrow mt-4">Nuevo paciente</p>
        <h1
          className="font-display mt-2"
          style={{
            fontSize: "36px",
            color: "var(--ink-strong)",
            letterSpacing: "-0.025em",
            lineHeight: 1.02,
          }}
        >
          Crear expediente
        </h1>
        <p
          className="mt-2 max-w-xl text-sm"
          style={{ color: "var(--ink-muted)" }}
        >
          Solo nombre y apellido son obligatorios. El resto es opcional pero ayuda a personalizar el plan.
        </p>
      </div>

      {sp.error && (
        <div
          className="max-w-2xl rounded-md border p-3 text-xs"
          style={{
            background: "var(--danger-bg)",
            borderColor: "rgba(184,60,42,0.2)",
            color: "var(--danger)",
          }}
        >
          {sp.error}
        </div>
      )}

      <form action={createPatient} className="card-luxe max-w-3xl space-y-8 p-8 rise rise-1">
        {/* Basics */}
        <section className="space-y-5">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Datos básicos</p>
            <span
              className="font-display italic text-xs"
              style={{ color: "var(--ink-subtle)" }}
            >
              Basics
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="label">Nombre *</label>
              <input id="first_name" name="first_name" type="text" required className="input" />
            </div>
            <div>
              <label htmlFor="last_name" className="label">Apellido *</label>
              <input id="last_name" name="last_name" type="text" required className="input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="label">Correo</label>
              <input id="email" name="email" type="email" className="input" />
            </div>
            <div>
              <label htmlFor="phone" className="label">Teléfono</label>
              <input id="phone" name="phone" type="tel" className="input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="birth_date" className="label">Fecha de nacimiento</label>
              <input id="birth_date" name="birth_date" type="date" className="input" />
            </div>
            <div>
              <label htmlFor="sex" className="label">Sexo</label>
              <select id="sex" name="sex" className="input">
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
            <span
              className="font-display italic text-xs"
              style={{ color: "var(--ink-subtle)" }}
            >
              Anthropometry
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="weight_kg" className="label">Peso (kg)</label>
              <input id="weight_kg" name="weight_kg" type="number" step="0.1" className="input" />
            </div>
            <div>
              <label htmlFor="height_cm" className="label">Altura (cm)</label>
              <input id="height_cm" name="height_cm" type="number" step="0.1" className="input" />
            </div>
            <div>
              <label htmlFor="body_fat_pct" className="label">% Grasa</label>
              <input id="body_fat_pct" name="body_fat_pct" type="number" step="0.1" className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="waist_cm" className="label">Cintura (cm)</label>
              <input id="waist_cm" name="waist_cm" type="number" step="0.1" className="input" />
            </div>
            <div>
              <label htmlFor="hip_cm" className="label">Cadera (cm)</label>
              <input id="hip_cm" name="hip_cm" type="number" step="0.1" className="input" />
            </div>
          </div>
        </section>

        {/* Sport */}
        <section className="space-y-5 border-t pt-7" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Deporte y actividad</p>
            <span
              className="font-display italic text-xs"
              style={{ color: "var(--ink-subtle)" }}
            >
              Sport &amp; activity
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="sport" className="label">Deporte</label>
              <input id="sport" name="sport" type="text" placeholder="Fútbol, Atletismo…" className="input" />
            </div>
            <div>
              <label htmlFor="activity_level" className="label">Nivel de actividad</label>
              <select id="activity_level" name="activity_level" className="input">
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
              <select id="goal" name="goal" className="input">
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
            className="input resize-none"
          />
        </section>

        <div className="flex items-center gap-3 border-t pt-7" style={{ borderColor: "var(--border-subtle)" }}>
          <button type="submit" className="btn btn-brand">
            Guardar paciente
          </button>
          <Link
            href="/dashboard/patients"
            className="text-sm"
            style={{ color: "var(--ink-muted)" }}
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
