"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PoweredByAnthroscope } from "@/components/PoweredByAnthroscope";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLocale } from "@/components/LocaleProvider";

const copy = {
  es: {
    eyebrow: "Acceso único — De por vida",
    headerBrand: "Plan Builder",
    haveAccount: "¿Ya tienes cuenta?",
    signIn: "Iniciar sesión",
    brand: "Plan Builder",
    subtitle:
      "Tu plan nutricional personalizado, con alimentos USDA bilingües, equivalencias mexicanas y PDF descargable. Pago único, acceso de por vida.",
    once: "Pago único",
    lifetime: "De por vida",
    features: [
      "500+ alimentos con equivalencias mexicanas",
      "Cálculo automático de macros y porciones",
      "PDF luxury descargable, listo para imprimir",
      "Código de acceso único enviado por email",
      "Pago seguro procesado por Stripe",
    ],
    buy: "Comprar ahora — $57",
    redirecting: "Redirigiendo a Stripe…",
    secure:
      "Procesado de forma segura por Stripe. Aceptamos tarjetas de todo el mundo.",
    canceled: "Cancelaste el pago. Puedes intentarlo de nuevo cuando quieras.",
    payErr: "Error al iniciar el pago: ",
    afterPay:
      "Tras el pago recibirás un código único de acceso por correo electrónico para crear tu cuenta.",
  },
  en: {
    eyebrow: "One-time access — Lifetime",
    headerBrand: "Plan Builder",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
    brand: "Plan Builder",
    subtitle:
      "Your personalized nutrition plan, with bilingual USDA foods, Mexican exchanges and a downloadable PDF. One-time payment, lifetime access.",
    once: "One-time payment",
    lifetime: "Lifetime",
    features: [
      "500+ foods with Mexican exchanges",
      "Automatic macro and portion calculation",
      "Downloadable luxury PDF, print-ready",
      "Unique access code sent by email",
      "Secure payment processed by Stripe",
    ],
    buy: "Buy now — $57",
    redirecting: "Redirecting to Stripe…",
    secure: "Securely processed by Stripe. We accept cards worldwide.",
    canceled: "You canceled the payment. You can try again whenever you like.",
    payErr: "Error starting payment: ",
    afterPay:
      "After payment you will receive a unique access code by email to create your account.",
  },
};

const EASE = [0.22, 1, 0.36, 1] as const;

function rise(delay: number) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: EASE, delay },
  };
}

export default function ComprarPage({
  searchParams,
}: {
  searchParams?: { canceled?: string; error?: string };
}) {
  const { locale } = useLocale();
  const c = copy[locale];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canceled = searchParams?.canceled === "1";
  const urlError = searchParams?.error;

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "No se pudo iniciar el pago");
      }
      window.location.href = data.url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <main
      className="flex min-h-screen flex-col"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      <header
        className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6"
        style={{
          background: "#0a0a0a",
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        <Link
          href="/"
          className="text-sm font-medium tracking-wide"
          style={{ color: "var(--gold)" }}
        >
          {c.headerBrand}
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs sm:inline" style={{ color: "var(--text-muted)" }}>
            {c.haveAccount}
          </span>
          <Link
            href="/login"
            className="text-xs transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            {c.signIn}
          </Link>
          <LanguageToggle />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl">
          <div className="text-center">
            <motion.p
              {...rise(0)}
              className="label-accent"
              style={{ color: "var(--gold)" }}
            >
              {c.eyebrow}
            </motion.p>

            <motion.h1
              {...rise(0.08)}
              className="mt-5"
              style={{
                fontFamily:
                  "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
                fontSize: "56px",
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                lineHeight: 1.0,
              }}
            >
              Anthroscope{" "}
              <span className="italic" style={{ color: "var(--gold)" }}>
                {c.brand}
              </span>
            </motion.h1>

            <motion.p
              {...rise(0.16)}
              className="mx-auto mt-6 max-w-lg text-base leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              {c.subtitle}
            </motion.p>
          </div>

          <motion.div
            {...rise(0.24)}
            className="mt-10 p-8"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-soft)",
              borderRadius: "16px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
            }}
          >
            <div className="flex items-baseline justify-between">
              <div>
                <p
                  className="label-accent"
                  style={{ color: "var(--text-muted)" }}
                >
                  {c.once}
                </p>
                <p
                  className="mt-1"
                  style={{
                    fontFamily:
                      "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
                    fontSize: "60px",
                    color: "var(--gold)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  $57
                  <span
                    style={{
                      fontSize: "18px",
                      color: "var(--text-muted)",
                      letterSpacing: 0,
                      marginLeft: "8px",
                    }}
                  >
                    USD
                  </span>
                </p>
              </div>
              <div
                className="label-accent rounded-full px-3 py-1"
                style={{
                  background: "rgba(201,169,97,0.12)",
                  color: "var(--gold)",
                  border: "1px solid var(--border-soft)",
                }}
              >
                {c.lifetime}
              </div>
            </div>

            <ul className="mt-7 space-y-3 text-sm">
              {c.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span
                    aria-hidden
                    style={{
                      color: "var(--gold)",
                      fontSize: "15px",
                      marginTop: "1px",
                    }}
                  >
                    ✓
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="btn-luxe mt-8 w-full"
              style={{
                padding: "16px 24px",
                fontSize: "16px",
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? c.redirecting : c.buy}
            </button>

            <p
              className="mt-4 text-center text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {c.secure}
            </p>

            {canceled && (
              <div
                className="mt-5 rounded-md border px-4 py-3 text-sm"
                style={{
                  borderColor: "rgba(201,169,97,0.3)",
                  background: "rgba(201,169,97,0.06)",
                  color: "var(--gold-soft)",
                }}
              >
                {c.canceled}
              </div>
            )}

            {urlError && (
              <div
                className="mt-5 rounded-md border px-4 py-3 text-sm"
                style={{
                  borderColor: "rgba(184,60,42,0.4)",
                  background: "rgba(184,60,42,0.12)",
                  color: "#e8a99a",
                }}
              >
                {c.payErr}
                {decodeURIComponent(urlError)}
              </div>
            )}

            {error && (
              <div
                className="mt-5 rounded-md border px-4 py-3 text-sm"
                style={{
                  borderColor: "rgba(184,60,42,0.4)",
                  background: "rgba(184,60,42,0.12)",
                  color: "#e8a99a",
                }}
              >
                {error}
              </div>
            )}
          </motion.div>

          <motion.p
            {...rise(0.32)}
            className="mt-8 text-center text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            {c.afterPay}
          </motion.p>
        </div>
      </div>

      <PoweredByAnthroscope variant="dark" />
    </main>
  );
}
