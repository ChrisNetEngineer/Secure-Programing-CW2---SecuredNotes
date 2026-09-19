import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import { clearLoggedInUser, setLoggedInUser } from "../authSession";
import "./Notes.css";

function Notes() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await api("/api/auth/me");
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.user) {
          clearLoggedInUser();
          if (active) {
            setUser(null);
          }
          return;
        }

        setLoggedInUser(data.user);
        if (active) {
          setUser(data.user);
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

    loadSession();

    return () => {
      active = false;
    };
  }, []);

  async function handleSignOut() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // The cookie is cleared server-side; still leave the page.
    }

    clearLoggedInUser();
    navigate("/", { replace: true });
  }

  if (checking) {
    return (
      <main className="notes-page">
        <p className="notes-empty">Checking your session...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="notes-page">
      <header className="notes-header">
        <h1>Secure Notes</h1>
        <div className="notes-header-actions">
          <p>Signed in as {user.username}</p>
          <button type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <section className="notes-panel">
        <div className="notes-panel-heading">
          <h2>Your notes</h2>
          <p>Notes you create will show up here.</p>
        </div>

        <div className="notes-empty">
          <p>No notes yet.</p>
        </div>
      </section>
    </main>
  );
}

export default Notes;
