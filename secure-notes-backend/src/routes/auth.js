import { Router } from "express";
import rateLimit from "express-rate-limit";
import { findUserByUsername, lockAccountById, findUserById, createUser } from "../db.js";
import { hashPassword, passwordsMatch } from "../lib/passwords.js";
import {
  clearFailedLogins,
  recordFailedLogin,
  shouldLockAfterFailures,
} from "../lib/loginLockout.js";
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

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many signup attempts. Try again later." },
});

authRouter.post("/signup", signupLimiter, async (request, response, next) => {
  try {
    const parsed = validateSignupBody(request.body);
    if (parsed.error) {
      return response.status(400).json({ error: parsed.error });
    }

    request.auditUsername = parsed.username;

    if (await findUserByUsername(parsed.username)) {
      return response.status(409).json({ error: "Username is already taken." });
    }

    const passwordHash = await hashPassword(parsed.password);
    const user = await createUser(parsed.username, passwordHash);

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

authRouter.post("/login", loginLimiter, async (request, response, next) => {
  try {
    const parsed = validateLoginBody(request.body);
    if (parsed.error) {
      return response.status(400).json({ error: parsed.error });
    }

    request.auditUsername = parsed.username;

    const user = await findUserByUsername(parsed.username);
    const matches = await passwordsMatch(parsed.password, user?.password_hash);

    if (!matches) {
      if (user && !user.disabled) {
        const failureCount = recordFailedLogin(user.username);
        if (shouldLockAfterFailures(failureCount)) {
          await lockAccountById(user.id);
          clearFailedLogins(user.username);
          return response.status(403).json({
            error: "This account is locked. Please contact an administrator.",
          });
        }
      }

      return response.status(401).json({ error: "Invalid username or password." });
    }

    if (user.disabled) {
      return response.status(403).json({
        error: "This account is locked. Please contact an administrator.",
      });
    }

    clearFailedLogins(user.username);

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
