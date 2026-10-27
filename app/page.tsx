import Link from "next/link";
import { PoweredByAnthroscope } from "@/components/PoweredByAnthroscope";

const FEATURES = [
  {
    title: "Equivalentes SMAE, no inventados",
    body: "Planes armados con el Sistema Mexicano de Alimentos Equivalentes: grupos, porciones e intercambios que tus pacientes ya entienden.",
  },
  {
    title: "PDF con tu marca",
    body: "Entregas un plan que se ve profesional en consulta y por WhatsApp. Sin pegar capturas de Excel.",
  },
  {
    title: "Portal del paciente",
    body: "Un enlace para que tu paciente vea su plan desde el celular. Sin app, sin contraseña, sin fricción.",
  },
  {
    title: "Plantillas por padecimiento",
    body: "Diabetes, hipertensión, SOP, deportivo, pediátrico. Partes de una base y ajustas en minutos.",
  },
  {
    title: "Recall dietético",
    body: "Formularios de 24 horas, 3 días y 7 días que tu paciente llena por enlace y tú revisas sin transcribir.",
  },
  {
    title: "Tus datos son tuyos",
    body: "Exporta pacientes y planes en CSV o JSON cuando quieras. Sin secuestro de información.",
  },
];

const FAQ = [
  {
    q: "¿Cuánto cuesta?",
    a: "199 pesos al mes o 1,990 al año (dos meses gratis). Sin contrato forzoso: cancelas desde el portal de facturación.",
  },
  {
    q: "¿Hay límite de pacientes?",
    a: "No. A diferencia de otros software que te cortan en 20, 40 u 80 pacientes, aquí no hay tope.",
  },
  {
    q: "¿Puedo probarlo antes?",
    a: "Sí: 14 días de acceso completo sin tarjeta. Al terminar decides, sin cobro automático.",
  },
  {
    q: "¿Es un expediente clínico?",
    a: "No. Es un constructor de planes y seguimiento. No sustituye tu expediente ni pretende cumplir NOM-004: eso lo defines tú con tus formatos.",
  },
  {
    q: "¿Qué pasa si cancelo?",
    a: "Tu cuenta se pausa, pero tus pacientes, planes y plantillas no se borran. Al reactivar sigues donde estabas.",
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span
            className="font-display text-xl"
            style={{ color: "var(--ink-strong)", letterSpacing: "-0.02em" }}
          >
            Anthroscope
          </span>
          <span className="font-display text-xl italic" style={{ color: "var(--brand-700)" }}>
            Plan Builder
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn btn-ghost">
            Iniciar sesión
          </Link>
          <Link href="/signup" className="btn btn-primary">
            Empezar gratis
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-10 pb-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <p className="eyebrow rise" style={{ color: "var(--gold)" }}>
              Para nutriólogas y nutriólogos en México
            </p>
            <h1
              className="mt-5 rise rise-1"
              style={{
                fontFamily: "var(--font-cormorant), ui-serif, Georgia, serif",
                fontSize: "clamp(34px, 5vw, 58px)",
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
                color: "var(--ink-strong)",
              }}
            >
              El plan de alimentación
              <br />
              de tu consulta, <em style={{ color: "var(--brand-700)" }}>en 10 minutos</em>.
            </h1>
            <p
              className="mt-6 max-w-xl text-base leading-relaxed rise rise-2"
              style={{ color: "var(--ink-muted)" }}
            >
              Arma planes con equivalentes SMAE, entrégalos como PDF con tu marca
              y comparte el portal del paciente con un enlace. Sin Excel, sin
              límite de pacientes y con 14 días de prueba.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 rise rise-2">
              <Link href="/signup" className="btn btn-primary">
                Empezar 14 días gratis
              </Link>
              <Link href="/suscripcion" className="btn btn-ghost">
                Ver precios
              </Link>
            </div>
            <p className="mt-3 text-xs rise rise-3" style={{ color: "var(--ink-subtle)" }}>
              Sin tarjeta para la prueba · Cancela cuando quieras
            </p>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 rise rise-3">
              {[
                { k: "≈10 min", v: "por plan" },
                { k: "0", v: "límite de pacientes" },
                { k: "SMAE", v: "equivalentes reales" },
              ].map((item) => (
                <div key={item.k}>
                  <dt
                    className="font-display"
                    style={{ fontSize: "24px", color: "var(--ink-strong)", lineHeight: 1 }}
                  >
                    {item.k}
                  </dt>
                  <dd className="mt-1 text-[11px]" style={{ color: "var(--ink-muted)" }}>
                    {item.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Mock del producto */}
          <div className="lg:col-span-5">
            <div
              className="card-luxe overflow-hidden p-0 rise rise-2"
              style={{ transform: "rotate(-0.6deg)" }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ background: "var(--ink-strong)" }}
              >
                <span className="eyebrow" style={{ color: "var(--gold-300)" }}>
                  Plan · Ana Pérez
                </span>
                <span className="text-[10px]" style={{ color: "rgba(248,245,238,0.6)" }}>
                  1,850 kcal
                </span>
              </div>
              <div className="space-y-3 p-4">
                {[
                  { meal: "Desayuno", items: "2 eq. cereales · 1 eq. lácteos · 1 eq. frutas" },
                  { meal: "Colación", items: "1 eq. frutas · 1 eq. oleaginosas" },
                  { meal: "Comida", items: "3 eq. verduras · 2 eq. leguminosas · 2 eq. cereales" },
                  { meal: "Cena", items: "2 eq. origen animal · 2 eq. cereales" },
                ].map((row) => (
                  <div
                    key={row.meal}
                    className="rounded-md px-3 py-2"
                    style={{ background: "var(--paper)" }}
                  >
                    <p className="text-[11px] font-semibold" style={{ color: "var(--ink-strong)" }}>
                      {row.meal}
                    </p>
                    <p className="mt-0.5 text-[11px]" style={{ color: "var(--ink-muted)" }}>
                      {row.items}
                    </p>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px]" style={{ color: "var(--ink-subtle)" }}>
                    Equivalencias SMAE
                  </span>
                  <span
                    className="rounded px-2 py-1 text-[10px] font-semibold"
                    style={{ background: "var(--brand-50, #F1F7F3)", color: "var(--brand-700)" }}
                  >
                    Generar PDF
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* El problema */}
      <section style={{ background: "var(--ink-strong)", color: "var(--ink-inverse)" }}>
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-14 md:grid-cols-3">
          {[
            {
              t: "Excel no es un plan",
              d: "Copiar y pegar porciones cada consulta te quita la tarde y te deja errores de suma.",
            },
            {
              t: "El PDF importa",
              d: "Lo que tu paciente recibe en el celular es tu marca. Una hoja de cálculo no vende.",
            },
            {
              t: "Los topes cobran caro",
              d: "Pagar más por atender a 21 pacientes en vez de 20 es un impuesto a tu crecimiento.",
            },
          ].map((item) => (
            <div key={item.t}>
              <p className="font-display" style={{ fontSize: "22px", lineHeight: 1.2 }}>
                {item.t}
              </p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(248,245,238,0.72)" }}>
                {item.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <p className="eyebrow" style={{ color: "var(--gold)" }}>
          Lo que incluye
        </p>
        <h2
          className="font-display mt-3"
          style={{ fontSize: "clamp(26px,3.4vw,38px)", color: "var(--ink-strong)", letterSpacing: "-0.02em" }}
        >
          Todo lo que usas en consulta, en un solo lugar
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="card-luxe p-6">
              <h3 className="text-sm font-semibold" style={{ color: "var(--ink-strong)" }}>
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section style={{ background: "var(--surface-sunken, #F3EFE5)" }}>
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <p className="eyebrow" style={{ color: "var(--gold)" }}>
            Cómo funciona
          </p>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {[
              { n: "01", t: "Crea al paciente", d: "Datos, antropometría y objetivo. Dos minutos." },
              { n: "02", t: "Arma el plan", d: "Eliges plantilla o desde cero, con equivalentes SMAE." },
              { n: "03", t: "Entrega", d: "PDF con tu marca y enlace para que lo vea en el celular." },
            ].map((step) => (
              <div key={step.n}>
                <span className="font-display" style={{ fontSize: "34px", color: "var(--gold)" }}>
                  {step.n}
                </span>
                <p className="mt-2 text-sm font-semibold" style={{ color: "var(--ink-strong)" }}>
                  {step.t}
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
                  {step.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Precios */}
      <section id="precios" className="mx-auto w-full max-w-4xl px-6 py-16">
        <div className="text-center">
          <p className="eyebrow" style={{ color: "var(--gold)" }}>
            Precios
          </p>
          <h2
            className="font-display mt-3"
            style={{ fontSize: "clamp(26px,3.4vw,38px)", color: "var(--ink-strong)", letterSpacing: "-0.02em" }}
          >
            Un precio, sin letras chiquitas
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm" style={{ color: "var(--ink-muted)" }}>
            Sin límite de pacientes, sin módulos extra, sin contratos forzosos.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="card-luxe p-7">
            <p className="eyebrow" style={{ color: "var(--ink-subtle)" }}>
              Mensual
            </p>
            <p className="font-display mt-2" style={{ fontSize: "42px", lineHeight: 1, color: "var(--ink-strong)" }}>
              $199
              <span className="text-sm" style={{ color: "var(--ink-muted)" }}> MXN/mes</span>
            </p>
            <ul className="mt-5 space-y-2 text-sm" style={{ color: "var(--ink-muted)" }}>
              <li>✓ 14 días de prueba gratis</li>
              <li>✓ Pacientes ilimitados</li>
              <li>✓ Exportación de datos</li>
            </ul>
            <Link href="/signup" className="btn btn-ghost mt-6 w-full">
              Empezar
            </Link>
          </div>

          <div
            className="card-luxe relative p-7"
            style={{ borderColor: "var(--gold-500)", borderWidth: "1.5px" }}
          >
            <span
              className="absolute -top-3 left-6 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide"
              style={{ background: "var(--gold-500)", color: "var(--ink-strong)" }}
            >
              Ahorra 2 meses
            </span>
            <p className="eyebrow" style={{ color: "var(--ink-subtle)" }}>
              Anual
            </p>
            <p className="font-display mt-2" style={{ fontSize: "42px", lineHeight: 1, color: "var(--ink-strong)" }}>
              $1,990
              <span className="text-sm" style={{ color: "var(--ink-muted)" }}> MXN/año</span>
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--ink-subtle)" }}>
              Equivale a $166 al mes
            </p>
            <ul className="mt-5 space-y-2 text-sm" style={{ color: "var(--ink-muted)" }}>
              <li>✓ Todo lo del plan mensual</li>
              <li>✓ Dos meses sin costo</li>
              <li>✓ Prioridad en soporte</li>
            </ul>
            <Link href="/suscripcion" className="btn btn-primary mt-6 w-full">
              Elegir anual
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: "var(--ink-subtle)" }}>
          Comparado con los planes del mercado mexicano, que arrancan en $299 MXN/mes
          y limitan a 20 pacientes.
        </p>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-6 pb-16">
        <h2
          className="font-display"
          style={{ fontSize: "clamp(24px,3vw,32px)", color: "var(--ink-strong)" }}
        >
          Preguntas frecuentes
        </h2>
        <div className="mt-6 divide-y" style={{ borderColor: "var(--border, #ECE6D8)" }}>
          {FAQ.map((item) => (
            <details key={item.q} className="group py-4">
              <summary
                className="cursor-pointer list-none text-sm font-semibold"
                style={{ color: "var(--ink-strong)" }}
              >
                {item.q}
              </summary>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "linear-gradient(135deg, var(--ink-strong) 0%, var(--brand-900, #0A5B45) 100%)" }}
        >
          <p className="font-display" style={{ fontSize: "clamp(24px,3.4vw,36px)", color: "var(--ink-inverse)", lineHeight: 1.15 }}>
            Tu próxima consulta puede empezar con el plan ya hecho.
          </p>
          <p className="mt-3 text-sm" style={{ color: "rgba(248,245,238,0.75)" }}>
            14 días completos, sin tarjeta. Si no te ahorra tiempo, no lo pagas.
          </p>
          <Link href="/signup" className="btn mt-6" style={{ background: "var(--gold-500)", color: "var(--ink-strong)" }}>
            Crear mi cuenta gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t" style={{ borderColor: "var(--border, #ECE6D8)" }}>
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <PoweredByAnthroscope variant="minimal" />
          <nav className="flex flex-wrap items-center gap-4 text-[11px]" style={{ color: "var(--ink-subtle)" }}>
            <Link href="/suscripcion" className="underline underline-offset-2">
              Precios
            </Link>
            <Link href="/privacidad" className="underline underline-offset-2">
              Aviso de privacidad
            </Link>
            <Link href="/terminos" className="underline underline-offset-2">
              Términos
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
