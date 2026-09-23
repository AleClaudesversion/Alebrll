const productosRepo = require('../db/repositories/productos.repo');
const pedidosRepo = require('../db/repositories/pedidos.repo');
const pricingService = require('./pricing.service');
const mercadopagoService = require('./mercadopago.service');

class CarritoInvalidoError extends Error {}

/**
 * Recalcula el carrito enteramente desde la base de datos - nunca confia en precios
 * o nombres que mande el cliente. Es el unico lugar donde se decide cuanto cuesta un pedido.
 * El precio de cada item depende del metodo de pago elegido (efectivo/transferencia/mercadopago).
 */
function recalcularCarrito(itemsSolicitados, metodoPago) {
  if (!Array.isArray(itemsSolicitados) || itemsSolicitados.length === 0) {
    throw new CarritoInvalidoError('El carrito esta vacio.');
  }

  const ids = itemsSolicitados.map((i) => Number(i.productoId));
  const productos = productosRepo.porIds(ids);
  const productosPorId = new Map(productos.map((p) => [p.id, p]));

  const items = itemsSolicitados.map((solicitado) => {
    const producto = productosPorId.get(Number(solicitado.productoId));
    if (!producto || !producto.activo) {
      throw new CarritoInvalidoError(`Producto ${solicitado.productoId} no existe o no esta disponible.`);
    }
    const cantidad = Number(solicitado.cantidad);
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new CarritoInvalidoError(`Cantidad invalida para ${producto.nombre}.`);
    }
    if (producto.stock < cantidad) {
      throw new CarritoInvalidoError(`No hay stock suficiente de "${producto.nombre}".`);
    }
    return {
      productoId: producto.id,
      nombre: producto.nombre,
      precioUnitario: pricingService.precioParaMetodo(producto, metodoPago),
      cantidad,
    };
  });

  const total = items.reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0);
  return { items, total };
}

async function iniciarCheckoutMercadoPago({ itemsSolicitados, comprador, notas }) {
  const { items, total } = recalcularCarrito(itemsSolicitados, 'mercadopago');

  const pedidoId = pedidosRepo.crear({
    metodoPago: 'mercadopago',
    totalCobrado: total,
    comprador,
    notas,
    items,
  });

  const { preferenceId, initPoint } = await mercadopagoService.crearPreference({
    pedidoId,
    items,
    comprador,
  });

  pedidosRepo.guardarPreference(pedidoId, preferenceId);

  return { pedidoId, initPoint };
}

function crearPedidoTransferencia({ itemsSolicitados, comprador, notas }) {
  const { items, total } = recalcularCarrito(itemsSolicitados, 'transferencia');
  const pedidoId = pedidosRepo.crear({
    metodoPago: 'transferencia',
    totalCobrado: total,
    comprador,
    notas,
    items,
  });
  return { pedidoId };
}

function crearPedidoEfectivo({ itemsSolicitados, comprador, notas }) {
  const { items, total } = recalcularCarrito(itemsSolicitados, 'efectivo');
  const pedidoId = pedidosRepo.crear({
    metodoPago: 'efectivo',
    totalCobrado: total,
    comprador,
    notas,
    items,
  });
  return { pedidoId };
}

/**
 * Procesa una notificacion de webhook de Mercado Pago: consulta el pago real contra la
 * API (nunca confia en el payload en si mismo), verifica que corresponda a un pedido
 * conocido y recien ahi actualiza el estado. Idempotente ante reintentos de MP.
 */
async function procesarWebhookPago(paymentId) {
  const pago = await mercadopagoService.consultarPago(paymentId);
  const pedidoId = Number(pago.external_reference);
  const pedido = pedidosRepo.porId(pedidoId);

  if (!pedido) {
    pedidosRepo.registrarWebhook({
      pedidoId: null,
      payloadCrudo: JSON.stringify({ error: 'pedido no encontrado', paymentId, external_reference: pago.external_reference }),
      procesadoOk: false,
    });
    return { ok: false, razon: 'pedido no encontrado' };
  }

  if (pedido.mp_payment_id === String(paymentId) && pedido.estado === 'pagado') {
    // Reintento de un webhook ya procesado: no hacer nada de nuevo.
    return { ok: true, yaProcesado: true };
  }

  const montoEsperado = pedido.total_cobrado;
  const montoRecibido = Math.round(pago.transaction_amount);
  if (pago.status === 'approved' && montoRecibido !== montoEsperado) {
    pedidosRepo.registrarWebhook({
      pedidoId,
      payloadCrudo: JSON.stringify({ alerta: 'monto no coincide', montoEsperado, montoRecibido, paymentId }),
      procesadoOk: false,
    });
    return { ok: false, razon: 'monto no coincide' };
  }

  const nuevoEstado = pedidosRepo.marcarPago({
    pedidoId,
    paymentId: String(paymentId),
    status: pago.status,
    statusDetail: pago.status_detail,
  });

  pedidosRepo.registrarWebhook({
    pedidoId,
    payloadCrudo: JSON.stringify(pago),
    procesadoOk: true,
  });

  return { ok: true, estado: nuevoEstado };
}

module.exports = {
  CarritoInvalidoError,
  recalcularCarrito,
  iniciarCheckoutMercadoPago,
  crearPedidoTransferencia,
  crearPedidoEfectivo,
  procesarWebhookPago,
};
