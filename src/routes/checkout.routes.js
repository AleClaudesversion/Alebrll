const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const pedidosService = require('../services/pedidos.service');

const router = express.Router();

const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const carritoSchema = z.object({
  items: z
    .array(
      z.object({
        productoId: z.number().int().positive(),
        cantidad: z.number().int().positive().max(50),
      })
    )
    .min(1),
  comprador: z
    .object({
      nombre: z.string().trim().min(1).max(120).optional(),
      email: z.string().trim().email().optional(),
      telefono: z.string().trim().max(40).optional(),
    })
    .optional(),
  notas: z.string().trim().max(500).optional(),
});

router.post('/api/checkout', checkoutLimiter, async (req, res) => {
  const parsed = carritoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos de carrito invalidos', detalle: parsed.error.flatten() });
  }

  try {
    const { pedidoId, initPoint } = await pedidosService.iniciarCheckoutMercadoPago({
      itemsSolicitados: parsed.data.items,
      comprador: parsed.data.comprador,
      notas: parsed.data.notas,
    });
    res.json({ pedidoId, initPoint });
  } catch (err) {
    if (err instanceof pedidosService.CarritoInvalidoError) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Error creando checkout de Mercado Pago:', err);
    res.status(502).json({ error: 'No se pudo iniciar el pago con Mercado Pago. Intenta de nuevo en unos minutos.' });
  }
});

router.post('/api/checkout/transferencia', checkoutLimiter, (req, res) => {
  const parsed = carritoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos de carrito invalidos', detalle: parsed.error.flatten() });
  }

  try {
    const { pedidoId } = pedidosService.crearPedidoTransferencia({
      itemsSolicitados: parsed.data.items,
      comprador: parsed.data.comprador,
      notas: parsed.data.notas,
    });
    res.json({ pedidoId });
  } catch (err) {
    if (err instanceof pedidosService.CarritoInvalidoError) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Error creando pedido por transferencia:', err);
    res.status(500).json({ error: 'No se pudo registrar el pedido. Intenta de nuevo.' });
  }
});

module.exports = router;
