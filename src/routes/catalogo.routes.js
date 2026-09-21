const express = require('express');
const productosRepo = require('../db/repositories/productos.repo');
const pricingService = require('../services/pricing.service');
const configRepo = require('../db/repositories/config.repo');
const env = require('../config/env');

const router = express.Router();

function productosConPrecios() {
  const recargoPct = configRepo.obtenerRecargoMpPct();
  return productosRepo.listarActivos().map((p) => ({
    ...p,
    precios: pricingService.calcularPrecios(p.precio_lista, recargoPct),
  }));
}

router.get('/', (req, res) => {
  const productos = productosConPrecios();
  const categorias = [...new Set(productos.map((p) => p.categoria))];
  res.render('home', {
    productos,
    categorias,
    whatsappNumber: env.WHATSAPP_NUMBER,
  });
});

router.get('/producto/:slug', (req, res) => {
  const producto = productosRepo.porSlug(req.params.slug);
  if (!producto) return res.status(404).render('producto', { producto: null });
  const recargoPct = configRepo.obtenerRecargoMpPct();
  res.render('producto', {
    producto: { ...producto, precios: pricingService.calcularPrecios(producto.precio_lista, recargoPct) },
    whatsappNumber: env.WHATSAPP_NUMBER,
  });
});

router.get('/api/config', (req, res) => {
  res.json({ recargoMpPct: configRepo.obtenerRecargoMpPct() });
});

module.exports = router;
