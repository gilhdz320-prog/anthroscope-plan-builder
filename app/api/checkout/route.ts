import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://planbuilder.anthroscope.pro";

const stripe = stripeKey ? new Stripe(stripeKey) : null;

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured (missing STRIPE_SECRET_KEY)" },
      { status: 500 },
    );
  }

  try {
    // Detect locale from Accept-Language header
    const acceptLang = req.headers.get("accept-language") ?? "";
    const isSpanish = acceptLang.toLowerCase().includes("es");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 5700, // $57.00 USD
            product_data: {
              name: "Anthroscope Plan Builder",
              description: isSpanish
                ? "Plan nutricional personalizado con 224 alimentos USDA bilingues, equivalencias mexicanas y PDF descargable. Acceso unico de por vida."
                : "Personalized nutrition plan with 224 bilingual USDA foods, Mexican equivalents, and downloadable PDF. Lifetime single-use access.",
            },
          },
          quantity: 1,
        },
      ],
      locale: isSpanish ? "es" : "en",
      success_url: `${appUrl}/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/comprar?canceled=1`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_creation: "always",
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "No checkout URL returned by Stripe" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[checkout] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Convenience: GET /api/checkout redirects directly to Stripe Checkout
  if (!stripe) {
    return NextResponse.redirect(`${appUrl}/comprar?error=config`);
  }

  try {
    const acceptLang = req.headers.get("accept-language") ?? "";
    const isSpanish = acceptLang.toLowerCase().includes("es");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 5700,
            product_data: {
              name: "Anthroscope Plan Builder",
              description: isSpanish
                ? "Plan nutricional personalizado con 224 alimentos USDA bilingues, equivalencias mexicanas y PDF descargable. Acceso unico de por vida."
                : "Personalized nutrition plan with 224 bilingual USDA foods, Mexican equivalents, and downloadable PDF. Lifetime single-use access.",
            },
          },
          quantity: 1,
        },
      ],
      locale: isSpanish ? "es" : "en",
      success_url: `${appUrl}/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/comprar?canceled=1`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_creation: "always",
    });

    if (!session.url) {
      return NextResponse.redirect(`${appUrl}/comprar?error=nourl`);
    }

    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[checkout GET] error:", msg);
    return NextResponse.redirect(
      `${appUrl}/comprar?error=${encodeURIComponent(msg.slice(0, 80))}`,
    );
  }
}
