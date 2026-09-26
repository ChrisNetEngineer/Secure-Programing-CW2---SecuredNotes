import { findUserById } from "../db.js";
import { readAccessToken, verifyAccessToken } from "../lib/tokens.js";

export async function requireAuth(request, response, next) {
  try {
    const token = readAccessToken(request);
    if (!token) {
      return response.status(401).json({ error: "Authentication required." });
    }

    const payload = verifyAccessToken(token);
    const user = await findUserById(payload.sub);

    if (!user || user.disabled) {
      return response.status(401).json({ error: "Authentication required." });
    }

    request.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    return next();
  } catch {
    return response.status(401).json({ error: "Authentication required." });
  }
}
