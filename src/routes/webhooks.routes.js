const express = require('express');
const mercadopagoService = require('../services/mercadopago.service');
const pedidosService = require('../services/pedidos.service');
const pedidosRepo = require('../db/repositories/pedidos.repo');

const router = express.Router();

// Mercado Pago espera un 200 rapido; el procesamiento pesado (si lo hubiera) deberia
// desacoplarse, pero para este volumen procesar inline es suficiente.
router.post('/webhooks/mercadopago', async (req, res) => {
  const { type, data } = req.body || {};
  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];
  const dataId = data?.id || req.query['data.id'];

  const firmaValida = mercadopagoService.verificarFirmaWebhook({
    xSignature,
    xRequestId,
    dataId,
  });

  if (!firmaValida) {
    pedidosRepo.registrarWebhook({
      pedidoId: null,
      payloadCrudo: JSON.stringify({ error: 'firma invalida', body: req.body }),
      procesadoOk: false,
    });
    return res.status(401).send('firma invalida');
  }

  // Responder rapido; MP reintenta si no recibe 200, asi que solo fallamos con 5xx
  // ante errores reales que ameriten reintento.
  res.sendStatus(200);

  if (type !== 'payment' || !dataId) return;

  try {
    await pedidosService.procesarWebhookPago(dataId);
  } catch (err) {
    console.error('Error procesando webhook de Mercado Pago:', err);
  }
});

module.exports = router;
