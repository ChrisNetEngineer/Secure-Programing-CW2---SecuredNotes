import { Navigate, useNavigate } from "react-router-dom";
import { clearLoggedInUser, getLoggedInUser } from "../authSession";
import "./Notes.css";

function Notes() {
  const navigate = useNavigate();
  const user = getLoggedInUser();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  function handleSignOut() {
    clearLoggedInUser();
    navigate("/", { replace: true });
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
