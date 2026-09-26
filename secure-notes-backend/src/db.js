import pg from "pg";
import { config } from "./config.js";
import {
  encryptText,
  isEncryptedEnvelope,
  toPublicNote,
} from "./lib/notesCrypto.js";

const { Pool } = pg;

const ADMIN_SEED_HASH =
  "$2b$12$x.ysm9arerpx3r6TFmsZxe7/H7vgYushAj6UWG..eYGWqONSG7F86";

const USER_ADMIN_COLUMNS = "id, username, role, created_at, disabled";

export const pool = new Pool({
  connectionString: config.databaseUrl,
});

export async function findUserByUsername(username) {
  const result = await pool.query(
    `SELECT id, username, password_hash, role, disabled
     FROM users
     WHERE LOWER(username) = LOWER($1)`,
    [username]
  );

  return result.rows[0] ?? null;
}

export async function findUserById(id) {
  const result = await pool.query(
    `SELECT id, username, role, disabled
     FROM users
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function createUser(username, passwordHash, role = "user") {
  const result = await pool.query(
    `INSERT INTO users (username, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING ${USER_ADMIN_COLUMNS}`,
    [username, passwordHash, role]
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

export async function setUserDisabled(actorId, targetId, disabled) {
  return withUserLock(targetId, async (client, target) => {
    if (target.id === actorId) {
      return {
        error: "You cannot change your own account status.",
        status: 403,
      };
    }

    if (disabled && isEnabledAdmin(target) && (await countEnabledAdmins(client)) <= 1) {
      return {
        error: "Cannot disable the last enabled admin.",
        status: 409,
      };
    }

    if (target.disabled === disabled) {
      return { user: target };
    }

    const result = await client.query(
      `UPDATE users
       SET disabled = $1
       WHERE id = $2
       RETURNING ${USER_ADMIN_COLUMNS}`,
      [disabled, targetId]
    );

    return { user: result.rows[0] };
  });
}

export async function lockAccountById(userId) {
  return withUserLock(userId, async (client, target) => {
    if (target.disabled) {
      return { locked: false };
    }

    if (isEnabledAdmin(target) && (await countEnabledAdmins(client)) <= 1) {
      return { locked: false };
    }

    await client.query(
      `UPDATE users
       SET disabled = TRUE
       WHERE id = $1`,
      [userId]
    );

    return { locked: true };
  });
}

export async function setUserRole(actorId, targetId, role) {
  return withUserLock(targetId, async (client, target) => {
    if (target.id === actorId) {
      return {
        error: "You cannot change your own role.",
        status: 403,
      };
    }

    if (target.role === role) {
      return { user: target };
    }

    if (
      role !== "admin" &&
      isEnabledAdmin(target) &&
      (await countEnabledAdmins(client)) <= 1
    ) {
      return {
        error: "Cannot remove the last enabled admin.",
        status: 409,
      };
    }

    const result = await client.query(
      `UPDATE users
       SET role = $1
       WHERE id = $2
       RETURNING ${USER_ADMIN_COLUMNS}`,
      [role, targetId]
    );

    return { user: result.rows[0] };
  });
}

export async function deleteUserById(actorId, targetId) {
  return withUserLock(targetId, async (client, target) => {
    if (target.id === actorId) {
      return {
        error: "You cannot delete your own account.",
        status: 403,
      };
    }

    if (isEnabledAdmin(target) && (await countEnabledAdmins(client)) <= 1) {
      return {
        error: "Cannot delete the last enabled admin.",
        status: 409,
      };
    }

    await client.query(`DELETE FROM users WHERE id = $1`, [targetId]);
    return { deleted: true };
  });
}

export async function closeDb() {
  await pool.end();
}

export async function initRbac() {
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user',
      ADD COLUMN IF NOT EXISTS disabled BOOLEAN NOT NULL DEFAULT FALSE
  `);

  await pool.query(`
    DO $$
    BEGIN
      ALTER TABLE users
        ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END
    $$;
  `);

  await pool.query(
    `INSERT INTO users (username, password_hash, role)
     SELECT 'admin', $1, 'admin'
     WHERE NOT EXISTS (
       SELECT 1 FROM users WHERE LOWER(username) = 'admin'
     )`,
    [ADMIN_SEED_HASH]
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

  await pool.query(`
    CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes (user_id)
  `);
}

export async function initAuditTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      actor_id INTEGER,
      actor_username TEXT,
      actor_role TEXT,
      action TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      status INTEGER NOT NULL,
      details JSONB NOT NULL DEFAULT '{}'::jsonb
    )
  `);

  await pool.query(`ALTER TABLE audit_logs DROP COLUMN IF EXISTS ip`);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx
    ON audit_logs (created_at DESC, id DESC)
  `);
}

