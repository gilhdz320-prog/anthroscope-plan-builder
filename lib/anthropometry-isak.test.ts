import { describe, expect, it } from "vitest";
import {
  bodyDensityDW,
  bodyFatISAK,
  countFolds,
  deriveMetrics,
  siriFromDensity,
  sumFolds,
} from "./anthropometry";

const DW_SITES = {
  biceps: 5,
  triceps: 10,
  subscapular: 12,
  iliac: 20,
};

describe("sumFolds", () => {
  it("suma los pliegues capturados", () => {
    expect(sumFolds({ triceps: 10, subscapular: 12 })).toBe(22);
  });

  it("ignora vacíos y acepta coma decimal", () => {
    expect(sumFolds({ triceps: "10,5", biceps: "", abdominal: 8 })).toBeCloseTo(18.5, 1);
  });

  it("devuelve null si no hay ninguno", () => {
    expect(sumFolds({})).toBeNull();
    expect(sumFolds({ triceps: "" })).toBeNull();
  });
});

describe("countFolds", () => {
  it("cuenta solo los sitios con valor", () => {
    expect(countFolds({ triceps: 10, biceps: 5, calf: "" })).toBe(2);
  });
});

describe("bodyDensityDW", () => {
  it("aplica la ecuación de hombres", () => {
    expect(bodyDensityDW(DW_SITES, "masculino")).toBeCloseTo(1.0521, 3);
  });

  it("aplica la ecuación de mujeres", () => {
    expect(bodyDensityDW(DW_SITES, "femenino")).toBeCloseTo(1.0363, 3);
  });

  it("exige los 4 sitios", () => {
    const { iliac: _omit, ...incomplete } = DW_SITES;
    expect(bodyDensityDW(incomplete, "masculino")).toBeNull();
  });

  it("exige sexo", () => {
    expect(bodyDensityDW(DW_SITES, "")).toBeNull();
  });
});

describe("siriFromDensity", () => {
  it("convierte densidad a porcentaje de grasa", () => {
    expect(siriFromDensity(1.0521)).toBeCloseTo(20.5, 1);
  });

  it("descarta densidades imposibles", () => {
    expect(siriFromDensity(null)).toBeNull();
    expect(siriFromDensity(0)).toBeNull();
  });
});

describe("bodyFatISAK", () => {
  it("devuelve el porcentaje y la ecuación usada", () => {
    const result = bodyFatISAK(DW_SITES, "masculino");
    expect(result).not.toBeNull();
    expect(result?.pct).toBeCloseTo(20.5, 1);
    expect(result?.equation).toBe("Durnin-Womersley · Siri");
    expect(result?.sites).toBe(4);
  });

  it("no calcula sin los cuatro pliegues", () => {
    expect(bodyFatISAK({ triceps: 10, biceps: 4 }, "masculino")).toBeNull();
  });
});

describe("deriveMetrics con pliegues", () => {
  it("incluye la suma de pliegues y el %grasa ISAK", () => {
    const metrics = deriveMetrics({
      weightKg: 80,
      heightCm: 175,
      sex: "masculino",
      folds: DW_SITES,
    });
    const keys = metrics.map((metric) => metric.key);
    expect(keys).toContain("pliegues");
    expect(keys).toContain("grasa-isak");
  });

  it("calcula masa magra a partir de la grasa ISAK", () => {
    const metrics = deriveMetrics({
      weightKg: 80,
      heightCm: 175,
      sex: "masculino",
      folds: DW_SITES,
    });
    const lean = metrics.find((metric) => metric.key === "magra");
    expect(lean?.value).toMatch(/kg$/);
  });

  it("prefiere el %grasa medido sobre el de ISAK", () => {
    const metrics = deriveMetrics({
      weightKg: 80,
      heightCm: 175,
      sex: "masculino",
      bodyFatPct: 18,
      folds: DW_SITES,
    });
    const keys = metrics.map((metric) => metric.key);
    expect(keys).toContain("grasa");
    expect(keys).not.toContain("grasa-isak");
  });

  it("indica cuántos sitios se capturaron", () => {
    const metrics = deriveMetrics({
      weightKg: 80,
      heightCm: 175,
      sex: "masculino",
      folds: { triceps: 10, biceps: 5 },
    });
    const sum = metrics.find((metric) => metric.key === "pliegues");
    expect(sum?.hint).toBe("2/8 sitios ISAK");
  });
});
