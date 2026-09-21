# Fuera de alcance en v1 (mejoras futuras)

- Panel de admin para el dueño del negocio (ver pedidos, marcar entregado, editar stock/precios el mismo).
- Descuento automático de stock al confirmarse el pago (hoy el stock se administra a mano en la tabla `productos`).
- Notificación automática (mail o WhatsApp Business API) al confirmarse un pago.
- Links de pago individuales como fallback temporal si el Access Token de Mercado Pago tarda en estar listo.
- Migración a Postgres si el volumen de pedidos crece (ver criterio en `decisiones.md`).
- Cupones/descuentos, cálculo de envío por zona, integración con Correo Argentino/Andreani.
