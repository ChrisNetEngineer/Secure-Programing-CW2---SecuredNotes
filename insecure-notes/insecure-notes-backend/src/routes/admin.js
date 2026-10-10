import { Router } from "express";
import {
  createUser,
  deleteUserById,
  listUsers,
  setUserDisabled,
  setUserRole,
} from "../db.js";
import { hashPassword } from "../lib/passwords.js";
import {
  validateAdminCreateBody,
  validateDisabledBody,
  validateRoleBody,
} from "../lib/validation.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("admin"));

adminRouter.get("/users", async (_request, response, next) => {
  try {
    const users = await listUsers();
    return response.status(200).json({ users });
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/users", async (request, response, next) => {
  try {
    const parsed = validateAdminCreateBody(request.body);
    if (parsed.error) {
      return response.status(400).json({ error: parsed.error });
    }

    const passwordHash = await hashPassword(parsed.password);
    const user = await createUser(parsed.username, passwordHash, parsed.role);

    return response.status(201).json({
      user: toAdminUser(user),
    });
  } catch (error) {
    if (error.code === "23505") {
      return response.status(409).json({ error: "Username is already taken." });
    }

    return next(error);
  }
});

adminRouter.patch("/users/:id/disabled", async (request, response, next) => {
  try {
    const targetId = request.params.id;
    const parsed = validateDisabledBody(request.body);
    if (parsed.error) {
      return response.status(400).json({ error: parsed.error });
    }

    const result = await setUserDisabled(request.user.id, targetId, parsed.disabled);
    if (result.error) {
      return response.status(result.status).json({ error: result.error });
    }

    return response.status(200).json({ user: toAdminUser(result.user) });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/users/:id/role", async (request, response, next) => {
  try {
    const targetId = request.params.id;
    const parsed = validateRoleBody(request.body);
    if (parsed.error) {
      return response.status(400).json({ error: parsed.error });
    }

    const result = await setUserRole(request.user.id, targetId, parsed.role);
    if (result.error) {
      return response.status(result.status).json({ error: result.error });
    }

    return response.status(200).json({ user: toAdminUser(result.user) });
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete("/users/:id", async (request, response, next) => {
  try {
    const result = await deleteUserById(request.user.id, request.params.id);
    if (result.error) {
      return response.status(result.status).json({ error: result.error });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

function toAdminUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    created_at: user.created_at,
    disabled: user.disabled,
  };
}
