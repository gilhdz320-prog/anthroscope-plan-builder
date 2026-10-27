/**
 * Utilidades de exportación.
 *
 * Reglas:
 * - CSV con BOM UTF-8 para que Excel en Windows no rompa los acentos.
 * - Escapado RFC 4180: comillas dobles duplicadas y campos con saltos de línea
 *   entre comillas. Sin esto, un apellido con coma rompe el archivo.
 */

export type Cell = string | number | boolean | null | undefined;

export function escapeCsvCell(value: Cell): string {
  if (value === null || value === undefined) return "";
  const raw = String(value);
  if (/["\n\r,;]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function toCsv(
  rows: Array<Record<string, Cell>>,
  columns: Array<{ key: string; header: string }>,
): string {
  const header = columns.map((column) => escapeCsvCell(column.header)).join(",");
  const body = rows
    .map((row) => columns.map((column) => escapeCsvCell(row[column.key])).join(","))
    .join("\r\n");
  return `\uFEFF${header}\r\n${body}\r\n`;
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Nombre de archivo con fecha, sin caracteres problemáticos. */
export function datedFilename(prefix: string, extension: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${date}.${extension}`;
}
