/**
 * Límite de pacientes por profesional.
 *
 * 0 (por defecto) = sin límite. El plan de $199 MXN no topa pacientes: es la
 * diferencia frente a otros software del mercado que cortan en 20/40/80.
 *
 * Si algún día se necesita un tope (plan gratuito, control de abuso), se define
 * con MAX_CLIENTS_PER_PRACTITIONER y se aplica en el alta de pacientes.
 */
export const MAX_CLIENTS = (() => {
  const raw = Number(process.env.MAX_CLIENTS_PER_PRACTITIONER ?? 0);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
})();

export const HAS_CLIENT_LIMIT = MAX_CLIENTS > 0;
