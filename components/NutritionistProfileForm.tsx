"use client";

import { useState, useTransition } from "react";
import {
  upsertProfile,
  type NutritionistProfile,
} from "@/app/dashboard/settings/profile-actions";

interface Field {
  name: keyof NutritionistProfile;
  label: string;
  type?: string;
  placeholder?: string;
}

const FIELDS: Field[] = [
  { name: "professional_name", label: "Nombre profesional · Professional name", placeholder: "Lic. Ana García" },
  { name: "clinic_name", label: "Nombre de clínica · Clinic name", placeholder: "Nutrición Integral" },
  { name: "license_number", label: "Cédula profesional · License number", placeholder: "1234567" },
  { name: "specialty", label: "Especialidad · Specialty", placeholder: "Nutrición deportiva" },
  { name: "phone", label: "Teléfono · Phone", placeholder: "+52 55 1234 5678" },
  { name: "address", label: "Ciudad · City", placeholder: "Ciudad de México" },
  { name: "website", label: "Sitio web · Website", placeholder: "www.miclinica.com" },
  { name: "logo_url", label: "Logo URL", placeholder: "https://…/logo.png" },
  { name: "signature_url", label: "Firma URL · Signature URL", placeholder: "https://…/firma.png" },
];

export function NutritionistProfileForm({
  profile,
}: {
  profile: NutritionistProfile | null;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState<"idle" | "ok" | "error">("idle");
  const [accent, setAccent] = useState(profile?.accent_color ?? "#c9a961");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await upsertProfile(formData);
      setSaved(res.ok ? "ok" : "error");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      {FIELDS.map((f) => (
        <div key={f.name}>
          <label className="label" htmlFor={`np_${f.name}`}>
            {f.label}
          </label>
          <input
            id={`np_${f.name}`}
            name={f.name}
            type={f.type ?? "text"}
            defaultValue={(profile?.[f.name] as string | null) ?? ""}
            placeholder={f.placeholder}
            className="input"
          />
        </div>
      ))}

      <div>
        <label className="label" htmlFor="np_accent_color">
          Color de acento del PDF · PDF accent color
        </label>
        <div className="flex items-center gap-3">
          <input
            id="np_accent_color"
            name="accent_color"
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="h-10 w-16 cursor-pointer rounded-md border"
            style={{ borderColor: "var(--border-default)", background: "transparent" }}
          />
          <span className="font-mono-tabular text-sm" style={{ color: "var(--ink-muted)" }}>
            {accent}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button type="submit" className="btn btn-brand" disabled={pending}>
          {pending ? "Guardando…" : "Guardar perfil · Save"}
        </button>
        {saved === "ok" && (
          <span className="text-sm" style={{ color: "var(--brand-600, #0F7B5C)" }}>
            ✓ Guardado
          </span>
        )}
        {saved === "error" && (
          <span className="text-sm" style={{ color: "#c0392b" }}>
            No se pudo guardar
          </span>
        )}
      </div>
    </form>
  );
}
