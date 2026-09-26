import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { config } from "../config.js";

const ENVELOPE_PREFIX = "enc:v1:";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export function encryptText(plaintext, userId) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", config.notesEncryptionKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  cipher.setAAD(aadForUser(userId));

  const ciphertext = Buffer.concat([
    cipher.update(String(plaintext ?? ""), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    ENVELOPE_PREFIX,
    iv.toString("base64url"),
    ".",
    tag.toString("base64url"),
    ".",
    ciphertext.toString("base64url"),
  ].join("");
}

export function decryptText(value, userId) {
  if (!isEncryptedEnvelope(value)) {
    return value ?? "";
  }

  const payload = value.slice(ENVELOPE_PREFIX.length);
  const [ivPart, tagPart, dataPart] = payload.split(".");
  if (!ivPart || !tagPart || !dataPart) {
    throw new Error("Invalid encrypted note envelope.");
  }

  const iv = Buffer.from(ivPart, "base64url");
  const tag = Buffer.from(tagPart, "base64url");
  const ciphertext = Buffer.from(dataPart, "base64url");

  if (iv.length !== IV_LENGTH || tag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Invalid encrypted note envelope.");
  }

  const decipher = createDecipheriv("aes-256-gcm", config.notesEncryptionKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAAD(aadForUser(userId));
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function isEncryptedEnvelope(value) {
  return typeof value === "string" && value.startsWith(ENVELOPE_PREFIX);
}

export function toPublicNote(row) {
  return {
    id: row.id,
    title: decryptText(row.title, row.user_id),
    content: decryptText(row.content, row.user_id),
    created_at: row.created_at,
  };
}

function aadForUser(userId) {
  return Buffer.from(`note:${userId}`, "utf8");
}
