# Cobros con Stripe — puesta en marcha

Este documento deja el sistema de suscripciones funcionando de punta a punta.
Tiempo estimado: 45–60 minutos (casi todo es clics en el dashboard de Stripe).

---

## 1. Crear los precios en Stripe

En [dashboard.stripe.com](https://dashboard.stripe.com) → **Product catalog → Add product**:

| Campo | Mensual | Anual |
|---|---|---|
| Nombre | `Anthroscope Plan Builder · Mensual` | `Anthroscope Plan Builder · Anual` |
| Precio | `199` `MXN` | `1990` `MXN` |
| Recurrencia | Mensual | Anual |

Después de crear cada precio, copia su **Price ID** (`price_...`) y ponlo en:

```
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_ANNUAL=price_...
```

> Si dejas esas variables vacías, el checkout crea el precio al vuelo con los
> importes de `lib/billing/config.ts`. Funciona, pero pierdes la posibilidad de
> cambiar el precio sin desplegar y los reportes quedan menos ordenados.

---

## 2. Configurar el webhook

**Developers → Webhooks → Add endpoint**

- URL: `https://TU_DOMINIO/api/stripe/webhook`
- Eventos a escuchar:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`

Copia el **Signing secret** (`whsec_...`) a `STRIPE_WEBHOOK_SECRET`.

Para probar en local:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 3. Activar el portal de facturación

**Settings → Billing → Customer portal** → activar. Recomendado habilitar:

- Actualizar método de pago
- Ver historial de facturas
- Cancelar suscripción (al final del periodo)

Sin esto, `/api/stripe/portal` devuelve error y la clienta no puede gestionar su
suscripción (tendrías que hacerlo tú a mano).

---

## 4. Reintentos de cobro (dunning)

**Settings → Billing → Manage failed payments**:

- Reintentos automáticos: **4 intentos en 21 días** (o la regla que prefieras).
- Marcar la suscripción como `unpaid` al final.

Nuestro código aplica **5 días de gracia** (`BILLING.graceDays`) tras un
`payment_failed` y avisa por correo con enlace al portal. Stripe hace los
reintentos; nosotros solo reflejamos el estado.

---

## 5. Variables de entorno

Copia `.env.example` a `.env.local` y completa. En Vercel: **Settings →
Environment Variables** (Production y Preview).

Checklist mínimo para que los cobros funcionen:

- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_APP_URL` (dominio real, con `https`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (el webhook escribe con service role)
- [ ] `RESEND_API_KEY` + `RESEND_FROM_EMAIL` (correos de alta, impago, aviso de trial)

---

## 6. Aplicar el SQL

Elige **un** camino según el estado de la base:

### Si la base ya tiene datos (pacientes reales) — lo normal

Pega **`supabase/apply-saas.sql`** completo. Es un solo archivo, idempotente y
**no borra nada**: solo crea la tabla de suscripciones, el trigger del trial, las
funciones de acceso y la tabla de métricas.

Incluye, en orden: `access_codes.sql` → `subscriptions.sql` → `analytics.sql`.
Se puede ejecutar dos veces sin efecto.

> Regenerarlo tras cambiar cualquiera de esos archivos:
> `pnpm db:apply-saas:build`

### Si la base está vacía (proyecto nuevo)

Pega **`supabase/bootstrap.sql`** (2.200+ líneas): crea todo el esquema, RLS y
catálogos. **No lo uses sobre una base con datos**: incluye `delete` de
catálogos y `ALTER TABLE` de migraciones antiguas.

### Verificar

```sql
select proname from pg_proc
where proname in ('user_has_app_access','trial_days_left','start_trial_on_signup');
-- deben salir 3 filas

select count(*) from information_schema.columns where table_name = 'subscriptions';
select tgname from pg_trigger where tgname = 'on_auth_user_created_trial';
```

---

## 7. Probar el flujo completo (modo test)

1. Crea una cuenta en `/signup` **sin código** → debe entrar en trial de 14 días.
2. Ve a `/suscripcion` → elige mensual → paga con `4242 4242 4242 4242`, cualquier
   fecha futura y CVC.
3. Vuelve a `/gracias` → entra al dashboard.
4. En Stripe, el webhook debe haber creado/actualizado `subscriptions`
   (`status = active`, `stripe_subscription_id` presente).
5. Abre el portal → cancela → el estado pasa a `canceled` al final del periodo.
6. Simula un impago: en Stripe, **Customers → suscripción → Add test clock** o usa
   `stripe trigger invoice.payment_failed`. Debe llegar el correo y verse el
   banner rojo con los días de gracia.

---

## 8. Cron de aviso de fin de prueba

`GET /api/cron/trial-reminders` con cabecera `Authorization: Bearer $CRON_SECRET`.

- En Vercel Cron: `0 15 * * *` (una vez al día).
- En Render/Cron-job.org: lo mismo, apuntando a la URL.

Es idempotente: usa `subscriptions.trial_reminder_sent_at` para no repetir el aviso.

---

## 9. Qué hace el sistema (para no tocarlo sin querer)

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Precios y trial | `lib/billing/config.ts` | 199/1.990 MXN, 14 días, 5 de gracia |
| Acceso | `lib/billing/access.ts` | trial / activo / past_due / legacy |
| Sincronización | `lib/billing/sync.ts` | refleja Stripe → `subscriptions` |
| Checkout | `app/api/checkout/route.ts` | suscripción, trial solo la primera vez |
| Portal | `app/api/stripe/portal/route.ts` | tarjeta, facturas, cancelar |
| Webhook | `app/api/stripe/webhook/route.ts` | alta, impago, cancelación, legacy |
| Bloqueo | `app/dashboard/layout.tsx` | sin acceso → `/suscripcion` |

**Regla:** el acceso se decide en `subscriptions` (BD), no en Stripe en vivo. Stripe
es la fuente de verdad, pero la app nunca llama a Stripe en cada request.
