// Captures new user details, validates input, and animates the transition between auth pages.
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import "../../../assets/css/auth.css";

const TRANSITION_MS = 420;

export default function SignUp() {
  const { register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    if (!name.trim()) return setError("Please enter your name.");
    if (!email.trim()) return setError("Please enter your email.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      navigate("/H", { replace: true });
    } catch (err) {
      setError(err?.message || "Could not create account.");
    } finally {
      setLoading(false);
    }
  };

  const swapToSignin = () => {
    if (isSwapping) return;
    setIsSwapping(true);
    setTimeout(() => navigate("/signin"), TRANSITION_MS);
  };

  return (
    <div className={`auth-page auth-split ${isSwapping ? "is-exiting" : ""}`}>
      <div className="auth-shell is-signup" role="main" aria-labelledby="signup-title">
        <section className="auth-panel auth-panel--form">
          <div className="auth-panel__header">
            <div className="auth-brand">
              <div className="auth-logo" aria-hidden>BLK</div>
              <div className="auth-title">
                <h2 id="signup-title">Create your hangar</h2>
                <div className="auth-sub">Reserve a callsign and mint your first loadout.</div>
              </div>
            </div>
            <button
              type="button"
              className="auth-theme-toggle"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              data-mode={isDark ? "dark" : "light"}
            >
              <span className="auth-theme-toggle__icon" aria-hidden="true">
                {isDark ? "🌙" : "☀️"}
              </span>
              <span className="sr-only">{isDark ? "Dark mode" : "Light mode"}</span>
            </button>
          </div>

          <form className="auth-form" onSubmit={onSubmit} noValidate>
            {error && <div className="auth-error" role="alert">{error}</div>}

            <label className="auth-field">
              <span className="field-label">Display name</span>
              <input
                className="field-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Captain Nova"
                required
                autoComplete="nickname"
              />
            </label>

            <label className="auth-field">
              <span className="field-label">Email</span>
              <input
                className="field-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </label>

            <label className="auth-field">
              <span className="field-label">Password</span>
              <input
                className="field-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                autoComplete="new-password"
              />
            </label>

            <label className="auth-field">
              <span className="field-label">Confirm password</span>
              <input
                className="field-input"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                required
                autoComplete="new-password"
              />
            </label>

            <div className="auth-actions">
              <button type="submit" className="btn primary" disabled={loading}>
                {loading ? "Creating..." : "Create account"}
              </button>
              <button type="button" className="btn btn-outline" onClick={swapToSignin} disabled={isSwapping}>
                I already have an account
              </button>
            </div>
          </form>
        </section>

        <aside className="auth-panel auth-panel--preview is-alt">
          <p className="auth-eyebrow">Returning Raider?</p>
          <h3>Jump back in with your existing credentials.</h3>
          <p className="auth-preview-copy">
            Sync progress across devices, restore purchases, and keep your streak alive with
            multi-factor security baked in.
          </p>
          <ul className="auth-preview-list">
            <li>Instant wallet binding after verification.</li>
            <li>Layer-2 ready inventory for faster trades.</li>
            <li>Seasonal rewards delivered automatically.</li>
          </ul>
          <button type="button" className="auth-preview-btn" onClick={swapToSignin} disabled={isSwapping}>
            Slide to sign in
          </button>
          <div className="auth-preview-meta">
            <span>Need help?</span>
            <a className="auth-link" href="mailto:support@blockverse.gg">support@blockverse.gg</a>
          </div>
        </aside>
      </div>
    </div>
  );
}
