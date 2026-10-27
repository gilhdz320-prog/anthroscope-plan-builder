# Revisión legal antes de publicar

Los documentos de `/privacidad` y `/terminos` son una **base técnica**, no un
dictamen jurídico. Están redactados para cubrir lo que un profesional de la
nutrición pregunta en la primera llamada (dónde están los datos, quién responde,
qué pasa si cancela), pero **deben revisarse antes de cobrar**.

---

## 1. Datos que hay que completar (obligatorio)

**Un solo archivo:** `lib/legal.ts`. De ahí leen `/privacidad` y `/terminos`.

```ts
export const LEGAL = {
  responsable: "[TU NOMBRE O RAZÓN SOCIAL]",
  domicilio: "[CALLE, NÚMERO, CIUDAD, ESTADO, MÉXICO]",
  emailPrivacidad: "privacidad@anthroscope.pro",
  emailContacto: "hola@anthroscope.pro",
  actualizado: "octubre de 2026",
} as const;
```

| Campo | Qué poner |
|---|---|
| `responsable` | tu nombre completo o razón social (persona física con actividad empresarial es válido) |
| `domicilio` | domicilio real para efectos de notificaciones |
| `emailPrivacidad` | correo que **de verdad** revises: por ahí llegan las solicitudes ARCO (tienen plazo legal) |
| `emailContacto` | correo general de soporte |
| `actualizado` | mes y año de la última revisión |

Cuando `responsable` y `domicilio` ya no tienen corchetes, `legalIsComplete()`
devuelve `true` y los documentos están listos para publicarse.

---

## 2. Decisiones que el texto asume (cámbialas si no aplican)

1. **Retención 90 días tras cancelar.** Está en el aviso (§6). Si prefieres 30 o
   180, cámbialo en el texto **y** en la política real de borrado.
2. **Reembolso dentro de 7 días** en la primera compra (términos §5). Es
   generoso a propósito: reduce fricción de compra. Ajústalo a tu operación.
3. **Datos de salud**: el texto declara que **tú eres el responsable** y
   Anthroscope el **encargado**. Es la figura correcta para un SaaS vertical,
   pero implica que debes tener tu propio aviso para tus pacientes.
4. **No somos expediente clínico / NOM-004.** Es deliberado: el producto no
   implementa firma por nota, hora clínica ni retención legal de expediente. Si
   algún día lo implementas, actualiza términos y el discurso de venta.

---

## 3. Encargados y transferencias (LFPDPPP)

El aviso lista cuatro encargados. Antes de lanzar:

- [ ] **Supabase**: aceptar el DPA (Data Processing Addendum) en el dashboard.
      Verificar la región del proyecto y que el plan permite backups.
- [ ] **Vercel**: aceptar el DPA y revisar la región de las funciones.
- [ ] **Stripe**: el DPA ya está incorporado a sus términos; confirmar cuenta
      como negocio en México (RFC) para facturación.
- [ ] **Resend**: aceptar DPA y verificar el dominio remitente (SPF/DKIM).

Documenta la fecha en que aceptaste cada uno; si un cliente lo pregunta, la
respuesta "sí, con fecha X" vende más que "creo que sí".

---

## 4. Pendientes que NO cubre este paquete

| Tema | Estado | Qué falta |
|---|---|---|
| Aviso de privacidad **integral** (formato largo) | base | revisión de abogado |
| Aviso de privacidad **corto** para formularios de intake | no existe | añadir liga al aviso en cada formulario público |
| Contrato de encargado con **tus clientas** (DPA B2B) | no existe | plantilla de una página; ellas son responsables, tú encargado |
| Registro de actividades de tratamiento | no existe | hoja simple: dato, finalidad, base legal, plazo |
| Procedimiento ARCO documentado | no existe | quién responde, en cuánto tiempo, cómo se borra |
| Cookies | cubierto parcialmente | solo cookies de sesión; si añades analítica de terceros, actualiza |

---

## 5. Riesgos reales si se publica sin revisar

1. **Multas y requerimientos** de la autoridad mexicana por no tener aviso de
   privacidad con los elementos del artículo 16 de la LFPDPPP.
2. **Pérdida de ventas**: la nutrióloga que compara proveedores pregunta por
   datos y backups. No tener link visible al aviso cuesta conversiones.
3. **Confusión de roles**: si el texto sugiere que Anthroscope es responsable del
   dato clínico, asumes una responsabilidad que no te corresponde (y un riesgo
   legal serio ante un error de la nutrióloga).

---

## 6. Orden recomendado (1 día de trabajo + revisión externa)

1. Completar los placeholders.
2. Aceptar los DPA de los cuatro proveedores.
3. Pegar el link al aviso en: signup, footer de la landing, formulario de intake.
4. Pedir a un abogado (o al servicio legal de tu confianza) una revisión de 1 hora
   centrada en: retención, transferencias internacionales y limitación de
   responsabilidad.
