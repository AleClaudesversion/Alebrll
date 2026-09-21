const fs = require('fs');
const path = require('path');
const db = require('./client');
const env = require('../config/env');

function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);

  const seedConfig = db.prepare(
    `INSERT INTO configuracion (clave, valor) VALUES ('recargo_mp_pct', ?)
     ON CONFLICT(clave) DO NOTHING`
  );
  seedConfig.run(String(env.RECARGO_MP_DEFAULT_PCT));

  console.log(`Migracion OK. Base de datos en: ${path.resolve(process.cwd(), env.DB_PATH)}`);
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;
