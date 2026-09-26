import dotenv from "dotenv";

dotenv.config();

function requiredNumber(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return value;
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be set to a string of at least 32 characters.");
}

function requiredAes256Key(name) {
  const value = process.env[name] ?? "";
  if (!/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(`${name} must be 64 hex characters (32 bytes) for AES-256.`);
  }

  return Buffer.from(value, "hex");
}

export const config = {
  port: requiredNumber("PORT", 3000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/secure_notes",
  bcryptRounds: requiredNumber("BCRYPT_ROUNDS", 12),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  notesEncryptionKey: requiredAes256Key("NOTES_ENCRYPTION_KEY"),
  nodeEnv: process.env.NODE_ENV || "development",
};
