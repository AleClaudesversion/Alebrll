# ¡Ja que mate! — Ecommerce

Catálogo, carrito y checkout con Mercado Pago para el emprendimiento de mates "¡Ja que mate!".

## Desarrollo local

```bash
npm install
cp .env.example .env   # completar MP_ACCESS_TOKEN, PUBLIC_BASE_URL, etc.
npm run migrate
npm run seed
npm run dev
```

Servidor en `http://127.0.0.1:3001`.

## Tests

```bash
npm test
```

## Cargar/actualizar el catálogo

Editar `scripts/seed-productos.json` (por producto: slug, nombre, categoría, precio, stock, imagen) y correr:

```bash
npm run seed
```

Es un upsert por `slug`: actualiza los productos existentes y agrega los nuevos, sin borrar nada.

## Cambiar el % de recargo de Mercado Pago

```bash
node scripts/set-recargo-mp.js 6.5
```

Aplica al instante en todo el sitio, sin reiniciar el servidor.

## Deploy en el VPS (mismo patrón que Mymatecito)

```bash
ssh root@<vps>
cd /var/www/ja-que-mate
git pull
npm install --production
node src/db/migrate.js
pm2 start ecosystem.config.js --env production
pm2 save
```

Configurar un vhost en LiteSpeed que haga proxy a `127.0.0.1:<PORT>`, y en el panel de Mercado Pago (developers.mercadopago.com.ar) apuntar la URL de notificaciones a `https://<dominio>/webhooks/mercadopago`.

Ver `docs/decisiones.md` para el porqué de las decisiones de arquitectura, y `docs/roadmap.md` para lo que queda fuera de esta v1.
