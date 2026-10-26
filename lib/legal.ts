/**
 * Datos legales del responsable del servicio.
 *
 * ÚNICO lugar donde se editan: se usan en /privacidad y /terminos.
 * Mientras estén los corchetes, las páginas son un borrador: no publiques
 * cobrando hasta completarlos (ver docs/LEGAL-REVISION.md).
 */
export const LEGAL = {
  /** Tu nombre completo o razón social. Ej: "Gilbert Hernández" o "GH Nutrición S.A.S. de C.V." */
  responsable: "[TU NOMBRE O RAZÓN SOCIAL]",
  /** Domicilio para notificaciones legales (puede ser tu consultorio o casa). */
  domicilio: "[CALLE, NÚMERO, CIUDAD, ESTADO, MÉXICO]",
  /** Bandeja que revises de verdad: por aquí llegan las solicitudes ARCO (plazo legal). */
  emailPrivacidad: "privacidad@anthroscope.pro",
  /** Correo de contacto general. */
  emailContacto: "hola@anthroscope.pro",
  /** Fecha visible en el pie de los documentos. */
  actualizado: "octubre de 2026",
} as const;

export function legalIsComplete(): boolean {
  return !LEGAL.responsable.includes("[") && !LEGAL.domicilio.includes("[");
}
