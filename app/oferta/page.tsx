import Link from "next/link";
import { getLocale } from "@/lib/i18n";
import { PoweredByAnthroscope } from "@/components/PoweredByAnthroscope";
import { Countdown } from "./Countdown";

const copy = {
  es: {
    offerExpires: "Oferta expira en:",
    preHeadline: "PARA NUTRIÓLOGOS Y COACHES DEPORTIVOS",
    headline: "Genera Planes Nutricionales Profesionales en Menos de 5 Minutos",
    subHeadline:
      "Con 500+ alimentos USDA, 15 plantillas científicas y PDF luxury listo para tus clientes — sin suscripción, pago único de por vida.",
    watchVideo: "▶ Ver Video de Presentación",
    keepReading: "👇 Sigue leyendo para ver todo lo que incluye",
    painHeading: "¿Te suena familiar?",
    pains: [
      "Pasas horas calculando macros manualmente para cada cliente",
      "Tus PDFs de planes nutricionales se ven poco profesionales",
      "No tienes una base de alimentos completa con equivalencias locales",
      "Cada plan te toma 45-60 minutos que podrías cobrar",
    ],
    solutionHeading: "Introduce Plan Builder",
    features: [
      {
        icon: "🗄️",
        title: "500+ Alimentos USDA",
        desc: "Con equivalencias mexicanas y latinoamericanas",
      },
      {
        icon: "📋",
        title: "15 Plantillas Científicas",
        desc: "Volumen, definición, keto, mediterránea, mujeres, atleta adolescente y más",
      },
      {
        icon: "📄",
        title: "PDF Luxury",
        desc: "Descargable, listo para imprimir, con tu branding",
      },
      {
        icon: "🌍",
        title: "Bilingüe ES/EN",
        desc: "Cambia el idioma en un clic",
      },
      {
        icon: "⚡",
        title: "Pago Único, Acceso de Por Vida",
        desc: "Sin suscripciones, sin sorpresas",
      },
    ],
    proofHeading: "Lo que dicen los coaches",
    stackHeading: "Todo lo que obtienes hoy",
    stack: [
      { item: "Plan Builder App (acceso vitalicio)", value: "$297" },
      { item: "Base de 500+ alimentos USDA", value: "$97" },
      { item: "15 plantillas científicas", value: "$47" },
      { item: "PDF luxury descargable", value: "$37" },
      { item: "Toggle bilingüe ES/EN", value: "$27" },
    ],
    included: "Incluido",
    totalValue: "Valor total: $505",
    todayOnly: "Hoy solo:",
    once: "Pago único · Acceso de por vida",
    cta: "Quiero acceso ahora — $57 →",
    secure: "🔒 Pago seguro con Stripe · SSL cifrado · Tarjetas de todo el mundo",
    faqHeading: "Preguntas frecuentes",
    faqs: [
      {
        q: "¿Necesito suscripción?",
        a: "No. Pagas una vez y tienes acceso de por vida.",
      },
      { q: "¿En qué idiomas está disponible?", a: "Completamente bilingüe ES/EN." },
      { q: "¿Puedo usarlo en móvil?", a: "Sí, funciona en cualquier dispositivo." },
      {
        q: "¿Cómo recibo acceso después de pagar?",
        a: "Recibirás un código de acceso por email inmediatamente.",
      },
      {
        q: "¿Hay garantía?",
        a: "Contacta soporte en support@anthroscope.pro si tienes problemas.",
      },
    ],
  },
  en: {
    offerExpires: "Offer expires in:",
    preHeadline: "FOR SPORTS NUTRITIONISTS & COACHES",
    headline: "Generate Professional Nutrition Plans in Under 5 Minutes",
    subHeadline:
      "With 500+ USDA foods, 15 science-based templates and luxury PDF ready for your clients — no subscription, one-time lifetime payment.",
    watchVideo: "▶ Watch Presentation Video",
    keepReading: "👇 Keep reading to see everything included",
    painHeading: "Does this sound familiar?",
    pains: [
      "You spend hours manually calculating macros for each client",
      "Your nutrition plan PDFs look unprofessional",
      "You don't have a complete food database with local equivalents",
      "Each plan takes 45-60 minutes you could be billing",
    ],
    solutionHeading: "Introducing Plan Builder",
    features: [
      {
        icon: "🗄️",
        title: "500+ USDA Foods",
        desc: "With Mexican and Latin American equivalents",
      },
      {
        icon: "📋",
        title: "15 Science-Based Templates",
        desc: "Bulk, cut, keto, mediterranean, female, teen athlete and more",
      },
      {
        icon: "📄",
        title: "Luxury PDF",
        desc: "Downloadable, print-ready, with your branding",
      },
      { icon: "🌍", title: "Bilingual ES/EN", desc: "Switch language in one click" },
      {
        icon: "⚡",
        title: "One-Time Payment, Lifetime Access",
        desc: "No subscriptions, no surprises",
      },
    ],
    proofHeading: "What coaches are saying",
    stackHeading: "Everything you get today",
    stack: [
      { item: "Plan Builder App (lifetime access)", value: "$297" },
      { item: "500+ USDA food database", value: "$97" },
      { item: "15 science-based templates", value: "$47" },
      { item: "Downloadable luxury PDF", value: "$37" },
      { item: "Bilingual ES/EN toggle", value: "$27" },
    ],
    included: "Included",
    totalValue: "Total value: $505",
    todayOnly: "Today only:",
    once: "One-time · Lifetime access",
    cta: "I want access now — $57 →",
    secure: "🔒 Secure payment with Stripe · SSL encrypted · Cards worldwide",
    faqHeading: "Frequently asked questions",
    faqs: [
      { q: "Do I need a subscription?", a: "No. You pay once and have lifetime access." },
      { q: "What languages is it available in?", a: "Fully bilingual ES/EN." },
      { q: "Can I use it on mobile?", a: "Yes, it works on any device." },
      {
        q: "How do I get access after paying?",
        a: "You'll receive an access code by email immediately.",
      },
      {
        q: "Is there a guarantee?",
        a: "Contact support at support@anthroscope.pro if you have issues.",
      },
    ],
  },
};