export async function insertAuditLog(entry) {
  await pool.query(
    `INSERT INTO audit_logs (
       actor_id, actor_username, actor_role, action, method, path, status, details
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
    [
      entry.actorId,
      entry.actorUsername,
      entry.actorRole,
      entry.action,
      entry.method,
      entry.path,
      entry.status,
      JSON.stringify(entry.details || {}),
    ]
  );
}

export async function listAuditLogs(limit, offset) {
  const result = await pool.query(
    `SELECT id, created_at, actor_id, actor_username, actor_role, action, method, path, status, details
     FROM audit_logs
     ORDER BY created_at DESC, id DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return result.rows;
}

export async function listAllAuditLogs() {
  const result = await pool.query(
    `SELECT id, created_at, actor_id, actor_username, actor_role, action, method, path, status, details
     FROM audit_logs
     ORDER BY created_at DESC, id DESC`
  );

  return result.rows;
}

export async function countAuditLogs() {
  const result = await pool.query(`SELECT COUNT(*)::int AS count FROM audit_logs`);
  return result.rows[0].count;
}

export async function encryptExistingNotes() {
  const result = await pool.query(
    `SELECT id, user_id, title, content
     FROM notes`
  );

  for (const row of result.rows) {
    const titleNeedsEncryption = !isEncryptedEnvelope(row.title);
    const contentNeedsEncryption = !isEncryptedEnvelope(row.content);

    if (!titleNeedsEncryption && !contentNeedsEncryption) {
      continue;
    }

    await pool.query(
      `UPDATE notes
       SET title = $1, content = $2
       WHERE id = $3 AND user_id = $4`,
      [
        titleNeedsEncryption ? encryptText(row.title, row.user_id) : row.title,
        contentNeedsEncryption ? encryptText(row.content, row.user_id) : row.content,
        row.id,
        row.user_id,
      ]
    );
  }
}

export async function listNotesForUser(userId) {
  const result = await pool.query(
    `SELECT id, user_id, title, content, created_at
     FROM notes
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows.map((row) => toPublicNote(row));
}

export async function createNoteForUser(userId, title, content) {
  const result = await pool.query(
    `INSERT INTO notes (user_id, title, content)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, title, content, created_at`,
    [userId, encryptText(title, userId), encryptText(content, userId)]
  );

  return toPublicNote(result.rows[0]);
}

export async function deleteNoteForUser(userId, noteId) {
  const result = await pool.query(
    `DELETE FROM notes
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [noteId, userId]
  );

  return result.rows[0] ?? null;
}

function isEnabledAdmin(user) {
  return user.role === "admin" && user.disabled === false;
}

async function countEnabledAdmins(client) {
  const result = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM users
     WHERE role = 'admin' AND disabled = FALSE`
  );

  return result.rows[0].count;
}

async function withUserLock(targetId, work) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `SELECT id
       FROM users
       WHERE role = 'admin' AND disabled = FALSE
       ORDER BY id
       FOR UPDATE`
    );

    const targetResult = await client.query(
      `SELECT ${USER_ADMIN_COLUMNS}
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [targetId]
    );
    const target = targetResult.rows[0];

    if (!target) {
      await client.query("ROLLBACK");
      return { error: "User not found.", status: 404 };
    }

    const result = await work(client, target);
    if (result?.error) {
      await client.query("ROLLBACK");
      return result;
    }

    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
