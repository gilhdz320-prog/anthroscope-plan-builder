import Link from "next/link";
import { PoweredByAnthroscope } from "@/components/PoweredByAnthroscope";

export default function GraciasPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg text-center">
          <p className="eyebrow rise">Pago confirmado</p>

          <h1
            className="font-display mt-5 rise rise-1"
            style={{
              fontSize: "46px",
              color: "var(--ink-strong)",
              letterSpacing: "-0.03em",
              lineHeight: 1.02,
            }}
          >
            ¡Gracias por tu{" "}
            <span
              className="italic"
              style={{ color: "var(--brand-700)" }}
            >
              compra
            </span>
            !
          </h1>

          <p
            className="mx-auto mt-5 max-w-md text-base leading-relaxed rise rise-2"
            style={{ color: "var(--ink-muted)" }}
          >
            Acabamos de enviar tu código de acceso al correo con el que pagaste.
            Llega en menos de 2 minutos.
          </p>

          <div className="card-luxe mt-10 p-7 text-left rise rise-3">
            <p className="eyebrow">Siguientes pasos</p>
            <ol
              className="mt-4 space-y-3 text-sm"
              style={{ color: "var(--ink-default)" }}
            >
              <li className="flex gap-3">
                <span
                  className="font-display"
                  style={{
                    color: "var(--brand-700)",
                    fontSize: "20px",
                    lineHeight: 1,
                  }}
                >
                  1.
                </span>
                <span>
                  Revisa tu correo. Busca un mensaje de{" "}
                  <span style={{ color: "var(--ink-strong)" }}>
                    Anthroscope
                  </span>{" "}
                  (revisa también SPAM o Promociones).
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  className="font-display"
                  style={{
                    color: "var(--brand-700)",
                    fontSize: "20px",
                    lineHeight: 1,
                  }}
                >
                  2.
                </span>
                <span>Copia tu código de acceso (formato APB-XXXX-XXXX-XXXX).</span>
              </li>
              <li className="flex gap-3">
                <span
                  className="font-display"
                  style={{
                    color: "var(--brand-700)",
                    fontSize: "20px",
                    lineHeight: 1,
                  }}
                >
                  3.
                </span>
                <span>
                  Activa tu cuenta y empieza a crear planes profesionales.
                </span>
              </li>
            </ol>

            <Link
              href="/signup?from=stripe"
              className="btn btn-brand mt-6 w-full"
            >
              Activar mi cuenta →
            </Link>
          </div>

          <p
            className="mt-8 text-xs rise rise-4"
            style={{ color: "var(--ink-subtle)" }}
          >
            ¿Problemas para encontrar el correo? Escríbenos a{" "}
            <a
              href="mailto:support@anthroscope.pro"
              style={{ color: "var(--brand-700)" }}
            >
              support@anthroscope.pro
            </a>
          </p>

          <div className="mt-10">
            <PoweredByAnthroscope />
          </div>
        </div>
      </div>
    </main>
  );
}
