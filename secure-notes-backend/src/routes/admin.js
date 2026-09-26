import { Router } from "express";
import {
  countAuditLogs,
  createUser,
  deleteUserById,
  listAllAuditLogs,
  listAuditLogs,
  listUsers,
  setUserDisabled,
  setUserRole,
} from "../db.js";
import { auditLogsToCsv } from "../lib/audit.js";
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

adminRouter.get("/audit-logs", async (request, response, next) => {
  try {
    const limit = parsePageSize(request.query.limit, 10, 10);
    const offset = parsePageSize(request.query.offset, 0, 0);

    const [logs, total] = await Promise.all([
      listAuditLogs(limit, offset),
      countAuditLogs(),
    ]);

    return response.status(200).json({ logs, total, limit, offset });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/audit-logs/export", async (_request, response, next) => {
  try {
    const logs = await listAllAuditLogs();
    const csv = `\uFEFF${auditLogsToCsv(logs)}\r\n`;
    const date = new Date().toISOString().slice(0, 10);

    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="audit-logs-${date}.csv"`
    );
    return response.status(200).send(csv);
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

    request.auditUsername = parsed.username;

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
    const targetId = parseUserId(request.params.id);
    if (!targetId) {
      return response.status(400).json({ error: "Invalid user id." });
    }

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
    const targetId = parseUserId(request.params.id);
    if (!targetId) {
      return response.status(400).json({ error: "Invalid user id." });
    }

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
    const targetId = parseUserId(request.params.id);
    if (!targetId) {
      return response.status(400).json({ error: "Invalid user id." });
    }

    const result = await deleteUserById(request.user.id, targetId);
    if (result.error) {
      return response.status(result.status).json({ error: result.error });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

function parseUserId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function parsePageSize(value, fallback, max) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function toAdminUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    created_at: user.created_at,
    disabled: user.disabled,
  };
}
