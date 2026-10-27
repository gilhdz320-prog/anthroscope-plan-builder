import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/billing/stripe";
import { getSubscriptionRow } from "@/lib/billing/sync";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mis recibos · Anthroscope Plan Builder",
};

function money(amountCents: number | null, currency: string | null): string {
  if (amountCents == null) return "—";
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: (currency ?? "mxn").toUpperCase(),
    }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency ?? ""}`;
  }
}

function statusLabel(status: string | null): { text: string; color: string } {
  switch (status) {
    case "paid":
      return { text: "Pagado", color: "#0F7B5C" };
    case "open":
      return { text: "Pendiente", color: "#7E6322" };
    case "void":
      return { text: "Anulado", color: "var(--ink-subtle)" };
    case "uncollectible":
      return { text: "Impagable", color: "#9B2C2C" };
    case "draft":
      return { text: "Borrador", color: "var(--ink-subtle)" };
    default:
      return { text: status ?? "—", color: "var(--ink-subtle)" };
  }
}

export default async function RecibosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
          Necesitas iniciar sesión.{" "}
          <Link href="/login?redirect=/suscripcion/recibos" className="underline">
            Entrar
          </Link>
        </p>
      </main>
    );
  }

  const admin = createAdminClient();
  const row = await getSubscriptionRow(admin, user.id);
  const stripe = getStripe();

  let invoices: Array<{
    id: string;
    number: string | null;
    created: number;
    amount: number | null;
    currency: string | null;
    status: string | null;
    pdf: string | null;
    hosted: string | null;
    description: string | null;
  }> = [];
  let problem: string | null = null;

  if (!row?.stripe_customer_id) {
    problem =
      "Todavía no tienes una suscripción con Stripe, así que no hay recibos que mostrar.";
  } else if (!stripe) {
    problem = "Stripe no está configurado en el servidor, no se pueden leer los recibos.";
  } else {
    try {
      const list = await stripe.invoices.list({
        customer: row.stripe_customer_id,
        limit: 24,
      });
      invoices = list.data.map((invoice) => ({
        id: invoice.id ?? "",
        number: invoice.number ?? null,
        created: invoice.created,
        amount: invoice.amount_paid ?? invoice.total ?? null,
        currency: invoice.currency ?? null,
        status: invoice.status ?? null,
        pdf: invoice.invoice_pdf ?? null,
        hosted: invoice.hosted_invoice_url ?? null,
        description: invoice.lines?.data?.[0]?.description ?? null,
      }));
    } catch (err) {
      console.error("[recibos]", err);
      problem = "No se pudieron leer los recibos desde Stripe. Intenta más tarde.";
    }
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--paper)" }}>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/suscripcion" className="eyebrow" style={{ color: "var(--gold)" }}>
          ← Suscripción
        </Link>

        <h1
          className="font-display mt-4"
          style={{ fontSize: "clamp(28px,4vw,38px)", lineHeight: 1.05, color: "var(--ink-strong)" }}
        >
          Mis recibos
        </h1>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
          Cada cobro genera un recibo en PDF que Stripe emite con los datos de tu
          tarjeta y el concepto. Sirve como comprobante de pago.
        </p>

        {problem && (
          <div
            className="mt-6 rounded-md border p-4 text-sm"
            style={{ background: "var(--surface-sunken, #F3EFE5)", borderColor: "var(--border, #ECE6D8)", color: "var(--ink-muted)" }}
          >
            {problem}
            <div className="mt-3">
              <Link href="/suscripcion" className="btn btn-ghost">
                Ir a planes
              </Link>
            </div>
          </div>
        )}

        {invoices.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-lg border" style={{ borderColor: "var(--border, #ECE6D8)" }}>
            <table className="w-full text-sm">
              <thead style={{ background: "var(--surface-sunken, #F3EFE5)" }}>
                <tr>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--ink-subtle)" }}>
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--ink-subtle)" }}>
                    Concepto
                  </th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--ink-subtle)" }}>
                    Total
                  </th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--ink-subtle)" }}>
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right font-medium" style={{ color: "var(--ink-subtle)" }}>
                    PDF
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const status = statusLabel(invoice.status);
                  return (
                    <tr key={invoice.id} style={{ borderTop: "1px solid var(--border, #ECE6D8)" }}>
                      <td className="px-4 py-3" style={{ color: "var(--ink-strong)" }}>
                        {new Date(invoice.created * 1000).toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--ink-muted)" }}>
                        {invoice.description ?? invoice.number ?? "Suscripción"}
                      </td>
                      <td className="px-4 py-3 font-mono-tabular" style={{ color: "var(--ink-strong)" }}>
                        {money(invoice.amount, invoice.currency)}
                      </td>
                      <td className="px-4 py-3" style={{ color: status.color }}>
                        {status.text}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {invoice.pdf ? (
                          <a
                            href={invoice.pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline underline-offset-2"
                            style={{ color: "var(--brand-700)" }}
                          >
                            Descargar
                          </a>
                        ) : invoice.hosted ? (
                          <a
                            href={invoice.hosted}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline underline-offset-2"
                            style={{ color: "var(--brand-700)" }}
                          >
                            Ver
                          </a>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--ink-subtle)" }}>
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 rounded-md border p-4 text-xs leading-relaxed" style={{ borderColor: "var(--border, #ECE6D8)", color: "var(--ink-muted)" }}>
          <strong style={{ color: "var(--ink-strong)" }}>¿Necesitas factura (CFDI)?</strong>{" "}
          Por ahora el recibo de Stripe funciona como comprobante, pero no es un CFDI
          mexicano. Si tu contador lo requiere, escríbenos a{" "}
          <a href="mailto:hola@anthroscope.pro" className="underline underline-offset-2">
            hola@anthroscope.pro
          </a>{" "}
          y lo resolvemos caso por caso.
        </div>
      </div>
    </main>
  );
}
