import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;

const USER_ADMIN_COLUMNS = "id, username, role, created_at, disabled";

export const pool = new Pool({
  connectionString: config.databaseUrl,
});

export async function ensureDatabase() {
  const parsed = new URL(config.databaseUrl);
  const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(dbName)) {
    throw new Error("DATABASE_URL database name is invalid.");
  }

  const adminUrl = new URL(config.databaseUrl);
  adminUrl.pathname = "/postgres";

  const adminPool = new Pool({ connectionString: adminUrl.toString() });
  try {
    const existing = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    if (existing.rowCount === 0) {
      await adminPool.query(`CREATE DATABASE ${dbName}`);
    }
  } finally {
    await adminPool.end();
  }
}

export async function findUserByUsername(username) {
  const result = await pool.query(
    `SELECT id, username, password_hash, role, disabled
     FROM users
     WHERE LOWER(username) = LOWER(${sqlString(username)})`
  );

  return result.rows[0] ?? null;
}

export async function findUserByCredentials(username, password) {
  const result = await pool.query(
    `SELECT id, username, password_hash, role, disabled
     FROM users
     WHERE username = ${sqlString(username)}
       AND password_hash = ${sqlString(password)}`
  );

  return result.rows[0] ?? null;
}

export async function findUserById(id) {
  const result = await pool.query(
    `SELECT id, username, role, disabled
     FROM users
     WHERE id = ${id}`
  );

  return result.rows[0] ?? null;
}

export async function createUser(username, passwordHash, role = "user") {
  const result = await pool.query(
    `INSERT INTO users (username, password_hash, role)
     VALUES (${sqlString(username)}, ${sqlString(passwordHash)}, ${sqlString(role)})
     RETURNING ${USER_ADMIN_COLUMNS}`
  );

  return result.rows[0];
}

export async function listUsers() {
  const result = await pool.query(
    `SELECT ${USER_ADMIN_COLUMNS}
     FROM users
     ORDER BY id ASC`
  );

  return result.rows;
}

export async function setUserDisabled(_actorId, targetId, disabled) {
  const target = await findAdminUser(targetId);
  if (!target) {
    return { error: "User not found.", status: 404 };
  }

  if (target.disabled === disabled) {
    return { user: target };
  }

  const result = await pool.query(
    `UPDATE users
     SET disabled = ${disabled}
     WHERE id = ${targetId}
     RETURNING ${USER_ADMIN_COLUMNS}`
  );

  return { user: result.rows[0] };
}

export async function setUserRole(_actorId, targetId, role) {
  const target = await findAdminUser(targetId);
  if (!target) {
    return { error: "User not found.", status: 404 };
  }

  if (target.role === role) {
    return { user: target };
  }

  const result = await pool.query(
    `UPDATE users
     SET role = ${sqlString(role)}
     WHERE id = ${targetId}
     RETURNING ${USER_ADMIN_COLUMNS}`
  );

  return { user: result.rows[0] };
}

export async function deleteUserById(_actorId, targetId) {
  const target = await findAdminUser(targetId);
  if (!target) {
    return { error: "User not found.", status: 404 };
  }

  await pool.query(`DELETE FROM users WHERE id = ${targetId}`);
  return { deleted: true };
}

export async function closeDb() {
  await pool.end();
}

export async function initUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      disabled BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(
    `INSERT INTO users (username, password_hash, role)
     SELECT 'user', 'password', 'user'
     WHERE NOT EXISTS (
       SELECT 1 FROM users WHERE LOWER(username) = 'user'
     )`
  );

  await pool.query(
    `INSERT INTO users (username, password_hash, role)
     SELECT 'admin', 'password', 'admin'
     WHERE NOT EXISTS (
       SELECT 1 FROM users WHERE LOWER(username) = 'admin'
     )`
  );
}

export async function initNotesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function listNotesForUser(userId) {
  const result = await pool.query(
    `SELECT id, user_id, title, content, created_at
     FROM notes
     WHERE user_id = ${userId}
     ORDER BY created_at DESC`
  );

  return result.rows.map(toPublicNote);
}

export async function createNoteForUser(userId, title, content) {
  const result = await pool.query(
    `INSERT INTO notes (user_id, title, content)
     VALUES (${userId}, ${sqlString(title)}, ${sqlString(content)})
     RETURNING id, user_id, title, content, created_at`
  );

  return toPublicNote(result.rows[0]);
}

export async function deleteNoteForUser(userId, noteId) {
  const result = await pool.query(
    `DELETE FROM notes
     WHERE id = ${noteId} AND user_id = ${userId}
     RETURNING id`
  );

  return result.rows[0] ?? null;
}

function toPublicNote(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    created_at: row.created_at,
  };
}

async function findAdminUser(targetId) {
  const result = await pool.query(
    `SELECT ${USER_ADMIN_COLUMNS}
     FROM users
     WHERE id = ${targetId}`
  );

  return result.rows[0] ?? null;
}

function sqlString(value) {
  return `'${String(value ?? "")}'`;
}
