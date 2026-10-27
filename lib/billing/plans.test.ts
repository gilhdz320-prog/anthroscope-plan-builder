import { afterEach, describe, expect, it, vi } from "vitest";
import { fromUnix, inferPlan, isAccessGranting, mapStatus } from "./plans";
import { BILLING, formatPrice, monthlyEquivalent } from "./config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("mapStatus", () => {
  it("mapea los estados de Stripe que nos importan", () => {
    expect(mapStatus("active")).toBe("active");
    expect(mapStatus("trialing")).toBe("trialing");
    expect(mapStatus("past_due")).toBe("past_due");
    expect(mapStatus("canceled")).toBe("canceled");
    expect(mapStatus("unpaid")).toBe("unpaid");
  });

  it("cae en incomplete ante un estado desconocido", () => {
    expect(mapStatus("estado_inventado")).toBe("incomplete");
  });
});

describe("isAccessGranting", () => {
  it("solo trialing y active dan acceso", () => {
    expect(isAccessGranting("trialing")).toBe(true);
    expect(isAccessGranting("active")).toBe(true);
    expect(isAccessGranting("past_due")).toBe(false);
    expect(isAccessGranting("canceled")).toBe(false);
  });
});

describe("inferPlan", () => {
  it("usa el price ID anual configurado", () => {
    vi.stubEnv("STRIPE_PRICE_ANNUAL", "price_annual");
    expect(inferPlan("price_annual", "year")).toBe("annual");
  });

  it("usa el price ID mensual configurado", () => {
    vi.stubEnv("STRIPE_PRICE_MONTHLY", "price_monthly");
    expect(inferPlan("price_monthly", "month")).toBe("monthly");
  });

  it("cae al intervalo de Stripe si no hay price ID conocido", () => {
    expect(inferPlan("price_desconocido", "year")).toBe("annual");
    expect(inferPlan(null, "month")).toBe("monthly");
  });
});

describe("fromUnix", () => {
  it("convierte segundos a ISO", () => {
    expect(fromUnix(0)).toBe("1970-01-01T00:00:00.000Z");
  });

  it("devuelve null cuando no hay fecha", () => {
    expect(fromUnix(null)).toBeNull();
    expect(fromUnix(undefined)).toBeNull();
  });
});

describe("configuración de precios", () => {
  it("cobra 199 MXN al mes y 1.990 al año", () => {
    expect(BILLING.plans.monthly.amount).toBe(19900);
    expect(BILLING.plans.annual.amount).toBe(199000);
    expect(BILLING.currency).toBe("mxn");
  });

  it("el anual equivale a menos que 12 mensualidades", () => {
    expect(monthlyEquivalent("annual")).toBeLessThan(BILLING.plans.monthly.amount);
    expect(monthlyEquivalent("monthly")).toBe(BILLING.plans.monthly.amount);
  });

  it("formatea el precio sin decimales", () => {
    const formatted = formatPrice(19900);
    expect(formatted).toContain("199");
    expect(formatted).not.toContain("199.00");
  });
});
