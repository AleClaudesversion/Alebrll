const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const env = require('../config/env');

const dbPath = path.resolve(process.cwd(), env.DB_PATH);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
