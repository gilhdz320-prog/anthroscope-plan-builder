import Link from "next/link";
import { PoweredByAnthroscope } from "@/components/PoweredByAnthroscope";

export const metadata = {
  title: "Comparación · Anthroscope Plan Builder",
  description:
    "Plan Builder frente a Avena y HeyNutre: precio, límite de pacientes, SMAE, PDF con marca, portal del paciente y facturación.",
};

type Cell = "si" | "no" | "parcial" | "consultar" | string;

const ROWS: Array<{
  feature: string;
  us: Cell;
  avena: Cell;
  heynutre: Cell;
  note?: string;
}> = [
  {
    feature: "Precio mensual (MXN)",
    us: "$199",
    avena: "desde $299 (promo)",
    heynutre: "desde $349",
    note: "Precios públicos de cada proveedor, octubre 2026.",
  },
  {
    feature: "Límite de pacientes",
    us: "Sin límite",
    avena: "20 / 40 / 80 según plan",
    heynutre: "Por plan",
  },
  {
    feature: "Equivalentes SMAE",
    us: "si",
    avena: "si",
    heynutre: "si",
  },
  {
    feature: "Catálogo de alimentos mexicanos",
    us: "614",
    avena: "+30,000 recetas",
    heynutre: "Catálogo propio",
  },
  {
    feature: "PDF con tu marca",
    us: "si",
    avena: "si",
    heynutre: "si",
  },
  {
    feature: "Portal del paciente",
    us: "Enlace web",
    avena: "App iOS/Android",
    heynutre: "Portal web",
  },
  {
    feature: "Pliegues y perímetros ISAK",
    us: "si",
    avena: "consultar",
    heynutre: "consultar",
    note: "En Plan Builder: 8 pliegues, 4 perímetros y %grasa Durnin-Womersley.",
  },
  {
    feature: "Recall dietético 24h / 3d / 7d",
    us: "si",
    avena: "consultar",
    heynutre: "consultar",
  },
  {
    feature: "Agenda y recordatorios por WhatsApp",
    us: "no",
    avena: "si",
    heynutre: "si",
  },
  {
    feature: "Expediente clínico NOM-004",
    us: "no",
    avena: "básico",
    heynutre: "completo",
  },
  {
    feature: "Factura (CFDI)",
    us: "no (en trámite)",
    avena: "si",
    heynutre: "si",
  },
  {
    feature: "Exportar tus datos",
    us: "si",
    avena: "consultar",
    heynutre: "consultar",
    note: "CSV de pacientes y planes, y respaldo JSON completo.",
  },
  {
    feature: "Prueba gratis",
    us: "14 días sin tarjeta",
    avena: "consultar",
    heynutre: "14 días por $20 MXN",
  },
];

function cellValue(value: Cell) {
  if (value === "si") return <span style={{ color: "#0F7B5C", fontWeight: 600 }}>Sí</span>;
  if (value === "no") return <span style={{ color: "#9B2C2C" }}>No</span>;
  if (value === "parcial") return <span style={{ color: "#7E6322" }}>Parcial</span>;
  if (value === "consultar") return <span style={{ color: "var(--ink-subtle)" }}>Consultar</span>;
  return <span>{value}</span>;
}

