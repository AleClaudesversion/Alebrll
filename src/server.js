const path = require('path');
const express = require('express');
const env = require('./config/env');

require('./db/migrate')();

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(require('./routes/webhooks.routes'));
app.use(require('./routes/catalogo.routes'));
app.use(require('./routes/checkout.routes'));
app.use(require('./routes/pedido.routes'));

app.use((req, res) => {
  res.status(404).send('Pagina no encontrada');
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Ocurrio un error inesperado.');
});

app.listen(env.PORT, env.HOST, () => {
  console.log(`Ja Que Mate escuchando en http://${env.HOST}:${env.PORT} (${env.NODE_ENV})`);
});
