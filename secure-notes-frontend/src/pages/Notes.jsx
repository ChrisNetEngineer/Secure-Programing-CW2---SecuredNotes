import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import { clearLoggedInUser, homePath, setLoggedInUser } from "../authSession";
import "./Notes.css";

function Notes() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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

        if (sessionData.user.role !== "user") {
          return;
        }

        const notesResponse = await api("/api/notes");
        const notesData = await notesResponse.json().catch(() => ({}));

        if (active && notesResponse.ok) {
          setNotes(notesData.notes || []);
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
    setSaving(true);

    try {
      const response = await api("/api/notes", {
        method: "POST",
        body: JSON.stringify({ title, content }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Unable to save the note.");
        return;
      }

      setNotes((current) => [data.note, ...current]);
      setTitle("");
      setContent("");
    } catch {
      setError("Unable to reach the server.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(noteId) {
    setError("");
    setDeletingId(noteId);

    try {
      const response = await api(`/api/notes/${noteId}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Unable to delete the note.");
        return;
      }

      setNotes((current) => current.filter((note) => note.id !== noteId));
    } catch {
      setError("Unable to reach the server.");
    } finally {
      setDeletingId(null);
    }
  }

  if (checking) {
    return (
      <main className="notes-page">
        <p className="notes-status">Checking your session...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== "user") {
    return <Navigate to={homePath(user)} replace />;
  }

  return (
    <main className="notes-page">
      <header className="notes-header">
        <div>
          <p className="notes-kicker">Private workspace</p>
          <h1>Secure Notes</h1>
        </div>
        <div className="notes-header-actions">
          <p>Signed in as {user.username}</p>
          <button type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <section className="notes-compose">
        <h2>New note</h2>
        <form className="notes-form" onSubmit={handleCreate}>
          <label htmlFor="note-title">Title</label>
          <input
            id="note-title"
            name="title"
            type="text"
            placeholder="Meeting notes, shopping list..."
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            required
          />

          <label htmlFor="note-content">Content</label>
          <textarea
            id="note-content"
            name="content"
            placeholder="Write your note here"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={6}
            maxLength={8000}
          />

          {error ? <p className="notes-error">{error}</p> : null}

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Create note"}
          </button>
        </form>
      </section>

      <section className="notes-list-panel">
        <div className="notes-panel-heading">
          <h2>Your notes</h2>
          <p>
            {notes.length === 1
              ? "1 note saved"
              : `${notes.length} notes saved`}
          </p>
        </div>

        {notes.length === 0 ? (
          <div className="notes-empty">
            <p>No notes yet. Create one above to get started.</p>
          </div>
        ) : (
          <ul className="notes-list">
            {notes.map((note) => (
              <li key={note.id} className="note-card">
                <div className="note-card-header">
                  <h3>{note.title}</h3>
                  <button
                    type="button"
                    className="note-delete"
                    onClick={() => handleDelete(note.id)}
                    disabled={deletingId === note.id}
                    aria-label={`Delete note ${note.title}`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M4 7h16" />
                      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                    {deletingId === note.id ? "Deleting" : "Delete"}
                  </button>
                </div>
                <p>{note.content || "No extra content"}</p>
                <time dateTime={note.created_at}>
                  {new Date(note.created_at).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default Notes;
