export function auditPath(request) {
  const raw = (request.originalUrl || request.url || "").split("?")[0];
  return raw.slice(0, 200);
}

export function describeAuditAction(method, path, status) {
  const normalised = path.replace(/\/\d+/g, "/:id");

  if (method === "POST" && normalised === "/api/auth/login") {
    if (status === 200) {
      return "Login success";
    }
    if (status === 403) {
      return "Login blocked";
    }
    if (status === 429) {
      return "Login rate limited";
    }
    return "Login failed";
  }

  if (method === "POST" && normalised === "/api/auth/signup") {
    return status < 400 ? "Signup success" : "Signup failed";
  }

  if (method === "POST" && normalised === "/api/auth/logout") {
    return "Logout";
  }

  if (method === "GET" && normalised === "/api/auth/me") {
    return "Read session";
  }

  if (method === "GET" && normalised === "/api/notes") {
    return "List notes";
  }

  if (method === "POST" && normalised === "/api/notes") {
    return status < 400 ? "Create note" : "Create note failed";
  }

  if (method === "DELETE" && normalised === "/api/notes/:id") {
    return status < 400 ? "Delete note" : "Delete note failed";
  }

  if (method === "GET" && normalised === "/api/admin/users") {
    return "List users";
  }

  if (method === "POST" && normalised === "/api/admin/users") {
    return status < 400 ? "Create user" : "Create user failed";
  }

  if (method === "PATCH" && normalised === "/api/admin/users/:id/disabled") {
    return "Change account status";
  }

  if (method === "PATCH" && normalised === "/api/admin/users/:id/role") {
    return "Change user role";
  }

  if (method === "DELETE" && normalised === "/api/admin/users/:id") {
    return "Delete user";
  }

  if (method === "GET" && normalised === "/api/admin/audit-logs") {
    return "View audit log";
  }

  if (method === "GET" && normalised === "/api/admin/audit-logs/export") {
    return "Export audit log";
  }

  return `${method} ${normalised}`;
}

export function safeAuditDetails(request) {
  const details = {};
  const username = request.auditUsername;
  if (typeof username === "string" && username) {
    details.username = username.slice(0, 32);
  }

  const idParam = request.params?.id;
  if (idParam && /^\d+$/.test(String(idParam))) {
    details.resourceId = Number(idParam);
  }

  return details;
}

export function auditLogsToCsv(logs) {
  const header = [
    "id",
    "created_at",
    "actor_id",
    "actor_username",
    "actor_role",
    "action",
    "method",
    "path",
    "status",
    "details",
  ];

  const rows = logs.map((entry) => [
    entry.id,
    entry.created_at instanceof Date
      ? entry.created_at.toISOString()
      : entry.created_at,
    entry.actor_id ?? "",
    entry.actor_username ?? "",
    entry.actor_role ?? "",
    entry.action,
    entry.method,
    entry.path,
    entry.status,
    JSON.stringify(entry.details || {}),
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  const escaped = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${escaped.replace(/"/g, '""')}"`;
}
