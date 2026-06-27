interface AccessCodeEmailParams {
  code: string;
  customerEmail: string;
  signupUrl: string;
}

export function buildAccessCodeEmail({
  code,
  signupUrl,
}: AccessCodeEmailParams) {
  const subject =
    "Tu acceso a Anthroscope Plan Builder está listo · Your access is ready";

  const text = `
Anthroscope Plan Builder

Gracias por tu compra.

Tu código de acceso es:

${code}

Para activar tu cuenta:
1. Ve a ${signupUrl}
2. Pega el código de acceso
3. Crea tu cuenta con tu correo y contraseña
4. Comienza a construir planes profesionales

El código es válido una sola vez. Guárdalo en un lugar seguro.

— Anthroscope
`.trim();

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#F8F5EE;font-family:Helvetica,Arial,sans-serif;color:#1B2520;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8F5EE;padding:40px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

            <!-- Header / brand strip (dark, gold accent) -->
            <tr>
              <td style="background:#0E1410;padding:40px 40px 36px 40px;border-radius:14px 14px 0 0;position:relative;">
                <div style="height:3px;background:#C9A24A;width:48px;margin-bottom:24px;"></div>
                <p style="margin:0;font-size:10px;letter-spacing:3px;color:#C9A24A;text-transform:uppercase;">
                  Acceso confirmado · Access granted
                </p>
                <p style="margin:18px 0 0 0;font-family:Georgia,serif;font-size:30px;line-height:1.1;letter-spacing:-0.6px;color:#F8F5EE;">
                  Bienvenido a <em style="color:#C9A24A;">Anthroscope</em>
                </p>
                <p style="margin:4px 0 0 0;font-family:Georgia,serif;font-size:18px;color:#9CA39D;letter-spacing:-0.3px;">
                  Plan Builder · Edición Pro
                </p>
              </td>
            </tr>

            <!-- Body (ivory paper) -->
            <tr>
              <td style="background:#FFFFFF;padding:40px;border-left:1px solid #ECE6D8;border-right:1px solid #ECE6D8;">
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.55;color:#1B2520;">
                  Gracias por tu compra. Tu cuenta está lista para activarse.
                </p>

                <p style="margin:0 0 8px 0;font-size:10px;letter-spacing:2px;color:#0F7B5C;text-transform:uppercase;">
                  Tu código de acceso · Your access code
                </p>

                <!-- Code box -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 28px 0;">
                  <tr>
                    <td align="center" style="background:#F0EBE0;border:1px dashed #C9A24A;border-radius:8px;padding:22px 16px;">
                      <p style="margin:0;font-family:Menlo,Monaco,Consolas,monospace;font-size:22px;letter-spacing:3px;color:#0E1410;font-weight:bold;">
                        ${code}
                      </p>
                      <p style="margin:8px 0 0 0;font-size:10px;letter-spacing:1.6px;color:#8A938D;text-transform:uppercase;">
                        Válido una sola vez · Single-use
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- CTA -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                  <tr>
                    <td align="center" style="background:#0F7B5C;border-radius:8px;">
                      <a href="${signupUrl}"
                         style="display:inline-block;padding:14px 28px;font-size:14px;color:#F8F5EE;text-decoration:none;font-weight:600;letter-spacing:0.2px;">
                        Activar mi cuenta →
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Steps -->
                <p style="margin:32px 0 12px 0;font-size:10px;letter-spacing:2px;color:#5A655F;text-transform:uppercase;">
                  Cómo activar · How to activate
                </p>
                <ol style="margin:0;padding-left:18px;font-size:14px;line-height:1.7;color:#1B2520;">
                  <li>Ve a <a href="${signupUrl}" style="color:#0F7B5C;">la página de registro</a></li>
                  <li>Pega tu código de acceso</li>
                  <li>Crea tu cuenta con tu correo y contraseña</li>
                  <li>Comienza a construir planes profesionales</li>
                </ol>

                <p style="margin:28px 0 0 0;font-size:12px;line-height:1.55;color:#5A655F;">
                  El código se desactiva una vez que creas tu cuenta. Guárdalo
                  en un lugar seguro hasta entonces. Si tienes problemas,
                  responde a este correo.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#FFFFFF;padding:24px 40px 36px 40px;border-left:1px solid #ECE6D8;border-right:1px solid #ECE6D8;border-bottom:1px solid #ECE6D8;border-radius:0 0 14px 14px;text-align:center;">
                <div style="height:1px;background:#ECE6D8;margin:0 auto 20px auto;width:60%;"></div>
                <p style="margin:0;font-size:9px;letter-spacing:2.4px;color:#8A938D;text-transform:uppercase;">
                  Powered by
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

  return { subject, text, html };
}
