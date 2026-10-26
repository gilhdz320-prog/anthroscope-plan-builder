import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAccess } from "./access";

type FakeOptions = {
  legacy?: boolean;
  row?: {
    status: string | null;
    plan?: string | null;
    trial_end?: string | null;
    current_period_end?: string | null;
    cancel_at_period_end?: boolean | null;
  } | null;
  error?: { code?: string; message?: string } | null;
};

function fakeSupabase({
  legacy = false,
  row = null,
  error = null,
}: FakeOptions): SupabaseClient {
  return {
    rpc: async () => ({ data: legacy, error: null }),
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: row, error }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

const daysFromNow = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString();

describe("getAccess", () => {
  it("da acceso de por vida a quien tiene código legacy", async () => {
    const access = await getAccess(fakeSupabase({ legacy: true }), "u1");
    expect(access.hasAccess).toBe(true);
    expect(access.kind).toBe("legacy");
  });

  it("da acceso con suscripción activa", async () => {
    const access = await getAccess(
      fakeSupabase({ row: { status: "active", plan: "monthly" } }),
      "u1",
    );
    expect(access.hasAccess).toBe(true);
    expect(access.kind).toBe("active");
    expect(access.plan).toBe("monthly");
  });

  it("calcula los días de trial restantes", async () => {
    const access = await getAccess(
      fakeSupabase({
        row: { status: "trialing", trial_end: daysFromNow(5) },
      }),
      "u1",
    );
    expect(access.hasAccess).toBe(true);
    expect(access.kind).toBe("trial");
    expect(access.trialDaysLeft).toBeGreaterThanOrEqual(4);
    expect(access.trialDaysLeft).toBeLessThanOrEqual(5);
  });

  it("bloquea cuando el trial ya venció", async () => {
    const access = await getAccess(
      fakeSupabase({
        row: { status: "trialing", trial_end: daysFromNow(-1) },
      }),
      "u1",
    );
    expect(access.hasAccess).toBe(false);
    expect(access.kind).toBe("expired");
  });

  it("mantiene acceso con past_due dentro del periodo de gracia", async () => {
    const access = await getAccess(
      fakeSupabase({
        row: { status: "past_due", current_period_end: daysFromNow(-1) },
      }),
      "u1",
    );
    expect(access.hasAccess).toBe(true);
    expect(access.kind).toBe("past_due");
    expect(access.graceDaysLeft).toBeGreaterThan(0);
  });

  it("corta el acceso cuando la gracia de past_due terminó", async () => {
    const access = await getAccess(
      fakeSupabase({
        row: { status: "past_due", current_period_end: daysFromNow(-30) },
      }),
      "u1",
    );
    expect(access.hasAccess).toBe(false);
    expect(access.kind).toBe("expired");
  });

  it("bloquea suscripciones canceladas", async () => {
    const access = await getAccess(
      fakeSupabase({ row: { status: "canceled" } }),
      "u1",
    );
    expect(access.hasAccess).toBe(false);
    expect(access.kind).toBe("expired");
  });

  it("sin suscripción ni código no hay acceso", async () => {
    const access = await getAccess(fakeSupabase({}), "u1");
    expect(access.hasAccess).toBe(false);
    expect(access.kind).toBe("none");
  });

  it("un trial sin fecha no regala acceso", async () => {
    const access = await getAccess(
      fakeSupabase({ row: { status: "trialing", trial_end: null } }),
      "u1",
    );
    expect(access.hasAccess).toBe(false);
    expect(access.kind).toBe("expired");
  });

  it("no bloquea a todas si aún no se aplicó la migración de suscripciones", async () => {
    const access = await getAccess(
      fakeSupabase({
        error: { code: "42P01", message: 'relation "public.subscriptions" does not exist' },
      }),
      "u1",
    );
    expect(access.hasAccess).toBe(true);
  });
});
