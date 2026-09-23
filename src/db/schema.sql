CREATE TABLE IF NOT EXISTS productos (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  slug                 TEXT UNIQUE NOT NULL,
  nombre               TEXT NOT NULL,
  categoria            TEXT NOT NULL,
  descripcion          TEXT,
  precio_efectivo      INTEGER NOT NULL,
  precio_transferencia INTEGER NOT NULL,
  precio_cuotas        INTEGER NOT NULL,
  stock                INTEGER NOT NULL DEFAULT 0,
  activo               INTEGER NOT NULL DEFAULT 1,
  imagen_url           TEXT,
  orden                INTEGER NOT NULL DEFAULT 0,
  creado_en            TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo, categoria);

CREATE TABLE IF NOT EXISTS pedidos (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  estado                TEXT NOT NULL DEFAULT 'pendiente',
  metodo_pago           TEXT NOT NULL,
  total_cobrado         INTEGER NOT NULL,
  mp_preference_id      TEXT,
  mp_payment_id         TEXT,
  mp_status             TEXT,
  mp_status_detail      TEXT,
  comprador_nombre      TEXT,
  comprador_email       TEXT,
  comprador_telefono    TEXT,
  notas                 TEXT,
  creado_en             TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_mp_payment_id ON pedidos(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_mp_preference_id ON pedidos(mp_preference_id);

CREATE TABLE IF NOT EXISTS pedido_items (
  id                        INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id                 INTEGER NOT NULL REFERENCES pedidos(id),
  producto_id               INTEGER NOT NULL REFERENCES productos(id),
  nombre_snapshot           TEXT NOT NULL,
  precio_unitario_snapshot  INTEGER NOT NULL,
  cantidad                  INTEGER NOT NULL CHECK (cantidad > 0)
);

CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido ON pedido_items(pedido_id);

CREATE TABLE IF NOT EXISTS mp_webhook_eventos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id      INTEGER REFERENCES pedidos(id),
  payload_crudo  TEXT NOT NULL,
  procesado_ok   INTEGER NOT NULL DEFAULT 0,
  recibido_en    TEXT NOT NULL DEFAULT (datetime('now'))
);
