import { Resend } from "resend";

let cached: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!cached) cached = new Resend(key);
  return cached;
}

const FROM =
  process.env.RESEND_FROM_EMAIL ?? "Anthroscope <no-reply@anthroscope.pro>";

type SendParams = { to: string; subject: string; html: string; text: string };

/**
 * Envía un correo sin lanzar excepciones: un fallo de email nunca debe
 * tumbar un webhook ni una server action.
 */
export async function sendEmail({ to, subject, html, text }: SendParams) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY no configurada; se omite:", subject);
    return { ok: false as const, reason: "not_configured" };
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html, text });
    return { ok: true as const };
  } catch (err) {
    console.error("[email] fallo al enviar:", subject, err);
    return { ok: false as const, reason: "send_failed" };
  }
}
