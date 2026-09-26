import { insertAuditLog } from "../db.js";
import {
  auditPath,
  describeAuditAction,
  safeAuditDetails,
} from "../lib/audit.js";

export function auditApiRequests(request, response, next) {
  response.on("finish", () => {
    const path = auditPath(request);
    if (!path.startsWith("/api/") || path.startsWith("/api/health")) {
      return;
    }

    const actor = request.user;
    const method = request.method;
    const status = response.statusCode;

    insertAuditLog({
      actorId: actor?.id ?? null,
      actorUsername: actor?.username ?? null,
      actorRole: actor?.role ?? null,
      action: describeAuditAction(method, path, status),
      method,
      path,
      status,
      details: safeAuditDetails(request),
    }).catch((error) => {
      console.error("Failed to write audit log.", error);
    });
  });

  return next();
}
