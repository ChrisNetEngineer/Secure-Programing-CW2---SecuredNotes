import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import { clearLoggedInUser, homePath, setLoggedInUser } from "../authSession";
import "./Admin.css";

function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logsError, setLogsError] = useState("");
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [exportingLogs, setExportingLogs] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        const sessionResponse = await api("/api/auth/me");
        const sessionData = await sessionResponse.json().catch(() => ({}));

        if (!sessionResponse.ok || !sessionData.user) {
          clearLoggedInUser();
          if (active) {
            setUser(null);
          }
          return;
        }

        setLoggedInUser(sessionData.user);
        if (active) {
          setUser(sessionData.user);
        }

        if (sessionData.user.role !== "admin") {
          return;
        }

        const usersResponse = await api("/api/admin/users");
        const usersData = await usersResponse.json().catch(() => ({}));

        if (active && usersResponse.ok) {
          setUsers(usersData.users || []);
        } else if (active) {
          setError(usersData.error || "Unable to load users.");
        }

        const logsResponse = await api("/api/admin/audit-logs?limit=10&offset=0");
        const logsData = await logsResponse.json().catch(() => ({}));

        if (active && logsResponse.ok) {
          setLogs(logsData.logs || []);
          setLogTotal(logsData.total || 0);
        } else if (active) {
          setLogsError(logsData.error || "Unable to load audit logs.");
        }
      } catch {
        clearLoggedInUser();
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, []);

  async function handleSignOut() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue signing out even if the request fails.
    }

    clearLoggedInUser();
    navigate("/", { replace: true });
  }

  async function loadAuditLogs() {
    setLogsError("");
    setLoadingLogs(true);

    try {
      const logsResponse = await api("/api/admin/audit-logs?limit=10&offset=0");
      const logsData = await logsResponse.json().catch(() => ({}));

      if (!logsResponse.ok) {
        setLogsError(logsData.error || "Unable to load audit logs.");
        return;
      }

      setLogs(logsData.logs || []);
      setLogTotal(logsData.total || 0);
    } catch {
      setLogsError("Unable to reach the server.");
    } finally {
      setLoadingLogs(false);
    }
  }

  async function handleExportCsv() {
    setLogsError("");
    setExportingLogs(true);

    try {
      const response = await api("/api/admin/audit-logs/export");
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setLogsError(data.error || "Unable to export audit logs.");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `audit-logs-${date}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setLogsError("Unable to reach the server.");
    } finally {
      setExportingLogs(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const response = await api("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({ username, password, role }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Unable to create the user.");
        return;
      }

      setUsers((current) => [...current, data.user]);
      setUsername("");
      setPassword("");
      setRole("user");
      setMessage(`Created ${data.user.username} as ${data.user.role}.`);
    } catch {
      setError("Unable to reach the server.");
    } finally {
      setSaving(false);
    }
  }

  async function patchUser(userId, path, body) {
    setError("");
    setMessage("");
    setBusyId(userId);

    try {
      const response = await api(`/api/admin/users/${userId}${path}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Unable to update the user.");
        return;
      }

      setUsers((current) =>
        current.map((entry) => (entry.id === userId ? data.user : entry))
      );
    } catch {
      setError("Unable to reach the server.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(target) {
    const confirmed = window.confirm(
      `Delete ${target.username}? Their notes will be permanently removed, and this cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");
    setBusyId(target.id);

    try {
      const response = await api(`/api/admin/users/${target.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Unable to delete the user.");
        return;
      }

      setUsers((current) => current.filter((entry) => entry.id !== target.id));
      setMessage(`Deleted ${target.username}.`);
    } catch {
      setError("Unable to reach the server.");
    } finally {
      setBusyId(null);
    }
  }

  if (checking) {
    return (
      <main className="admin-page">
        <p className="admin-status">Checking your session...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to={homePath(user)} replace />;
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-kicker">Account administration</p>
          <h1>Secure Notes</h1>
        </div>
        <div className="admin-header-actions">
          <p>Signed in as {user.username}</p>
          <button type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <section className="admin-compose">
        <h2>Create user</h2>
        <form className="admin-form" onSubmit={handleCreate}>
          <label htmlFor="admin-username">Username</label>
          <input
            id="admin-username"
            name="username"
            type="text"
            autoComplete="off"
            placeholder="letters, numbers, underscores"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <label htmlFor="admin-role">Role</label>
          <select
            id="admin-role"
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="user">Normal user</option>
            <option value="admin">Admin</option>
          </select>

          {error ? <p className="admin-error">{error}</p> : null}
          {message ? <p className="admin-success">{message}</p> : null}

          <button type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create account"}
          </button>
        </form>
      </section>

      <section className="admin-list-panel">
        <div className="admin-panel-heading">
          <h2>Users</h2>
          <p>
            {users.length === 1
              ? "1 account"
              : `${users.length} accounts`}
          </p>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Role</th>
                <th>Created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortUsers(users, user.id).map((entry) => {
                const isSelf = entry.id === user.id;
                const busy = busyId === entry.id;

                return (
                  <tr key={entry.id} className={entry.disabled ? "is-disabled" : ""}>
                    <td>{entry.id}</td>
                    <td>{entry.username}</td>
                    <td>
                      <span className={`admin-role admin-role-${entry.role}`}>
                        {entry.role}
                      </span>
                    </td>
                    <td>
                      <time dateTime={entry.created_at}>
                        {new Date(entry.created_at).toLocaleString()}
                      </time>
                    </td>
                    <td>
                      <span
                        className={`admin-status-pill ${
                          entry.disabled ? "is-locked" : "is-active"
                        }`}
                      >
                        {entry.disabled ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          type="button"
                          className={`admin-action ${
                            entry.disabled
                              ? "admin-action-enable"
                              : "admin-action-disable"
                          }`}
                          onClick={() =>
                            patchUser(entry.id, "/disabled", {
                              disabled: !entry.disabled,
                            })
                          }
                          disabled={busy || isSelf}
                          title={
                            isSelf
                              ? "You cannot change your own account status."
                              : entry.disabled
                                ? "Allow this account to sign in again"
                                : "Lock this account without deleting it"
                          }
                        >
                          {entry.disabled ? <UnlockIcon /> : <LockIcon />}
                          {entry.disabled ? "Enable" : "Disable"}
                        </button>
                        <button
                          type="button"
                          className={`admin-action ${
                            entry.role === "admin"
                              ? "admin-action-user"
                              : "admin-action-admin"
                          }`}
                          onClick={() =>
                            patchUser(entry.id, "/role", {
                              role: entry.role === "admin" ? "user" : "admin",
                            })
                          }
                          disabled={busy || isSelf}
                          title={
                            isSelf
                              ? "You cannot change your own role."
                              : entry.role === "admin"
                                ? "Change this account to a normal user"
                                : "Grant admin access"
                          }
                        >
                          {entry.role === "admin" ? <UserIcon /> : <ShieldIcon />}
                          {entry.role === "admin" ? "Make user" : "Make admin"}
                        </button>
                        <button
                          type="button"
                          className="admin-action admin-action-delete"
                          onClick={() => handleDelete(entry)}
                          disabled={busy || isSelf}
                          title={
                            isSelf
                              ? "You cannot delete your own account."
                              : "Permanently delete this account and its notes"
                          }
                        >
                          <TrashIcon />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-list-panel">
        <div className="admin-panel-heading">
          <h2>Audit log</h2>
        </div>

        <div className="admin-log-toolbar">
          <p className="admin-log-blurb">
            Showing the {Math.min(logs.length, 10)} most recent
            {logTotal > 10 ? ` of ${logTotal}` : ""} events. Export CSV for
            the full history, including older records. Passwords and note
            content are never stored.
          </p>
          <div className="admin-log-actions">
            <button
              type="button"
              className="admin-log-btn admin-log-btn-export"
              onClick={handleExportCsv}
              disabled={exportingLogs || logTotal === 0}
            >
              <DownloadIcon />
              {exportingLogs ? "Exporting..." : "Export CSV"}
            </button>
            <button
              type="button"
              className="admin-log-btn admin-log-btn-refresh"
              onClick={loadAuditLogs}
              disabled={loadingLogs}
            >
              <RefreshIcon />
              {loadingLogs ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {logsError ? <p className="admin-error">{logsError}</p> : null}

        {logs.length === 0 ? (
          <div className="admin-empty">
            <p>No audit events yet.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Request</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <time dateTime={entry.created_at}>
                        {new Date(entry.created_at).toLocaleString()}
                      </time>
                    </td>
                    <td>
                      {entry.actor_username || "anonymous"}
                      {entry.actor_role ? (
                        <span className={`admin-role admin-role-${entry.actor_role}`}>
                          {entry.actor_role}
                        </span>
                      ) : null}
                    </td>
                    <td>{entry.action}</td>
                    <td>
                      <code className="admin-log-path">
                        {entry.method} {entry.path}
                      </code>
                    </td>
                    <td>
                      <span
                        className={`admin-status-pill ${
                          entry.status >= 400 ? "is-locked" : "is-active"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function sortUsers(users, currentUserId) {
  return [...users].sort((left, right) => {
    if (left.id === currentUserId) {
      return -1;
    }
    if (right.id === currentUserId) {
      return 1;
    }

    return left.id - right.id;
  });
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 7.5-1.9" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l8 3v6c0 5-3.4 8.4-8 9.5C7.4 20.4 4 17 4 12V6l8-3z" />
      <path d="M9.5 12.5l1.8 1.8 3.7-4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.2a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v12" />
      <path d="M7 12l5 5 5-5" />
      <path d="M5 19h14" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.2-5.5" />
      <path d="M20 5v5h-5" />
    </svg>
  );
}

export default Admin;
