const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();


const userData =
  process.env.APP_USER_DATA ||
  path.join(process.cwd(), 'user-data');

// Ensure base user data directory exists
if (!fs.existsSync(userData)) {
  fs.mkdirSync(userData, { recursive: true });
}

// Database path (NEVER inside app resources)
const dbPath = path.join(userData, 'pos.sqlite3');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Database connected at:', dbPath);
  }
});

/* ================== TABLE SETUP ================== */
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'cashier',
    is_verified INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    reset_token TEXT,
    reset_expiration INTEGER
  )`);
});

module.exports = { db, dbPath, userData };
