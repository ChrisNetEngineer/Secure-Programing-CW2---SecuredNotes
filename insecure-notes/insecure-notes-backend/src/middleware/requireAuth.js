import { readAccessToken, verifyAccessToken } from "../lib/tokens.js";

export async function requireAuth(request, response, next) {
  try {
    const token = readAccessToken(request);
    if (!token) {
      return response.status(401).json({ error: "Authentication required." });
    }

    const payload = verifyAccessToken(token);

    request.user = {
      id: Number(payload.sub),
      username: payload.username,
      role: payload.role,
    };

    return next();
  } catch {
    return response.status(401).json({ error: "Authentication required." });
  }
}