// Placeholder testimonials shared across locales.
// Replace with real testimonials
const testimonials = [
  {
    quote:
      "Reduje el tiempo de crear planes de 1 hora a menos de 5 minutos. Mis clientes aman los PDFs.",
    author: "Coach María G., CDMX",
  },
  {
    quote:
      "La base de alimentos con equivalencias mexicanas es increíble. No hay nada igual.",
    author: "Nutriólogo Carlos R., Monterrey",
  },
  {
    quote: "El mejor $57 que he invertido en mi práctica profesional.",
    author: "Coach Ana L., Milwaukee",
  },
];

function PricingBlock({ c }: { c: (typeof copy)["es"] }) {
  return (
    <div className="card-luxe mx-auto max-w-md p-8 text-center">
      <p
        style={{
          color: "var(--ink-subtle)",
          fontSize: "24px",
          textDecoration: "line-through",
        }}
      >
        $297
      </p>
      <p
        className="font-display"
        style={{
          fontSize: "72px",
          color: "var(--gold-600)",
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        $57
        <span
          style={{
            fontSize: "20px",
            color: "var(--ink-muted)",
            marginLeft: "8px",
          }}
        >
          USD
        </span>
      </p>
      <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
        {c.once}
      </p>

      <div className="mt-6 flex items-center justify-center">
        <Countdown label={c.offerExpires} />
      </div>

      <Link href="/comprar" className="btn btn-brand mt-6 w-full">
        {c.cta}
      </Link>

      <p className="mt-4 text-xs" style={{ color: "var(--ink-subtle)" }}>
        {c.secure}
      </p>
    </div>
  );
}

export default async function OfertaPage() {
  const locale = await getLocale();
  const c = copy[locale];

  return (
    <main className="relative flex min-h-screen flex-col">
      {/* Sticky top bar */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "rgba(248,245,238,0.88)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <span className="flex items-center gap-2">
            <span
              className="font-display text-lg"
              style={{ color: "var(--ink-strong)", letterSpacing: "-0.02em" }}
            >
              Anthroscope
            </span>
            <span
              className="font-display text-lg italic"
              style={{ color: "var(--brand-700)" }}
            >
              Plan Builder
            </span>
          </span>
          <Countdown label={c.offerExpires} />
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-3xl px-6 pt-16 pb-12 text-center">
        <p className="eyebrow rise" style={{ color: "var(--gold-600)" }}>
          {c.preHeadline}
        </p>
        <h1
          className="font-display mt-5 rise rise-1"
          style={{
            fontSize: "clamp(40px, 6vw, 64px)",
            color: "var(--ink-strong)",
            letterSpacing: "-0.03em",
            lineHeight: 1.02,
          }}
        >
          {c.headline}
        </h1>
        <p
          className="mx-auto mt-6 max-w-xl text-lg leading-8 rise rise-2"
          style={{ color: "var(--ink-muted)" }}
        >
          {c.subHeadline}
        </p>

        {/* Video placeholder — 16:9 */}
        {/* Replace src with actual video URL */}
        <div
          className="mx-auto mt-10 rise rise-3"
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "720px",
            aspectRatio: "16 / 9",
            background: "var(--surface-sunken)",
            border: "1px solid var(--gold-500)",
            borderRadius: "var(--radius-xl)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {/* Drop a YouTube iframe here when ready, e.g.:
              <iframe src="https://www.youtube.com/embed/VIDEO_ID"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                allowFullScreen /> */}
          <span
            className="font-display"
            style={{ fontSize: "26px", color: "var(--gold-600)" }}
          >
            {c.watchVideo}
          </span>
        </div>

        <p className="mt-6 text-sm rise rise-4" style={{ color: "var(--ink-muted)" }}>
          {c.keepReading}
        </p>
      </section>

      {/* Pain points */}
      <section className="mx-auto w-full max-w-2xl px-6 py-14">
        <h2
          className="section-h text-center"
          style={{ fontSize: "clamp(30px, 4vw, 40px)" }}
        >
          {c.painHeading}
        </h2>
        <ul className="mx-auto mt-8 max-w-xl space-y-4">
          {c.pains.map((p) => (
            <li
              key={p}
              className="flex items-start gap-3 text-base"
              style={{ color: "var(--ink-default)" }}
            >
              <span aria-hidden style={{ fontSize: "18px" }}>
                ❌
              </span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Solution */}
      <section className="mx-auto w-full max-w-4xl px-6 py-14">
        <h2
          className="section-h text-center"
          style={{ fontSize: "clamp(30px, 4vw, 40px)" }}
        >
          {c.solutionHeading}
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {c.features.map((f) => (
            <div
              key={f.title}
              className="card-luxe p-6"
              style={{ borderLeft: "3px solid var(--gold-500)" }}
            >
              <div style={{ fontSize: "28px" }}>{f.icon}</div>
              <h3
                className="font-display mt-3"
                style={{
                  fontSize: "24px",
                  color: "var(--ink-strong)",
                  letterSpacing: "-0.02em",
                }}
              >
                {f.title}
              </h3>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "var(--ink-muted)" }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="mx-auto w-full max-w-5xl px-6 py-14">
        <h2
          className="section-h text-center"
          style={{ fontSize: "clamp(30px, 4vw, 40px)" }}
        >
          {c.proofHeading}
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.author} className="card-luxe p-7">
              <span
                aria-hidden
                className="font-display"
                style={{
                  fontSize: "48px",
                  color: "var(--gold-500)",
                  lineHeight: 0.5,
                  display: "block",
                }}
              >
                &ldquo;
              </span>
              <p
                className="mt-3 text-sm italic leading-relaxed"
                style={{ color: "var(--ink-default)" }}
              >
                {t.quote}
              </p>
              <p className="eyebrow mt-4" style={{ color: "var(--gold-600)" }}>
                {t.author}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Value stack */}
      <section className="mx-auto w-full max-w-2xl px-6 py-14">
        <h2
          className="section-h text-center"
          style={{ fontSize: "clamp(30px, 4vw, 40px)" }}
        >
          {c.stackHeading}
        </h2>
        <div className="card-luxe mt-10 p-8">
          <ul className="space-y-3">
            {c.stack.map((s) => (
              <li
                key={s.item}
                className="flex items-center justify-between gap-3 text-sm"
                style={{
                  color: "var(--ink-default)",
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: "12px",
                }}
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden style={{ color: "var(--brand-600)" }}>
                    ✅
                  </span>
                  {s.item}
                </span>
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <span
                    style={{
                      color: "var(--ink-subtle)",
                      textDecoration: "line-through",
                    }}
                  >
                    {s.value}
                  </span>
                  <span style={{ color: "var(--brand-700)" }}>{c.included}</span>
                </span>
              </li>
            ))}
          </ul>

          <p
            className="mt-6 text-center"
            style={{
              color: "var(--ink-subtle)",
              textDecoration: "line-through",
              fontSize: "18px",
            }}
          >
            {c.totalValue}
          </p>
          <p
            className="font-display mt-2 text-center"
            style={{ fontSize: "22px", color: "var(--gold-600)" }}
          >
            {c.todayOnly}
          </p>
        </div>
      </section>

      {/* Pricing + CTA (the pitch) */}
      <section className="mx-auto w-full max-w-2xl px-6 py-14">
        <PricingBlock c={c} />
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-2xl px-6 py-14">
        <h2
          className="section-h text-center"
          style={{ fontSize: "clamp(30px, 4vw, 40px)" }}
        >
          {c.faqHeading}
        </h2>
        <div className="mt-10 space-y-4">
          {c.faqs.map((f) => (
            <details key={f.q} className="card-luxe p-5">
              <summary
                className="cursor-pointer"
                style={{
                  color: "var(--ink-strong)",
                  fontSize: "16px",
                  fontWeight: 600,
                }}
              >
                {f.q}
              </summary>
              <p
                className="mt-3 text-sm leading-relaxed"
                style={{ color: "var(--ink-muted)" }}
              >
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-2xl px-6 pt-6 pb-16">
        <PricingBlock c={c} />
      </section>

      <PoweredByAnthroscope />
    </main>
  );
}
