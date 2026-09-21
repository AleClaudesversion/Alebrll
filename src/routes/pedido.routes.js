const express = require('express');
const pedidosRepo = require('../db/repositories/pedidos.repo');

const router = express.Router();

router.get('/pedido/:id/estado', (req, res) => {
  const pedido = pedidosRepo.porId(Number(req.params.id));
  if (!pedido) return res.status(404).render('pedido-estado', { pedido: null, items: [] });
  const items = pedidosRepo.itemsDe(pedido.id);
  res.render('pedido-estado', { pedido, items });
});

router.get('/api/pedido/:id/estado', (req, res) => {
  const pedido = pedidosRepo.porId(Number(req.params.id));
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
  // El estado real siempre viene de la base (actualizado por el webhook), nunca del query string de MP.
  res.json({ id: pedido.id, estado: pedido.estado, totalCobrado: pedido.total_cobrado });
});

module.exports = router;
