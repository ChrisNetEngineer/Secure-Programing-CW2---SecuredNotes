import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createUser, findUserByUsername } from "../db.js";
import { hashPassword, passwordsMatch } from "../lib/passwords.js";
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

    if (await findUserByUsername(parsed.username)) {
      return response.status(409).json({ error: "Username is already taken." });
    }

    const passwordHash = await hashPassword(parsed.password);
    const user = await createUser(parsed.username, passwordHash);

    return response.status(201).json({
      user: {
        id: user.id,
        username: user.username,
      },
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

    const user = await findUserByUsername(parsed.username);
    const matches = await passwordsMatch(parsed.password, user?.password_hash);

    if (!matches) {
      return response.status(401).json({ error: "Invalid username or password." });
    }

    return response.status(200).json({
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    return next(error);
  }
});
