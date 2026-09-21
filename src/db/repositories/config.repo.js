const db = require('../client');

function obtener(clave, valorPorDefecto = null) {
  const fila = db.prepare('SELECT valor FROM configuracion WHERE clave = ?').get(clave);
  return fila ? fila.valor : valorPorDefecto;
}

function fijar(clave, valor) {
  db.prepare(
    `INSERT INTO configuracion (clave, valor, actualizado_en) VALUES (?, ?, datetime('now'))
     ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, actualizado_en = datetime('now')`
  ).run(clave, String(valor));
}

function obtenerRecargoMpPct() {
  return Number(obtener('recargo_mp_pct', '6'));
}

module.exports = { obtener, fijar, obtenerRecargoMpPct };
