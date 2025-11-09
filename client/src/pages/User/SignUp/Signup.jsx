import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../../assets/css/auth.css";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please enter your name.");
    if (!email.trim()) return setError("Please enter your email.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    setTimeout(() => {
      console.log("signup", { name, email });
      setLoading(false);
      navigate("/H");
    }, 800);
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--centered" role="main" aria-labelledby="signup-title">
        <Link to="/H" className="auth-close" aria-label="Back to home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 22V13h14v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        <div className="auth-brand">
          <div className="auth-logo" aria-hidden>AI</div>
          <div className="auth-title">
            <h2 id="signup-title">Create account</h2>
            <div className="auth-sub">Join the Arcade — quick setup to start playing</div>
          </div>
        </div>

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          {error && <div className="auth-error">{error}</div>}

          <label className="auth-field">
            <span className="field-label">Name</span>
            <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" required />
          </label>

          <label className="auth-field">
            <span className="field-label">Email</span>
            <input className="field-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
          </label>

          <label className="auth-field">
            <span className="field-label">Password</span>
            <input className="field-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required autoComplete="new-password" />
          </label>

          <label className="auth-field">
            <span className="field-label">Confirm password</span>
            <input className="field-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" required autoComplete="new-password" />
          </label>

          <div className="auth-actions">
            <button type="submit" className="btn primary" disabled={loading}>{loading ? "Creating…" : "Create account"}</button>
            <Link to="/signin" className="btn btn-ghost">Sign in</Link>
          </div>

          <div className="auth-hr"><span>or continue with</span></div>

          <div className="auth-socials">
            <button type="button" className="social-btn">Google</button>
            <button type="button" className="social-btn">GitHub</button>
          </div>
        </form>
      </div>
    </div>
  );
}