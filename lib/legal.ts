/**
 * Datos legales del responsable del servicio.
 *
 * Se leen de variables de entorno para que el domicilio NO viva en el
 * repositorio (que es público). Se configuran en Vercel:
 *
 *   NEXT_PUBLIC_LEGAL_RESPONSABLE        "Gilbert Hernández" | "GH Nutrición S.A.S. de C.V."
 *   NEXT_PUBLIC_LEGAL_DOMICILIO          "Calle 123, Col. Centro, Hermosillo, Sonora, CP 83000"
 *   NEXT_PUBLIC_LEGAL_EMAIL_PRIVACIDAD   privacidad@anthroscope.pro
 *   NEXT_PUBLIC_LEGAL_EMAIL_CONTACTO     hola@anthroscope.pro
 *   NEXT_PUBLIC_LEGAL_ACTUALIZADO        "octubre de 2026"
 *
 * Mientras el responsable o el domicilio tengan corchetes, las páginas son un
 * borrador: no publiques cobrando sin completarlos (ver docs/LEGAL-REVISION.md).
 */

function env(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

export const LEGAL = {
  responsable: env(
    "NEXT_PUBLIC_LEGAL_RESPONSABLE",
    "[TU NOMBRE O RAZÓN SOCIAL]",
  ),
  domicilio: env(
    "NEXT_PUBLIC_LEGAL_DOMICILIO",
    "[CALLE, NÚMERO, CIUDAD, ESTADO, MÉXICO]",
  ),
  emailPrivacidad: env(
    "NEXT_PUBLIC_LEGAL_EMAIL_PRIVACIDAD",
    "privacidad@anthroscope.pro",
  ),
  emailContacto: env(
    "NEXT_PUBLIC_LEGAL_EMAIL_CONTACTO",
    "hola@anthroscope.pro",
  ),
  actualizado: env("NEXT_PUBLIC_LEGAL_ACTUALIZADO", "octubre de 2026"),
} as const;

/** true cuando ya hay responsable y domicilio reales (sin corchetes). */
export function legalIsComplete(): boolean {
  return !LEGAL.responsable.includes("[") && !LEGAL.domicilio.includes("[");
}
