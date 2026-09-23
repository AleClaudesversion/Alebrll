const METODOS_VALIDOS = ['efectivo', 'transferencia', 'mercadopago'];

function preciosDe(producto) {
  return {
    efectivo: producto.precio_efectivo,
    transferencia: producto.precio_transferencia,
    cuotas: producto.precio_cuotas,
  };
}

function precioParaMetodo(producto, metodoPago) {
  if (metodoPago === 'efectivo') return producto.precio_efectivo;
  if (metodoPago === 'transferencia') return producto.precio_transferencia;
  if (metodoPago === 'mercadopago') return producto.precio_cuotas;
  throw new Error(`Metodo de pago desconocido: ${metodoPago}`);
}

module.exports = { METODOS_VALIDOS, preciosDe, precioParaMetodo };
