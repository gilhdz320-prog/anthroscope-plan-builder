import { BILLING, formatPrice } from "@/lib/billing/config";
import { ctaButton, mutedParagraph, paragraph, renderEmail } from "./layout";

const PRICE = formatPrice(BILLING.plans.monthly.amount);

/** Se envía al crear la cuenta: empieza el trial de 14 días. */
export function buildTrialStartedEmail({ appUrl }: { appUrl: string }) {
  const subject = "Tu prueba de 14 días empieza hoy · Plan Builder";
  const body = [
    paragraph(
      `Tu cuenta está activa con <strong>14 días de prueba</strong>, sin tarjeta. Tienes acceso completo: pacientes, planes con SMAE, equivalentes, PDF con tu marca y portal del paciente.`,
    ),
    paragraph(
      `Para sacarle provecho en la primera sesión: crea un paciente, arma su plan y genera el PDF. Son unos 10 minutos y ya tienes algo que enseñar en consulta.`,
    ),
    ctaButton(`${appUrl}/dashboard/patients/new`, "Crear mi primer paciente"),
    mutedParagraph(
      `Cuando termine la prueba puedes seguir por ${PRICE} MXN al mes. Te avisaremos tres días antes; no se cobra nada automáticamente.`,
    ),
  ].join("");

  return {
    subject,
    text: `Tu prueba de 14 días empieza hoy.\n\nCrea tu primer paciente: ${appUrl}/dashboard/patients/new\n\nDespués de la prueba: ${PRICE} MXN al mes.\n\n— Anthroscope`,
    html: renderEmail({
      eyebrow: "Prueba iniciada · 14 días",
      title: "Bienvenida a <em style=\"color:#C9A24A;\">Anthroscope</em>",
      subtitle: "Plan Builder",
      preheader: "14 días de acceso completo, sin tarjeta.",
      bodyHtml: body,
    }),
  };
}

/** Se envía 3 días antes de que termine el trial (cron diario). */
export function buildTrialEndingEmail({
  appUrl,
  daysLeft,
}: {
  appUrl: string;
  daysLeft: number;
}) {
  const subject =
    daysLeft <= 1
      ? "Tu prueba termina mañana · Plan Builder"
      : `Tu prueba termina en ${daysLeft} días · Plan Builder`;

  const body = [
    paragraph(
      `Te quedan <strong>${daysLeft} ${daysLeft === 1 ? "día" : "días"}</strong> de prueba. Si quieres conservar tus pacientes, planes y plantillas, activa tu suscripción antes de que termine.`,
    ),
    paragraph(
      `Son ${PRICE} MXN al mes (o ${formatPrice(BILLING.plans.annual.amount)} al año, con dos meses incluidos). Puedes cancelar cuando quieras desde el portal de facturación.`,
    ),
    ctaButton(`${appUrl}/suscripcion`, "Activar mi suscripción"),
    mutedParagraph(
      "Si no activas, tu cuenta se pausa pero no se borra: tus datos siguen ahí por si vuelves.",
    ),
  ].join("");

  return {
    subject,
    text: `Te quedan ${daysLeft} días de prueba. Activa tu suscripción: ${appUrl}/suscripcion — ${PRICE} MXN/mes.`,
    html: renderEmail({
      eyebrow: "Prueba por terminar",
      title: "No pierdas tus planes",
      subtitle: `${daysLeft} ${daysLeft === 1 ? "día" : "días"} restantes`,
      preheader: `Tu prueba termina en ${daysLeft} días.`,
      bodyHtml: body,
    }),
  };
}

/** Se envía cuando un pago falla (dunning). */
export function buildPaymentFailedEmail({
  appUrl,
  graceDays,
}: {
  appUrl: string;
  graceDays: number;
}) {
  const subject = "No pudimos cobrar tu suscripción · Plan Builder";

  const body = [
    paragraph(
      `Stripe rechazó el último cobro de tu suscripción. Suele pasar por fondos, límite de la tarjeta o porque la tarjeta caducó.`,
    ),
    paragraph(
      `Tienes <strong>${graceDays} días</strong> para actualizar el método de pago antes de que se pause el acceso. Tus datos no se tocan.`,
    ),
    ctaButton(`${appUrl}/suscripcion`, "Actualizar mi tarjeta"),
    mutedParagraph(
      "Si ya lo resolviste, ignora este correo: Stripe reintenta el cobro automáticamente en los próximos días.",
    ),
  ].join("");

  return {
    subject,
    text: `No pudimos cobrar tu suscripción. Actualiza tu tarjeta: ${appUrl}/suscripcion (tienes ${graceDays} días de gracia).`,
    html: renderEmail({
      eyebrow: "Pago rechazado",
      title: "Actualiza tu método de pago",
      subtitle: `${graceDays} días de gracia`,
      preheader: "Stripe rechazó el cobro de tu suscripción.",
      bodyHtml: body,
    }),
  };
}

/** Se envía al confirmarse la suscripción. */
export function buildSubscriptionStartedEmail({
  appUrl,
  plan,
}: {
  appUrl: string;
  plan: "monthly" | "annual";
}) {
  const amount =
    plan === "annual"
      ? formatPrice(BILLING.plans.annual.amount)
      : formatPrice(BILLING.plans.monthly.amount);
  const period = plan === "annual" ? "año" : "mes";

  const body = [
    paragraph(
      `Tu suscripción está activa: <strong>${amount} MXN por ${period}</strong>. Ya puedes usar el Plan Builder sin límites de pacientes.`,
    ),
    paragraph(
      "Desde el portal de facturación puedes cambiar tu tarjeta, descargar facturas o cancelar en cualquier momento.",
    ),
    ctaButton(`${appUrl}/dashboard`, "Ir a mi panel"),
    mutedParagraph(
      "Gracias por confiar en una herramienta hecha para la consulta de nutrición en México.",
    ),
  ].join("");

  return {
    subject: "Suscripción activa · Plan Builder",
    text: `Tu suscripción está activa (${amount} MXN por ${period}). Entra a ${appUrl}/dashboard`,
    html: renderEmail({
      eyebrow: "Suscripción activa",
      title: "Todo listo",
      subtitle: `${amount} MXN / ${period}`,
      preheader: "Tu suscripción está activa.",
      bodyHtml: body,
    }),
  };
}

/** Se envía cuando la suscripción se cancela del todo. */
export function buildSubscriptionCanceledEmail({ appUrl }: { appUrl: string }) {
  const body = [
    paragraph(
      "Tu suscripción se canceló y el acceso al panel quedó pausado. Tus pacientes, planes y plantillas siguen guardados.",
    ),
    paragraph(
      "Si quieres volver, puedes reactivarla cuando quieras y retomás exactamente donde lo dejaste.",
    ),
    ctaButton(`${appUrl}/suscripcion`, "Reactivar mi cuenta"),
  ].join("");

  return {
    subject: "Tu suscripción se canceló · Plan Builder",
    text: `Tu suscripción se canceló. Puedes reactivarla en ${appUrl}/suscripcion`,
    html: renderEmail({
      eyebrow: "Suscripción cancelada",
      title: "Tu cuenta queda en pausa",
      subtitle: "Sin perder tus datos",
      bodyHtml: body,
    }),
  };
}
