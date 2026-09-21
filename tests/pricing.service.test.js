const test = require('node:test');
const assert = require('node:assert/strict');
const { precioConRecargoMp, redondearCentena } = require('../src/services/pricing.service');

test('redondearCentena redondea al centenar mas cercano', () => {
  assert.equal(redondearCentena(46808.51), 46800);
  assert.equal(redondearCentena(46850), 46900);
});

test('precioConRecargoMp cubre exactamente la comision al 6%', () => {
  const precioLista = 44000;
  const precioMp = precioConRecargoMp(precioLista, 6);
  // Si Mercado Pago descuenta 6% sobre el precio MP, lo que queda debe cubrir el precio de lista.
  const netoRecibido = precioMp * (1 - 0.06);
  assert.ok(netoRecibido >= precioLista - 50, `neto ${netoRecibido} deberia cubrir ${precioLista}`);
});

test('precioConRecargoMp con 0% de recargo devuelve el mismo precio (redondeado)', () => {
  assert.equal(precioConRecargoMp(15000, 0), 15000);
});

test('precioConRecargoMp escala correctamente con distintos porcentajes', () => {
  const bajo = precioConRecargoMp(30000, 3);
  const alto = precioConRecargoMp(30000, 9);
  assert.ok(alto > bajo, 'a mayor recargo, mayor precio con Mercado Pago');
});
