const express = require('express');
const productosRepo = require('../db/repositories/productos.repo');
const pricingService = require('../services/pricing.service');
const env = require('../config/env');

const router = express.Router();

function productosConPrecios() {
  return productosRepo.listarActivos().map((p) => ({
    ...p,
    precios: pricingService.preciosDe(p),
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
  res.render('producto', {
    producto: { ...producto, precios: pricingService.preciosDe(producto) },
    whatsappNumber: env.WHATSAPP_NUMBER,
  });
});

module.exports = router;