export default function ComparativaPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--paper)" }}>
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
          <Link href="/demo" className="btn btn-ghost">
            Ver demo
          </Link>
          <Link href="/signup" className="btn btn-primary">
            Empezar gratis
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-5xl px-6 pb-16">
        <p className="eyebrow" style={{ color: "var(--gold)" }}>
          Comparación
        </p>
        <h1
          className="font-display mt-3 max-w-3xl"
          style={{
            fontSize: "clamp(30px,4.4vw,46px)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "var(--ink-strong)",
          }}
        >
          Contra Avena y HeyNutre, sin maquillaje
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
          Los tres hacemos planes con SMAE. La diferencia está en el precio, en los
          topes de pacientes y en todo lo que rodea al plan (agenda, app, factura).
          Abajo te decimos también en qué <strong>no</strong> somos la mejor opción.
        </p>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr style={{ borderBottom: "2px solid var(--ink-strong)" }}>
                <th className="py-3 pr-4 text-left font-semibold" style={{ color: "var(--ink-strong)" }}>
                  Función
                </th>
                <th
                  className="px-3 py-3 text-left font-semibold"
                  style={{ color: "var(--brand-700)" }}
                >
                  Plan Builder
                </th>
                <th className="px-3 py-3 text-left font-semibold" style={{ color: "var(--ink-muted)" }}>
                  Avena
                </th>
                <th className="px-3 py-3 text-left font-semibold" style={{ color: "var(--ink-muted)" }}>
                  HeyNutre
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.feature} style={{ borderBottom: "1px solid var(--border, #ECE6D8)" }}>
                  <td className="py-3 pr-4 align-top" style={{ color: "var(--ink-strong)" }}>
                    {row.feature}
                    {row.note && (
                      <span className="mt-1 block text-[10px]" style={{ color: "var(--ink-subtle)" }}>
                        {row.note}
                      </span>
                    )}
                  </td>
                  <td
                    className="px-3 py-3 align-top"
                    style={{ background: "rgba(15,123,92,0.05)", color: "var(--ink-strong)" }}
                  >
                    {cellValue(row.us)}
                  </td>
                  <td className="px-3 py-3 align-top" style={{ color: "var(--ink-muted)" }}>
                    {cellValue(row.avena)}
                  </td>
                  <td className="px-3 py-3 align-top" style={{ color: "var(--ink-muted)" }}>
                    {cellValue(row.heynutre)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed" style={{ color: "var(--ink-subtle)" }}>
          Precios y funciones según información pública de cada proveedor consultada
          en octubre de 2026. Los planes y precios cambian: verifica en sus sitios
          antes de decidir. Donde no hay información pública verificable ponemos
          «Consultar» en lugar de suponer.
        </p>

        {/* Honestidad: cuándo NO somos la opción */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <section className="card-luxe p-6">
            <p className="eyebrow" style={{ color: "#9B2C2C" }}>
              No somos tu opción si…
            </p>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--ink-muted)" }}>
              <li>• Necesitas <strong>agenda con recordatorios por WhatsApp</strong> integrada.</li>
              <li>• Tus pacientes exigen una <strong>app móvil</strong> con notificaciones.</li>
              <li>• Necesitas <strong>expediente conforme a NOM-004</strong> para una verificación.</li>
              <li>• Requieres <strong>factura (CFDI)</strong> hoy mismo.</li>
              <li>• Trabajas con <strong>más de un profesional</strong> en el mismo consultorio.</li>
            </ul>
            <p className="mt-4 text-xs" style={{ color: "var(--ink-subtle)" }}>
              Para esos casos, Avena o HeyNutre te sirven mejor. Prefiero decírtelo
              antes que venderte algo que te va a frustrar.
            </p>
          </section>

          <section className="card-luxe p-6">
            <p className="eyebrow" style={{ color: "var(--brand-700)" }}>
              Sí somos tu opción si…
            </p>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--ink-muted)" }}>
              <li>• Tu cuello de botella es <strong>armar el plan</strong>, no la agenda.</li>
              <li>• Quieres <strong>entregar un PDF impecable</strong> con tu marca.</li>
              <li>• Atiendes <strong>más de 20 pacientes</strong> y no quieres pagar por tramos.</li>
              <li>• Usas <strong>SMAE</strong> y quieres el plan resuelto en minutos.</li>
              <li>• Valoras <strong>tus datos</strong> y poder exportarlos cuando quieras.</li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/demo" className="btn btn-ghost">
                Ver un plan de ejemplo
              </Link>
              <Link href="/signup" className="btn btn-primary">
                Empezar 14 días gratis
              </Link>
            </div>
          </section>
        </div>

        <p className="mt-10 text-center text-xs" style={{ color: "var(--ink-subtle)" }}>
          ¿Falta un dato o está desactualizado?{" "}
          <a href="mailto:hola@anthroscope.pro" className="underline underline-offset-2">
            Escríbenos
          </a>{" "}
          y lo corregimos.
        </p>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6" style={{ borderColor: "var(--border, #ECE6D8)" }}>
          <PoweredByAnthroscope variant="minimal" />
          <nav className="flex items-center gap-4 text-[11px]" style={{ color: "var(--ink-subtle)" }}>
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
        </footer>
      </div>
    </main>
  );
}
