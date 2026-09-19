import dotenv from "dotenv";

dotenv.config();

function requiredNumber(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return value;
}

export const config = {
  port: requiredNumber("PORT", 3000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/secure_notes",
  bcryptRounds: requiredNumber("BCRYPT_ROUNDS", 12),
};
