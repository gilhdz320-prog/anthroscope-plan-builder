/**
 * Layout compartido para los correos del ciclo de vida (trial, pago, cancelación).
 * Mismo lenguaje visual que el correo de acceso: cabecera oscura con acento dorado,
 * cuerpo en papel marfil, CTA verde.
 */

type EmailLayoutParams = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  bodyHtml: string;
  preheader?: string;
  footerNote?: string;
};

export function renderEmail({
  eyebrow,
  title,
  subtitle,
  bodyHtml,
  preheader,
  footerNote,
}: EmailLayoutParams): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#F8F5EE;font-family:Helvetica,Arial,sans-serif;color:#1B2520;">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8F5EE;padding:40px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
            <tr>
              <td style="background:#0E1410;padding:40px 40px 36px 40px;border-radius:14px 14px 0 0;">
                <div style="height:3px;background:#C9A24A;width:48px;margin-bottom:24px;"></div>
                <p style="margin:0;font-size:10px;letter-spacing:3px;color:#C9A24A;text-transform:uppercase;">
                  ${eyebrow}
                </p>
                <p style="margin:18px 0 0 0;font-family:Georgia,serif;font-size:30px;line-height:1.1;letter-spacing:-0.6px;color:#F8F5EE;">
                  ${title}
                </p>
                ${
                  subtitle
                    ? `<p style="margin:6px 0 0 0;font-family:Georgia,serif;font-size:17px;color:#9CA39D;letter-spacing:-0.3px;">${subtitle}</p>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="background:#FFFFFF;padding:40px;border-left:1px solid #ECE6D8;border-right:1px solid #ECE6D8;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="background:#FFFFFF;padding:24px 40px 36px 40px;border-left:1px solid #ECE6D8;border-right:1px solid #ECE6D8;border-bottom:1px solid #ECE6D8;border-radius:0 0 14px 14px;text-align:center;">
                <div style="height:1px;background:#ECE6D8;margin:0 auto 20px auto;width:60%;"></div>
                <p style="margin:0;font-size:9px;letter-spacing:2.4px;color:#8A938D;text-transform:uppercase;">
                  ${footerNote ?? "Anthroscope Plan Builder"}
                </p>
                <p style="margin:6px 0 0 0;font-family:Georgia,serif;font-size:14px;font-style:italic;color:#0A5B45;letter-spacing:-0.2px;">
                  Anthroscope
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 0 auto;">
    <tr>
      <td align="center" style="background:#0F7B5C;border-radius:8px;">
        <a href="${href}" style="display:inline-block;padding:14px 28px;font-size:14px;color:#F8F5EE;text-decoration:none;font-weight:600;letter-spacing:0.2px;">
          ${label} →
        </a>
      </td>
    </tr>
  </table>`;
}

export function paragraph(html: string): string {
  return `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.55;color:#1B2520;">${html}</p>`;
}

export function mutedParagraph(html: string): string {
  return `<p style="margin:24px 0 0 0;font-size:12px;line-height:1.55;color:#5A655F;">${html}</p>`;
}
