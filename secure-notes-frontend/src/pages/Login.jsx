//Please refer to the Doc-Login.txt file for the documentation of this page

import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { getLoggedInUser, setLoggedInUser } from "../authSession";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (getLoggedInUser()) {
    return <Navigate to="/notes" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Unable to sign in.");
        return;
      }

      setLoggedInUser(data.user);
      navigate("/notes", { replace: true });
    } catch {
      setError("Unable to reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <h1>Secure Notes</h1>
          <p>Sign in to access your notes</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {location.state?.accountCreated ? (
            <p className="login-message login-message-success">
              Account created. You can sign in now.
            </p>
          ) : null}
          {error ? <p className="login-message login-message-error">{error}</p> : null}

          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="login-alt">
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
