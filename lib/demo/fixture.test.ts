import { describe, expect, it } from "vitest";
import { buildDemo } from "./fixture";

const demo = buildDemo();

describe("demo pública", () => {
  it("usa el motor real y queda cerca del objetivo calórico", () => {
    // El motor redondea a equivalentes enteros: se tolera ±10%.
    expect(demo.totalsMacros.kcal).toBeGreaterThan(demo.targetKcal * 0.9);
    expect(demo.totalsMacros.kcal).toBeLessThan(demo.targetKcal * 1.1);
  });

  it("reparte todos los equivalentes entre las comidas, sin perder ninguno", () => {
    for (const grupo of Object.keys(demo.totals) as Array<keyof typeof demo.totals>) {
      const repartido = demo.meals
        .flatMap((meal) => meal.items)
        .filter((item) => item.grupo === grupo)
        .reduce((sum, item) => sum + item.count, 0);
      expect(repartido).toBe(demo.totals[grupo]);
    }
  });

  it("tiene 5 comidas y todas con contenido", () => {
    expect(demo.meals).toHaveLength(5);
    for (const meal of demo.meals) {
      expect(meal.items.length).toBeGreaterThan(0);
      expect(meal.kcal).toBeGreaterThan(0);
    }
  });

  it("la suma de kcal de las comidas coincide con el total", () => {
    const totalComidas = demo.meals.reduce((sum, meal) => sum + meal.kcal, 0);
    expect(totalComidas).toBe(demo.totalsMacros.kcal);
  });

  it("calcula índices antropométricos del paciente de ejemplo", () => {
    const keys = demo.metrics.map((metric) => metric.key);
    expect(keys).toContain("imc");
    expect(keys).toContain("ict");
    expect(keys).toContain("icc");
  });

  it("trae 8 semanas de progreso con peso descendente", () => {
    expect(demo.progress).toHaveLength(8);
    expect(demo.progress[7].weight).toBeLessThan(demo.progress[0].weight);
  });
});
