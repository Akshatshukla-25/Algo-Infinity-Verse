// backend/services/sqlSimulatorService.js
import Database from 'better-sqlite3';

let db;

/**
 * Initializes a fresh in-memory SQLite database with the seed schema and
 * sample rows.
 *
 * @returns {import('better-sqlite3').Database} the active `Database` handle
 * @throws {Error} if the database cannot be opened or the seed SQL fails
 */
export function initDB() {
  // If a previous db handle exists, close it cleanly so we never leak open
  // file descriptors or leave statement caches around between resets.
  if (db) {
    try {
      db.close();
    } catch (closeErr) {
      // We swallow close errors because the underlying file/sqlite handle may
      // already be in a torn-down state — at this point we're about to
      // reinitialise anyway, so any close error is informational only.
      void closeErr;
    }
  }

  db = new Database(':memory:');
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      salary INTEGER NOT NULL
    );
    INSERT INTO employees (name, department, salary) VALUES ('Alice', 'Engineering', 90000);
    INSERT INTO employees (name, department, salary) VALUES ('Bob', 'HR', 60000);
    INSERT INTO employees (name, department, salary) VALUES ('Charlie', 'Engineering', 95000);
    INSERT INTO employees (name, department, salary) VALUES ('Diana', 'Marketing', 70000);
  `);

  return db;
}

export function getDb() {
  return db;
}
