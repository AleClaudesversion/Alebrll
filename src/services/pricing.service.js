const configRepo = require('../db/repositories/config.repo');

/**
 * Redondea al centenar mas cercano - los precios del catalogo son multiplos de 100.
 */
function redondearCentena(valor) {
  return Math.round(valor / 100) * 100;
}

function precioConRecargoMp(precioLista, recargoPct) {
  return redondearCentena(precioLista / (1 - recargoPct / 100));
}

function calcularPrecios(precioLista, recargoPctOverride) {
  const recargoPct = recargoPctOverride ?? configRepo.obtenerRecargoMpPct();
  return {
    precioLista,
    precioMercadoPago: precioConRecargoMp(precioLista, recargoPct),
    recargoPct,
  };
}

module.exports = { redondearCentena, precioConRecargoMp, calcularPrecios };
