import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
});

export async function findUserByUsername(username) {
  const result = await pool.query(
    `SELECT id, username, password_hash
     FROM users
     WHERE LOWER(username) = LOWER($1)`,
    [username]
  );

  return result.rows[0] ?? null;
}

export async function createUser(username, passwordHash) {
  const result = await pool.query(
    `INSERT INTO users (username, password_hash)
     VALUES ($1, $2)
     RETURNING id, username`,
    [username, passwordHash]
  );

  return result.rows[0];
}

export async function closeDb() {
  await pool.end();
}
