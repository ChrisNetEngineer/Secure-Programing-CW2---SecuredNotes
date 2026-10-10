import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import { clearLoggedInUser, homePath, setLoggedInUser } from "../authSession";
import { UnsafeHtml, serverMessage } from "../unsafeHtml";
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
          setError(serverMessage(usersData, "Unable to load users."));
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
        setError(serverMessage(data, "Unable to create the user."));
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
        setError(serverMessage(data, "Unable to update the user."));
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
        setError(serverMessage(data, "Unable to delete the user."));
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
          <p>
            Signed in as <UnsafeHtml html={user.username} />
          </p>
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

          {error ? <UnsafeHtml as="p" className="admin-error" html={error} /> : null}
          {message ? <UnsafeHtml as="p" className="admin-success" html={message} /> : null}

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
                    <td>
                      <UnsafeHtml html={entry.username} />
                    </td>
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

export default Admin;
