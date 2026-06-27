# Acceso pagado con códigos — Setup paso a paso

Este documento explica cómo activar el flujo completo:
**Cliente paga $57 en Stripe → recibe código por correo → puede crear cuenta.**

---

## 1. Aplicar el SQL en Supabase

1. Abre el SQL Editor de tu proyecto Supabase (`vdajfetrigxgzcfjfcls`).
2. Pega el contenido de `supabase/access_codes.sql` y ejecútalo.
3. Verifica que la tabla `public.access_codes` exista y que las funciones
   `is_valid_access_code`, `redeem_access_code` y `user_has_paid_access`
   estén creadas (Database → Functions).

> Resultado esperado: `Success. No rows returned`.

---

## 2. Crear el producto en Stripe

1. Ve a [dashboard.stripe.com](https://dashboard.stripe.com).
2. **Products → Add product**
   - Name: `Anthroscope Plan Builder · Edición Pro`
   - Description: `Acceso de por vida al Plan Builder. Equivalentes ADA + Sistema Mexicano (224 alimentos USDA bilingües), plantillas reutilizables, exportación PDF de lujo.`
   - Price: **$57 USD**, **One time**
   - (Opcional) Sube una imagen del PDF mockup.
3. Una vez creado, **Add a payment link**:
   - After payment → **Don't show confirmation page**, instead redirect to:
     `https://planbuilder.anthroscope.pro/gracias`
   - Collect customer email: **Always**
   - Save.
4. Copia la URL del Payment Link — la usarás en la landing de Anthroscope.

---

## 3. Configurar el webhook en Stripe

1. **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://planbuilder.anthroscope.pro/api/stripe/webhook`
3. Events to send:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
4. Después de crearlo, click **Reveal signing secret** y copia el `whsec_...`.

---

## 4. Configurar Resend

1. En [resend.com](https://resend.com), crea o usa una API key.
2. Verifica el dominio `anthroscope.pro` (Domains → Add domain).
3. Confirma que `no-reply@anthroscope.pro` puede enviar.

---

## 5. Variables de entorno

### En local (`.env.local`)

```
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Anthroscope <no-reply@anthroscope.pro>
```

### En Vercel (Production)

Ve a tu proyecto en Vercel → **Settings → Environment Variables** y agrega
las mismas 5 variables. Asegúrate de marcar **Production** (y Preview si
quieres que también funcionen los previews).

Después de agregar las vars, redeploya desde el dashboard de Vercel (o haz
un nuevo push).

---

## 6. Probar el flujo en TEST mode

1. Asegúrate de que `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` son los de
   **TEST**.
2. Abre tu Payment Link de TEST y paga con tarjeta `4242 4242 4242 4242`,
   fecha futura, CVC cualquiera.
3. Deberías:
   - Ser redirigido a `/gracias`
   - Recibir un correo de Resend con el código `APB-XXXX-XXXX-XXXX`
   - Poder ir a `/signup`, pegar el código, y crear cuenta
   - El código debe aparecer como `used_at` no nulo en la tabla
4. Intenta usar el mismo código otra vez → debe fallar con
   "Código inválido o ya usado".

Si todo funciona, repite el setup con las **LIVE keys** de Stripe.

---

## 7. Conectar la landing de Anthroscope

En la sección **"Productos Digitales"** de `app.anthroscope.pro/recursos`,
el botón "Comprar por $57" debe apuntar al Payment Link de Stripe (paso 2).

Stripe lleva al cliente a `/gracias` automáticamente tras pagar.

---

## Troubleshooting

- **No llega el correo**: revisa Resend dashboard → Logs. Verifica que el
  dominio esté verificado y que el remitente coincida con `RESEND_FROM_EMAIL`.
- **Webhook devuelve 400**: el `STRIPE_WEBHOOK_SECRET` no corresponde. Ve a
  Stripe → Webhooks → tu endpoint → Reveal signing secret y vuelve a pegarlo.
- **"Código inválido" pero ya pagó**: revisa la tabla `access_codes` en
  Supabase. Si el código no existe ahí, el webhook no llegó: revisa el log
  del endpoint en Stripe (Events → la sesión → Webhook attempts).
- **Webhook 500**: probablemente falta `SUPABASE_SERVICE_ROLE_KEY` en
  Vercel. Agrégalo y redeploya.
