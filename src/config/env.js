require('dotenv').config();

const REQUIRED_IN_PRODUCTION = ['MP_ACCESS_TOKEN', 'PUBLIC_BASE_URL'];

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 3001),
  HOST: process.env.HOST || '127.0.0.1',
  DB_PATH: process.env.DB_PATH || './data/mates.db',
  MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN || '',
  MP_WEBHOOK_SECRET: process.env.MP_WEBHOOK_SECRET || '',
  PUBLIC_BASE_URL: (process.env.PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, ''),
  RECARGO_MP_DEFAULT_PCT: Number(process.env.RECARGO_MP_DEFAULT_PCT || 6),
  WHATSAPP_NUMBER: process.env.WHATSAPP_NUMBER || '',
};

if (env.NODE_ENV === 'production') {
  const faltantes = REQUIRED_IN_PRODUCTION.filter((key) => !env[key]);
  if (faltantes.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias en produccion: ${faltantes.join(', ')}. ` +
      'Revisa .env contra .env.example antes de arrancar el servidor.'
    );
  }
}

module.exports = env;
