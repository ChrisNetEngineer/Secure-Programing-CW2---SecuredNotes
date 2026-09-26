import jwt from "jsonwebtoken";
import { config } from "../config.js";

const COOKIE_NAME = "sn_token";

export function createAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      username: user.username,
      role: user.role,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
    }
  );
}

export function readAccessToken(request) {
  const cookieToken = request.cookies?.[COOKIE_NAME];
  if (cookieToken) {
    return cookieToken;
  }

  const header = request.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim();
  }

  return "";
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export function setAuthCookie(response, token) {
  response.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 1000,
  });
}

export function clearAuthCookie(response) {
  response.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
  });
}
