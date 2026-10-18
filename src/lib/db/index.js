// ============================================================================
// NOBO FASHION — Database Engine (sql.js WebAssembly / SQLite)
// ============================================================================
const fs = require('fs');
const path = require('path');
const { SCHEMA } = require('./schema');

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'priyo.sqlite');
const IMAGES_DIR = path.join(DB_DIR, 'images');

let dbInstance = null;
let SQL = null;
let saveTimeout = null;

// Ensure database and images directories exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Copy default public assets to data/images if missing
try {
  const publicLogo = path.join(process.cwd(), 'public', 'logo.jpg');
  const targetLogo = path.join(IMAGES_DIR, 'logo.jpg');
  if (fs.existsSync(publicLogo) && !fs.existsSync(targetLogo)) {
    fs.copyFileSync(publicLogo, targetLogo);
  }
} catch (e) {
  // Silent ignore
}


function persistDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('[DB Error] Failed to persist database:', err);
  }
}

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    persistDb();
  }, 100);
}

function saveImmediately() {
  persistDb();
}

// Robust loader for sql.js in Node / Next.js
async function initDatabase() {
  if (dbInstance) return dbInstance;

  try {
    if (!SQL) {
      // Use standard require
      const initSqlJs = require('sql.js');
      SQL = await initSqlJs();
    }

    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } else {
      dbInstance = new SQL.Database();
      dbInstance.run(SCHEMA);
      persistDb();
    }

    return dbInstance;
  } catch (err) {
    console.error('Database init error:', err);
    throw err;
  }
}

function getDb() {
  if (!dbInstance) {
    // If accessed synchronously before async init, try to sync init if SQL loaded
    if (SQL && fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
      return dbInstance;
    }
    throw new Error('Database not initialized! Await initDatabase() first.');
  }
  return dbInstance;
}

function sanitizeParams(params) {
  if (!params) return [];
  const list = Array.isArray(params) ? params : [params];
  return list.map((p) => {
    if (p === undefined) return null;
    if (typeof p === 'boolean') return p ? 1 : 0;
    return p;
  });
}

function all(sql, params = []) {
  const db = getDb();
  const cleanParams = sanitizeParams(params);
  const stmt = db.prepare(sql);
  if (cleanParams.length > 0) {
    stmt.bind(cleanParams);
  }
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  const rows = all(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function run(sql, params = []) {
  const db = getDb();
  const cleanParams = sanitizeParams(params);
  if (cleanParams.length > 0) {
    const stmt = db.prepare(sql);
    stmt.bind(cleanParams);
    stmt.step();
    stmt.free();
  } else {
    db.run(sql);
  }
  scheduleSave();
  return { changes: db.getRowsModified() };
}

function insert(sql, params = []) {
  run(sql, params);
  const res = get('SELECT last_insert_rowid() AS id');
  return res ? res.id : null;
}

function exec(sql) {
  const db = getDb();
  db.run(sql);
  scheduleSave();
}

module.exports = {
  initDatabase,
  getDb,
  all,
  get,
  run,
  insert,
  exec,
  saveImmediately,
  persistDb,
};
