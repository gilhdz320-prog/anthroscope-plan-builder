# Kit de venta · Plan Builder

> Material de trabajo para conseguir las primeras 10 clientas de pago.
> Nota: este repo es público. Si prefieres que la estrategia de precio no lo sea,
> muévelo a un repo privado o a tus notas.

---

## 1. A quién le vendes (y a quién no)

**Sí:**
- Nutrióloga/o con consultorio propio o práctica online, **15–80 pacientes activos**.
- Ya **cobra** consulta (no es estudiante).
- Hace sus planes **a mano** en Word, Excel, Canva o PDF que copia de otro lado.
- Trabaja con **SMAE** (equivalentes mexicanos).
- En México, o atiende pacientes mexicanos desde otro país.

**No (por ahora):**
- Estudiantes sin práctica: no pagan, y no es tu cliente todavía.
- Clínicas con 3+ profesionales: necesitan equipo y permisos; no lo tienes.
- Quien ya vive feliz en Avena y no choca con el tope de pacientes.
- Quien necesita **agenda + WhatsApp + app móvil + CFDI**: no eres esa herramienta, y venderlo así genera reembolsos.

> Regla: si no puedes describir en una frase **el problema que tiene hoy**, no es tu clienta todavía.

---

## 2. La oferta fundadora

**$149 MXN/mes durante 3 meses** (después $199), a cambio de:
1. Feedback por WhatsApp cada semana (10 minutos).
2. Un testimonio al final del tercer mes (si le funcionó).
3. Permiso para usar su nombre y su especialidad en la web.

**Límite: 10 fundadoras.** Escasez real, no inventada: no quieres 40 personas mandándote mensajes mientras construyes.

Por qué funciona: baja la barrera de "probar algo nuevo" sin regalar el producto, y te da el activo que no se compra: **prueba social**.

Nunca ofrezcas gratis. Lo gratis atrae a quien no lo va a usar, y no te dice si el producto vale.

### Cómo darlo sin tocar código (cupón de Stripe)

El checkout ya acepta códigos de promoción. En Stripe → **Product catalog → Coupons → New**:

| Campo | Valor |
|---|---|
| Tipo | **Amount off** (no "percentage") |
| Cantidad | **50 MXN** |
| Duración | **Repeating**, 3 meses |
| Máximo de canjes | **10** (esto te da la escasez real, automática) |
| Código | `FUNDADORA` |

Por qué importa el detalle: 25% de $199 son **$149.25**, no $149. Con $50 exactos te queda en **$149.00**, que es lo que dijiste y lo que vas a decir en la llamada.

En el checkout aparece el campo "Código de promoción" (ya está activado). Tú mandas el código a cada fundadora después de la llamada; no lo publiques en la web.

> Si algún día quieres que el cupón aplique solo al plan mensual y no al anual, en Stripe puedes limitarlo con **Applies to → Products** (crea el precio anual como producto aparte).

---

## 3. Mensajes de primer contacto

### A. Instagram DM (frío, a nutriólogas que muestran su consulta)

> Hola [nombre], vi que haces consulta de [padecimiento/población] en [ciudad].
> Pregunta rápida, sin rollo: ¿cuánto tardas en armar un plan de alimentación con
> equivalentes, de cero a PDF?
>
> Te lo pregunto porque hice una herramienta que lo hace en ~10 minutos y quiero
> saber si el problema que resuelve es el que tú tienes.

**Por qué funciona:** pregunta, no pitch. Y la respuesta te dice si califica.

### B. WhatsApp (contacto cálido o referida)

> Hola [nombre], soy Gilbert ([quién te refirió / de dónde te conozco]).
> Estoy abriendo un software para nutriólogas que arma planes con SMAE, PDF con
> tu marca y portal del paciente, sin límite de pacientes. Está en $199 al mes.
>
> ¿Te puedo mandar un ejemplo del PDF que recibe el paciente? Si no te sirve, me
> dices y no te molesto más.

### C. Correo (cuando tiene contacto público en su web)

Asunto: **¿sigues armando los planes en Word?**

