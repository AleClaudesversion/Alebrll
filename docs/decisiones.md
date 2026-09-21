# Decisiones de arquitectura

## Por qué SQLite y no Postgres/Supabase

- Volumen esperado bajo: ~43 productos, pedidos artesanales (decenas por semana, no miles por día).
- Cero servicios externos nuevos que mantener ni credenciales adicionales.
- Backup trivial: `sqlite3 data/mates.db ".backup backups/mates-$(date +%F).db"`.
- Un proyecto Supabase gratuito puede pausarse por inactividad; SQLite en el propio VPS no tiene ese riesgo.
- El acceso a datos está aislado en `src/db/repositories/`, así que si el negocio crece se puede migrar a Postgres reescribiendo solo esa capa y `src/db/client.js`.

**Criterio de migración a Postgres**: más de ~500 pedidos/mes, necesidad de reportes concurrentes pesados, o necesidad de acceso desde más de un servidor.

## Por qué Checkout Pro y no un link de pago genérico

Un link de pago único no permite saber qué producto se pagó ni verificar el monto contra un pedido concreto. Checkout Pro permite:

1. Crear una `preference` server-side con el carrito real (con `external_reference` = id de pedido).
2. Confirmar el pago exclusivamente vía webhook + consulta a la API de pagos de Mercado Pago (nunca confiar en el estado que vuelve por query string ni en nada que diga el cliente).
3. Dejar un `payment_id` de Mercado Pago como comprobante verificable, asociado al pedido y sus items exactos.

## Convención de precios

Los precios se guardan como enteros en pesos argentinos (sin centavos), redondeados al centenar más cercano. El recargo de Mercado Pago vive en la tabla `configuracion` (clave `recargo_mp_pct`), nunca hardcodeado, para poder ajustarlo con `scripts/set-recargo-mp.js` sin redeploy.
