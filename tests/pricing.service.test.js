const test = require('node:test');
const assert = require('node:assert/strict');
const { preciosDe, precioParaMetodo } = require('../src/services/pricing.service');

const producto = {
  precio_efectivo: 100000,
  precio_transferencia: 120000,
  precio_cuotas: 160000,
};

test('preciosDe expone los 3 precios manuales del producto', () => {
  assert.deepEqual(preciosDe(producto), {
    efectivo: 100000,
    transferencia: 120000,
    cuotas: 160000,
  });
});

test('precioParaMetodo devuelve el precio correcto segun el metodo de pago', () => {
  assert.equal(precioParaMetodo(producto, 'efectivo'), 100000);
  assert.equal(precioParaMetodo(producto, 'transferencia'), 120000);
  assert.equal(precioParaMetodo(producto, 'mercadopago'), 160000);
});

test('precioParaMetodo rechaza un metodo de pago desconocido', () => {
  assert.throws(() => precioParaMetodo(producto, 'bitcoin'));
});
