import { describe, expect, it } from "vitest";
import {
  ageFromBirthDate,
  bmi,
  bmiCategory,
  bodyFatDeurenberg,
  deriveMetrics,
  leanMass,
  waistToHeight,
  waistToHip,
  whrRisk,
  whtrRisk,
} from "./anthropometry";

describe("bmi", () => {
  it("calcula el IMC", () => {
    expect(bmi(70, 175)).toBeCloseTo(22.86, 1);
  });

  it("devuelve null si faltan datos o son inválidos", () => {
    expect(bmi("", 175)).toBeNull();
    expect(bmi(70, 0)).toBeNull();
    expect(bmi("setenta", 175)).toBeNull();
  });

  it("acepta coma decimal", () => {
    expect(bmi("70,5", "175,0")).toBeCloseTo(23.02, 1);
  });
});

describe("bmiCategory", () => {
  it("clasifica según la OMS", () => {
    expect(bmiCategory(17).label).toBe("Bajo peso");
    expect(bmiCategory(22).label).toBe("Normopeso");
    expect(bmiCategory(27).label).toBe("Sobrepeso");
    expect(bmiCategory(32).label).toContain("Obesidad");
  });

  it("marca obesidad en rojo", () => {
    expect(bmiCategory(35).tone).toBe("alert");
  });
});

describe("waistToHip", () => {
  it("calcula el ICC", () => {
    expect(waistToHip(90, 100)).toBeCloseTo(0.9, 2);
  });

  it("devuelve null sin cadera", () => {
    expect(waistToHip(90, null)).toBeNull();
  });
});

describe("whrRisk", () => {
  it("usa el corte de 0.90 en hombres", () => {
    expect(whrRisk(0.89, "masculino").tone).toBe("ok");
    expect(whrRisk(0.9, "masculino").tone).toBe("alert");
  });

  it("usa el corte de 0.85 en mujeres", () => {
    expect(whrRisk(0.84, "femenino").tone).toBe("ok");
    expect(whrRisk(0.86, "femenino").tone).toBe("alert");
  });

  it("no clasifica sin sexo", () => {
    expect(whrRisk(0.95, "").tone).toBe("neutral");
  });
});

describe("cintura/altura", () => {
  it("calcula el ICT", () => {
    expect(waistToHeight(90, 175)).toBeCloseTo(0.514, 2);
  });

  it("clasifica por umbrales de 0.50 y 0.60", () => {
    expect(whtrRisk(0.45).tone).toBe("ok");
    expect(whtrRisk(0.55).tone).toBe("warn");
    expect(whtrRisk(0.65).tone).toBe("alert");
  });
});

describe("ageFromBirthDate", () => {
  it("calcula la edad en años", () => {
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const iso = tenYearsAgo.toISOString().slice(0, 10);
    expect(ageFromBirthDate(iso)).toBeGreaterThanOrEqual(9);
    expect(ageFromBirthDate(iso)).toBeLessThanOrEqual(10);
  });

  it("devuelve null sin fecha", () => {
    expect(ageFromBirthDate(null)).toBeNull();
    expect(ageFromBirthDate("")).toBeNull();
  });
});

describe("bodyFatDeurenberg", () => {
  it("estima el porcentaje de grasa en hombres", () => {
    // 1.20*22.86 + 0.23*25 - 10.8*1 - 5.4 = 16.98
    expect(bodyFatDeurenberg(22.86, 25, "masculino")).toBeCloseTo(16.98, 1);
  });

  it("devuelve null sin edad o sexo", () => {
    expect(bodyFatDeurenberg(22.86, null, "masculino")).toBeNull();
    expect(bodyFatDeurenberg(22.86, 25, "")).toBeNull();
  });
});

describe("leanMass", () => {
  it("calcula la masa magra", () => {
    expect(leanMass(80, 20)).toBeCloseTo(64, 1);
  });

  it("descarta porcentajes imposibles", () => {
    expect(leanMass(80, 0)).toBeNull();
    expect(leanMass(80, 95)).toBeNull();
  });
});

describe("deriveMetrics", () => {
  it("devuelve IMC, ICC e ICT cuando hay datos", () => {
    const keys = deriveMetrics({
      weightKg: 80,
      heightCm: 175,
      waistCm: 90,
      hipCm: 100,
      sex: "masculino",
    }).map((metric) => metric.key);
    expect(keys).toEqual(["imc", "icc", "ict"]);
  });

  it("usa el % de grasa medido y calcula masa magra", () => {
    const metrics = deriveMetrics({
      weightKg: 80,
      heightCm: 175,
      bodyFatPct: 20,
      sex: "masculino",
    });
    expect(metrics.map((m) => m.key)).toContain("grasa");
    expect(metrics.map((m) => m.key)).toContain("magra");
  });

  it("estima la grasa cuando no hay medición", () => {
    const metrics = deriveMetrics({
      weightKg: 80,
      heightCm: 175,
      sex: "masculino",
      birthDate: "1990-01-01",
    });
    expect(metrics.map((m) => m.key)).toContain("grasa-est");
  });

  it("no inventa métricas sin datos", () => {
    expect(deriveMetrics({})).toEqual([]);
  });
});
