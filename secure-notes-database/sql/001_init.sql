CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  disabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx
ON users (LOWER(username));

-- Dummy login: username "user", password "password"
INSERT INTO users (username, password_hash, role)
VALUES (
  'user',
  '$2b$12$DpFoJjIE27UdOxwIUn0Yfu84MZguT6ZtuRMmMLHHbxnTgczLMACii',
  'user'
);

-- Dummy admin: username "admin", password "password"
INSERT INTO users (username, password_hash, role)
VALUES (
  'admin',
  '$2b$12$x.ysm9arerpx3r6TFmsZxe7/H7vgYushAj6UWG..eYGWqONSG7F86',
  'admin'
);
