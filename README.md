# Anthroscope Plan Builder

Software para nutricionistas en México: pacientes, planes alimentarios con
equivalentes SMAE, PDF con marca propia y portal del paciente.

- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Supabase (PostgreSQL) · Stripe · Resend
- **Precio:** $199 MXN/mes o $1.990 MXN/año · 14 días de prueba · sin límite de pacientes

---

## Arranque local

```bash
pnpm install
cp .env.example .env.local     # completa las claves
pnpm dev                       # http://localhost:3000
```

Aplicar la base de datos: pega `supabase/bootstrap.sql` en el SQL Editor de
Supabase (proyecto vacío) o ejecuta los archivos listados en
[`docs/BILLING-SETUP.md`](docs/BILLING-SETUP.md).

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | servidor de desarrollo |
| `pnpm build` / `pnpm start` | build y arranque de producción |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | tests (vitest) |
| `pnpm db:bootstrap:build` | regenera `supabase/bootstrap.sql` |
| `pnpm db:bootstrap:check` | falla si el bootstrap está desactualizado |

## Cómo está organizado

```
app/
  page.tsx                 landing (venta a nutricionistas)
  suscripcion/             precios + alta de suscripción (Stripe Checkout)
  signup, login, ...       autenticación
  dashboard/               panel: pacientes, planes, plantillas, ajustes
  api/
    checkout/              crea la sesión de suscripción
    stripe/webhook/        sincroniza suscripciones + pago único legacy
    stripe/portal/         portal de facturación
    export/                CSV/JSON de pacientes y planes
    plans/[id]/pdf/        PDF del plan
    cron/trial-reminders/  aviso de fin de prueba (diario)
lib/
  billing/                 precios, acceso, sincronización con Stripe
  emails/                  layout + correos de ciclo de vida
  export/                  CSV (RFC 4180, BOM)
  analytics/               eventos del embudo
  supabase/                clientes server/admin
supabase/
  bootstrap.sql            (generado) esquema completo en un archivo
  subscriptions.sql        suscripciones, trial, funciones de acceso
  analytics.sql            eventos del embudo
```

## Modelo de acceso

Una cuenta accede si cumple **una** de estas condiciones:

1. **Legacy:** compró el pago único antiguo (código de acceso canjeado).
2. **Trial:** 14 días desde el alta (los crea un trigger en la BD).
3. **Suscripción activa** en Stripe.
4. **`past_due`** dentro de los 5 días de gracia.

El bloqueo ocurre en `app/dashboard/layout.tsx`: sin acceso, redirige a
`/suscripcion`. La decisión se toma leyendo `public.subscriptions`, nunca
llamando a Stripe en cada request.

## Documentación

- [Puesta en marcha de cobros (Stripe)](docs/BILLING-SETUP.md)
- [Revisión legal antes de publicar](docs/LEGAL-REVISION.md)
- [Códigos de acceso legacy](docs/ACCESS_CODES_SETUP.md)

## CI

`.github/workflows/ci.yml` ejecuta en cada push: lint → typecheck → tests →
verificación del bootstrap SQL → build de producción.