> Hola [nombre]:
>
> Vi tu consulta en [ciudad] y que atiendes [población]. Te escribo porque hice
> una herramienta para el paso que casi nadie ha resuelto bien: pasar de los
> equivalentes SMAE a un PDF que puedas entregar sin pelearte con Word.
>
> Ejemplo real de lo que recibe tu paciente: [link al PDF de demo]
>
> Si el problema no es el tuyo, ignora este correo con toda confianza. Si sí,
> te muestro en 10 minutos cómo se ve con tu marca.
>
> Gilbert — Plan Builder · planbuilder.anthroscope.pro/demo

### D. Seguimiento (día 3 y día 7)

Día 3:
> ¿Te llegó? Sin compromiso: si no es para ti, dime y cierro el tema.

Día 7:
> Última: abro 10 lugares de fundadora a $149/mes (después $199). Si te interesa,
> te aparto uno; si no, lo dejo aquí.

Dos toques. El tercero ya es insistir.

---

## 4. Guion de llamada (10 minutos)

**0–1 min · Encuadre**
> Gracias por el tiempo. Te propongo: 3 minutos de preguntas para entender cómo
> trabajas, 4 de demo con lo que tú me digas, y si no te sirve lo dejamos ahí.
> ¿Te parece?

**1–4 min · Diagnóstico (escucha más de lo que hablas)**

1. ¿Cuántos pacientes activos traes hoy?
2. ¿Cuánto tardas en armar un plan, de cero a PDF?
3. ¿Con qué lo haces ahora (Word, Excel, otro software)?
4. ¿Qué es lo que más te fastidia de ese proceso?
5. ¿Qué pasa cuando llegas a 21 pacientes? *(si usa Avena, aquí aparece el tope)*

Anota sus palabras exactas: las vas a repetir en el cierre.

**4–7 min · Demo guiada (comparte pantalla, no mandes links)**

Solo tres pantallas:
1. **El plan** (`/demo`): "así se ve un plan con equivalentes repartidos por comida".
2. **El PDF** (`/demo/pdf`): "esto es lo que recibe tu paciente, con tu nombre y tu marca".
3. **El progreso**: "aquí ves peso, cintura y pliegues ISAK en el tiempo".

Frase clave: *"no te estoy mostrando funciones, te estoy mostrando la consulta del jueves".*

**7–9 min · Precio y oferta**

> Son $199 al mes, sin límite de pacientes, 14 días de prueba sin tarjeta.
> A las primeras 10 les dejo $149 durante 3 meses, a cambio de que me des
> feedback y un testimonio si te funciona. ¿Te aparto uno?

**9–10 min · Cierre**

> ¿Te creo la cuenta ahora y armas el plan de uno de tus pacientes mientras
> estamos en llamada?

Cierre alternativo si duda:
> ¿Qué te falta saber para decidir? *(y respondes solo eso)*

**Lo que NO se dice en la llamada:** IA, "revolucionario", "el mejor del mercado", comparaciones con competidores no pedidas. Si pregunta por Avena: *"es buen software; la diferencia es que yo no te cobro por número de pacientes y salgo más barato. Si la agenda es tu problema, Avena te sirve mejor que yo."*

---

## 5. Objeciones (respuestas listas)

| Objeción | Qué responder |
|---|---|
| **"Está caro"** | "$199 es una consulta tuya. Si te ahorra 2 horas a la semana, se paga sola. Y si no, en 14 días lo dejas sin pagar nada." |
| **"Ya uso Avena"** | "Perfecto, no te pido que migres. ¿Cuántos pacientes traes y en qué plan estás? *(escucha)* Si el tope te está frenando, pruébalo en paralelo con un paciente y comparas el PDF." |
| **"No tengo tiempo"** | "Por eso existe: 10 minutos por plan. Te dejo la cuenta armada en la llamada y pruebas con un paciente real." |
| **"¿Y si no me sirve?"** | "14 días sin tarjeta. Y si entras, tus datos se exportan en CSV cuando quieras: no te quedas secuestrada." |
| **"¿Facturas?"** | "Hoy te doy recibo de Stripe; el CFDI está en trámite. Si necesitas factura desde el día uno, te lo digo claro: todavía no. ¿Es bloqueante para ti?" |
| **"¿Dónde están mis datos?"** | "En Supabase, cifrados, con aislamiento por usuaria: solo tú ves a tus pacientes. Está el aviso de privacidad en la web y puedes exportar todo." |
| **"Déjame pensarlo"** | "Claro. ¿Qué específicamente quieres pensar: el precio, si te va a ahorrar tiempo, o si confías en que esto siga existiendo?" |

