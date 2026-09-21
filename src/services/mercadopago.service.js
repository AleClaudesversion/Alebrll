const crypto = require('crypto');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const env = require('../config/env');

let client = null;
function getClient() {
  if (!env.MP_ACCESS_TOKEN) {
    throw new Error('MP_ACCESS_TOKEN no configurado - no se puede hablar con Mercado Pago.');
  }
  if (!client) {
    client = new MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN });
  }
  return client;
}

/**
 * Crea una preference de Checkout Pro con el carrito ya validado server-side.
 * items: [{ nombre, cantidad, precioUnitario }]
 */
async function crearPreference({ pedidoId, items, comprador }) {
  const preference = new Preference(getClient());
  const body = {
    items: items.map((item) => ({
      title: item.nombre,
      quantity: item.cantidad,
      unit_price: item.precioUnitario,
      currency_id: 'ARS',
    })),
    external_reference: String(pedidoId),
    payer: comprador?.email ? { email: comprador.email, name: comprador.nombre } : undefined,
    back_urls: {
      success: `${env.PUBLIC_BASE_URL}/pedido/${pedidoId}/estado?resultado=success`,
      pending: `${env.PUBLIC_BASE_URL}/pedido/${pedidoId}/estado?resultado=pending`,
      failure: `${env.PUBLIC_BASE_URL}/pedido/${pedidoId}/estado?resultado=failure`,
    },
    auto_return: 'approved',
    notification_url: `${env.PUBLIC_BASE_URL}/webhooks/mercadopago`,
    statement_descriptor: 'JAQUEMATE',
  };

  const result = await preference.create({ body });
  return { preferenceId: result.id, initPoint: result.init_point };
}

/**
 * Verifica la firma del webhook segun el header x-signature de Mercado Pago.
 * Formato: "ts=<timestamp>,v1=<hash>". Manifiesto: id:{dataId};request-id:{requestId};ts:{ts};
 * Si no hay MP_WEBHOOK_SECRET configurado, no se puede verificar (se loguea y se rechaza en produccion).
 */
function verificarFirmaWebhook({ xSignature, xRequestId, dataId }) {
  if (!env.MP_WEBHOOK_SECRET) {
    return env.NODE_ENV !== 'production';
  }
  if (!xSignature || !dataId) return false;

  const partes = Object.fromEntries(
    xSignature.split(',').map((p) => {
      const [k, v] = p.split('=');
      return [k.trim(), (v || '').trim()];
    })
  );
  const ts = partes.ts;
  const hashRecibido = partes.v1;
  if (!ts || !hashRecibido) return false;

  const manifest = `id:${dataId};request-id:${xRequestId || ''};ts:${ts};`;
  const hashEsperado = crypto
    .createHmac('sha256', env.MP_WEBHOOK_SECRET)
    .update(manifest)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(hashEsperado), Buffer.from(hashRecibido));
}

/**
 * Consulta el estado real de un pago contra la API de Mercado Pago.
 * Nunca confiar en el estado que manda el cliente o el query string de la redireccion.
 */
async function consultarPago(paymentId) {
  const payment = new Payment(getClient());
  return payment.get({ id: paymentId });
}

module.exports = { crearPreference, verificarFirmaWebhook, consultarPago };
