const db = require('../client');

function crear({ metodoPago, totalCobrado, comprador, notas, items }) {
  const tx = db.transaction(() => {
    const info = db.prepare(
      `INSERT INTO pedidos
        (estado, metodo_pago, total_cobrado,
         comprador_nombre, comprador_email, comprador_telefono, notas)
       VALUES ('pendiente', @metodoPago, @totalCobrado,
               @nombre, @email, @telefono, @notas)`
    ).run({
      metodoPago,
      totalCobrado,
      nombre: comprador?.nombre || null,
      email: comprador?.email || null,
      telefono: comprador?.telefono || null,
      notas: notas || null,
    });

    const pedidoId = info.lastInsertRowid;
    const insertItem = db.prepare(
      `INSERT INTO pedido_items (pedido_id, producto_id, nombre_snapshot, precio_unitario_snapshot, cantidad)
       VALUES (?, ?, ?, ?, ?)`
    );
    for (const item of items) {
      insertItem.run(pedidoId, item.productoId, item.nombre, item.precioUnitario, item.cantidad);
    }
    return pedidoId;
  });

  return tx();
}

function porId(id) {
  return db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);
}

function itemsDe(pedidoId) {
  return db.prepare('SELECT * FROM pedido_items WHERE pedido_id = ?').all(pedidoId);
}

function guardarPreference(pedidoId, preferenceId) {
  db.prepare(`UPDATE pedidos SET mp_preference_id = ?, actualizado_en = datetime('now') WHERE id = ?`)
    .run(preferenceId, pedidoId);
}

function porPreferenceId(preferenceId) {
  return db.prepare('SELECT * FROM pedidos WHERE mp_preference_id = ?').get(preferenceId);
}

function marcarPago({ pedidoId, paymentId, status, statusDetail }) {
  const nuevoEstado = status === 'approved' ? 'pagado' : status === 'rejected' ? 'rechazado' : 'pendiente';
  db.prepare(
    `UPDATE pedidos SET
      estado = ?, mp_payment_id = ?, mp_status = ?, mp_status_detail = ?, actualizado_en = datetime('now')
     WHERE id = ?`
  ).run(nuevoEstado, paymentId, status, statusDetail || null, pedidoId);
  return nuevoEstado;
}

function registrarWebhook({ pedidoId, payloadCrudo, procesadoOk }) {
  db.prepare(
    `INSERT INTO mp_webhook_eventos (pedido_id, payload_crudo, procesado_ok) VALUES (?, ?, ?)`
  ).run(pedidoId || null, payloadCrudo, procesadoOk ? 1 : 0);
}

module.exports = {
  crear,
  porId,
  itemsDe,
  guardarPreference,
  porPreferenceId,
  marcarPago,
  registrarWebhook,
};
