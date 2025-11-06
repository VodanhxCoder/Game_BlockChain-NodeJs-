import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "../../../assets/css/auth.css";

export default function SignIn() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.from?.pathname || "/H"; // redirect target

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      await auth.login(email.trim(), password);
      // after successful sign-in, navigate to homepage
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(err?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const fillMock = (u) => {
    setEmail(u.email);
    setPassword(u.password);
    setError("");
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--centered" role="main" aria-labelledby="signin-title">
        <h2 id="signin-title">Sign in</h2>

        <form className="auth-form" onSubmit={submit} noValidate>
          {error && <div className="auth-error" role="alert">{error}</div>}

          <label className="auth-field">
            <span className="field-label">Email</span>
            <input
              className="field-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-field">
            <span className="field-label">Password</span>
            <input
              className="field-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          <div className="auth-row">
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <Link to="/signup" className="btn btn-ghost">Sign up</Link>
          </div>
        </form>

        {auth?.mockUsers?.length > 0 && (
          <div className="auth-mock" style={{ marginTop: 12, color: "#9ab" }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Mock accounts (click to autofill):</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {auth.mockUsers.map((u) => (
                <li key={u.email} style={{ marginBottom: 6 }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => fillMock(u)}
                    style={{ fontSize: 13 }}
                  >
                    {u.email} / {u.password}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginTop: 10 }}>
          <Link to="/forgot" className="auth-link">Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}