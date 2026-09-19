CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx
ON users (LOWER(username));

-- Dummy login: username "user", password "password"
INSERT INTO users (username, password_hash)
VALUES (
  'user',
  '$2b$12$DpFoJjIE27UdOxwIUn0Yfu84MZguT6ZtuRMmMLHHbxnTgczLMACii'
);