Esa última pregunta es la más útil: casi siempre la duda real es **"¿esto va a seguir aquí en 6 meses?"**. Respuesta honesta: *"soy una persona, no una empresa grande; por eso la prueba es sin tarjeta y tus datos se exportan."*

---

## 6. Dónde encontrar las 30

No necesitas una lista mágica: necesitas criterio y constancia.

| Fuente | Cómo buscar | Filtro |
|---|---|---|
| Instagram | `#nutriologa` + ciudad, `#nutricionclinica`, `#nutriologosmx` | que muestre consulta real, no solo recetas |
| Facebook | grupos de "Nutriólogos México", "Nutrición clínica MX" | que participe y tenga consultorio |
| Google Maps | "nutriólogo [ciudad]" | con consultorio físico y reseñas |
| LinkedIn | "nutrióloga" + "consultorio" / "práctica privada" | perfil activo |
| Universidades | egresadas recientes de nutrición | las que ya cobran consulta |
| Referidas | pregunta a cada contactada por 1 colega | la mejor tasa de respuesta |

**Filtro rápido (30 segundos por perfil):** ¿atiende pacientes? ¿cobra? ¿hace planes? ¿tiene entre 15 y 80? Si sí a las cuatro, entra a la lista.

### Hoja de seguimiento

| Nombre | Ciudad | Fuente | Contacto | Fecha 1er msj | Respondió | Llamada | Trial | Pago | Nota |
|---|---|---|---|---|---|---|---|---|---|

Meta de la semana: **30 contactos, 10 respuestas, 4 llamadas, 2 trials, 1 pago.** Si al llegar a 30 no tienes ni 5 respuestas, el problema es el mensaje, no el producto.

---

## 7. Qué NO hacer

1. **Mandar el link sin contexto** ("checa esto"). Tasa de respuesta ≈ 0.
2. **Hablar de funciones** antes de saber cuántos pacientes tiene.
3. **Bajar el precio** en la primera objeción. Si cedes a la primera, enseñaste que tu precio es inventado.
4. **Ofrecer gratis** para "que lo pruebe". Ya tienes 14 días sin tarjeta.
5. **Prometer lo que no hay**: agenda, app, CFDI, NOM-004. Un cliente que compra por eso y no lo encuentra pide reembolso y habla mal.
6. **Discutir con quien usa Avena.** No es tu enemiga; muchas van a convivir con las dos.

---

## 8. Plan de 7 días

| Día | Tarea | Meta |
|---|---|---|
| Lun | Cerrar Stripe + Resend + legal | poder cobrar |
| Mar | Armar lista de 30 (2 h) y mandar los primeros 10 | 10 enviados |
| Mié | 10 más + seguimiento día 3 | 20 enviados |
| Jue | 10 más + primeras llamadas | 30 enviados, 4 llamadas |
| Vie | Llamadas + ajustar mensaje con lo aprendido | 2 trials |
| Sáb | Acompañar trials: que armen su primer plan real | 1 pago |
| Dom | Revisar números y decidir el ajuste de la semana 2 | decisión |

---

## 9. Lo que hay que medir (y dónde)

- **Contactos / respuestas / llamadas / trials / pagos**: en la hoja de arriba.
- **Dentro del producto**: `/dashboard` → eventos del embudo en `analytics_events`
  (`signup_completed`, `trial_started`, `patient_created`, `plan_created`,
  `plan_pdf_generated`, `checkout_started`, `subscription_active`).
- La señal más importante de la primera semana: **¿crean un plan en las primeras 24 h?**
  Si se registran y no crean un plan, el problema es el onboarding, no el precio.

---

## 10. La frase que resume todo

> No vendo un software de nutrición. Vendo **el PDF que tu paciente recibe el jueves**,
> hecho en 10 minutos y con tu nombre.

Todo lo que digas que no sea eso, sobra.
