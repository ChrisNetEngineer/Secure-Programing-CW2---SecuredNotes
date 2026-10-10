import { Router } from "express";
import { findUserByUsername, findUserByCredentials, findUserById, createUser } from "../db.js";
import { hashPassword } from "../lib/passwords.js";
import {
  clearAuthCookie,
  createAccessToken,
  readAccessToken,
  setAuthCookie,
  verifyAccessToken,
} from "../lib/tokens.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateLoginBody, validateSignupBody } from "../lib/validation.js";

export const authRouter = Router();

authRouter.post("/signup", async (request, response, next) => {
  try {
    const parsed = validateSignupBody(request.body);
    if (parsed.error) {
      return response.status(400).json({ error: parsed.error });
    }

    if (await findUserByUsername(parsed.username)) {
      return response.status(409).json({ error: "Username is already taken." });
    }

    const storedPassword = hashPassword(parsed.password);
    const user = await createUser(parsed.username, storedPassword);

    return response.status(201).json({
      user: toSessionUser(user),
    });
  } catch (error) {
    if (error.code === "23505") {
      return response.status(409).json({ error: "Username is already taken." });
    }

    return next(error);
  }
});

authRouter.post("/login", async (request, response, next) => {
  try {
    const parsed = validateLoginBody(request.body);
    if (parsed.error) {
      return response.status(400).json({ error: parsed.error });
    }

    const user = await findUserByCredentials(parsed.username, parsed.password);

    if (!user) {
      return response.status(401).json({ error: "Invalid username or password." });
    }

    request.user = toSessionUser(user);

    const token = createAccessToken(user);
    setAuthCookie(response, token);

    return response.status(200).json({
      user: toSessionUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.get("/me", requireAuth, (request, response) => {
  return response.status(200).json({
    user: request.user,
  });
});

authRouter.post("/logout", async (request, response) => {
  try {
    const token = readAccessToken(request);
    if (token) {
      const payload = verifyAccessToken(token);
      const user = await findUserById(payload.sub);
      if (user) {
        request.user = {
          id: user.id,
          username: user.username,
          role: user.role,
        };
      }
    }
  } catch {
    // Still clear the cookie if the token is invalid.
  }

  clearAuthCookie(response);
  return response.status(200).json({ ok: true });
});

function toSessionUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
  };
}
