const fs = require('fs');
const path = require('path');
const migrate = require('../src/db/migrate');
const productosRepo = require('../src/db/repositories/productos.repo');

migrate();

const rutaJson = path.join(__dirname, 'seed-productos.json');
const productos = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

let creados = 0;
let actualizados = 0;

for (const producto of productos) {
  const { creado } = productosRepo.upsertPorSlug(producto);
  if (creado) creados++;
  else actualizados++;
}

console.log(`Seed OK: ${creados} productos nuevos, ${actualizados} actualizados (total ${productos.length}).`);
