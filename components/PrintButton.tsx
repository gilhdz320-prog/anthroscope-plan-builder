"use client";

/** Botón de impresión reutilizable (lista de compras, plan, etc.). */
export function PrintButton({
  label = "Imprimir",
  className = "btn btn-ghost",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      {label}
    </button>
  );
}
