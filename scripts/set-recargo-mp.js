const configRepo = require('../src/db/repositories/config.repo');

const nuevoPct = Number(process.argv[2]);

if (!Number.isFinite(nuevoPct) || nuevoPct < 0 || nuevoPct >= 100) {
  console.error('Uso: node scripts/set-recargo-mp.js <porcentaje>');
  console.error('Ejemplo: node scripts/set-recargo-mp.js 6.5');
  process.exit(1);
}

configRepo.fijar('recargo_mp_pct', nuevoPct);
console.log(`Recargo de Mercado Pago actualizado a ${nuevoPct}%. Aplica al instante, sin redeploy.`);
