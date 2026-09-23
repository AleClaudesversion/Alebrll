const db = require('../client');

function listarActivos() {
  return db
    .prepare('SELECT * FROM productos WHERE activo = 1 ORDER BY categoria, orden, nombre')
    .all();
}

function porSlug(slug) {
  return db.prepare('SELECT * FROM productos WHERE slug = ? AND activo = 1').get(slug);
}

function porId(id) {
  return db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
}

function porIds(ids) {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  return db.prepare(`SELECT * FROM productos WHERE id IN (${placeholders})`).all(...ids);
}

function upsertPorSlug(producto) {
  const existente = db.prepare('SELECT id FROM productos WHERE slug = ?').get(producto.slug);
  if (existente) {
    db.prepare(
      `UPDATE productos SET
        nombre = @nombre, categoria = @categoria, descripcion = @descripcion,
        precio_efectivo = @precio_efectivo, precio_transferencia = @precio_transferencia,
        precio_cuotas = @precio_cuotas, stock = @stock, activo = @activo,
        imagen_url = @imagen_url, orden = @orden, actualizado_en = datetime('now')
       WHERE slug = @slug`
    ).run(producto);
    return { id: existente.id, creado: false };
  }
  const info = db.prepare(
    `INSERT INTO productos
      (slug, nombre, categoria, descripcion, precio_efectivo, precio_transferencia, precio_cuotas, stock, activo, imagen_url, orden)
     VALUES
      (@slug, @nombre, @categoria, @descripcion, @precio_efectivo, @precio_transferencia, @precio_cuotas, @stock, @activo, @imagen_url, @orden)`
  ).run(producto);
  return { id: info.lastInsertRowid, creado: true };
}

function actualizarStock(id, stock) {
  db.prepare(`UPDATE productos SET stock = ?, actualizado_en = datetime('now') WHERE id = ?`).run(stock, id);
}

module.exports = { listarActivos, porSlug, porId, porIds, upsertPorSlug, actualizarStock };
