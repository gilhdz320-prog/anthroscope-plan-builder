import { describe, expect, it } from "vitest";
import { escapeCsvCell, toCsv, datedFilename } from "./csv";

describe("escapeCsvCell", () => {
  it("deja intactos los valores simples", () => {
    expect(escapeCsvCell("Ana")).toBe("Ana");
    expect(escapeCsvCell(42)).toBe("42");
    expect(escapeCsvCell(false)).toBe("false");
  });

  it("devuelve cadena vacía para null y undefined", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });

  it("entrecomilla comas y punto y coma", () => {
    expect(escapeCsvCell("Pérez, Ana")).toBe('"Pérez, Ana"');
    expect(escapeCsvCell("a;b")).toBe('"a;b"');
  });

  it("duplica comillas internas (RFC 4180)", () => {
    expect(escapeCsvCell('El "mejor" plan')).toBe('"El ""mejor"" plan"');
  });

  it("entrecomilla saltos de línea para no romper filas", () => {
    expect(escapeCsvCell("linea1\nlinea2")).toBe('"linea1\nlinea2"');
  });
});

describe("toCsv", () => {
  const columns = [
    { key: "nombre", header: "Nombre" },
    { key: "peso", header: "Peso (kg)" },
  ];

  it("incluye BOM, cabecera y CRLF", () => {
    const csv = toCsv([{ nombre: "Ana", peso: 60 }], columns);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Nombre,Peso (kg)");
    expect(csv).toContain("\r\n");
  });

  it("mantiene el orden de columnas aunque el objeto venga desordenado", () => {
    const csv = toCsv([{ peso: 60, nombre: "Ana" }], columns);
    expect(csv).toContain("Ana,60");
  });

  it("escapa valores con coma sin desplazar columnas", () => {
    const csv = toCsv([{ nombre: "Pérez, Ana", peso: 60 }], columns);
    expect(csv).toContain('"Pérez, Ana",60');
  });
});

describe("datedFilename", () => {
  it("incluye la fecha en formato ISO corto", () => {
    expect(datedFilename("pacientes", "csv")).toMatch(/^pacientes-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
