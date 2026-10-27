import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Cliente de Stripe (lazy). Devuelve null si falta la clave, para que las
 * páginas puedan renderizar sin Stripe configurado en desarrollo.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) cached = new Stripe(key);
  return cached;
}

export function requireStripe(): Stripe {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Stripe no está configurado (falta STRIPE_SECRET_KEY).");
  }
  return stripe;
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "http://localhost:3000"
  );
}
