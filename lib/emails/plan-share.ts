import { ctaButton, mutedParagraph, paragraph, renderEmail } from "./layout";

/** Correo al paciente con el enlace a su plan. */
export function buildPlanShareEmail({
  patientName,
  planTitle,
  planUrl,
  practitionerName,
}: {
  patientName: string;
  planTitle: string;
  planUrl: string;
  practitionerName?: string | null;
}) {
  const from = practitionerName?.trim() || "Tu nutrióloga";
  const subject = `Tu plan de alimentación: ${planTitle}`;

  const body = [
    paragraph(`Hola ${patientName},`),
    paragraph(
      `${from} te compartió tu plan <strong>${planTitle}</strong>. Puedes verlo desde el celular, revisar las porciones de cada comida e intercambiar alimentos sin salirte de tus macros.`,
    ),
    ctaButton(planUrl, "Ver mi plan"),
    mutedParagraph(
      "Guarda este correo: el enlace es personal. Si tienes dudas sobre el plan, escríbele directamente a tu nutrióloga.",
    ),
  ].join("");

  return {
    subject,
    text: `Hola ${patientName},\n\n${from} te compartió tu plan "${planTitle}".\n\nÁbrelo aquí: ${planUrl}\n`,
    html: renderEmail({
      eyebrow: "Tu plan está listo",
      title: "Tu plan de alimentación",
      subtitle: planTitle,
      preheader: `${from} te compartió tu plan.`,
      bodyHtml: body,
    }),
  };
}
