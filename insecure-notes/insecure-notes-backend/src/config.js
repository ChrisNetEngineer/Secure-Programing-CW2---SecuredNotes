import dotenv from "dotenv";

dotenv.config();

function optionalNumber(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return value;
}

export const config = {
  port: optionalNumber("PORT", 3001),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5174",
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/insecure_notes",
  jwtSecret: process.env.JWT_SECRET || "secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "30d",
  nodeEnv: process.env.NODE_ENV || "development",
};
