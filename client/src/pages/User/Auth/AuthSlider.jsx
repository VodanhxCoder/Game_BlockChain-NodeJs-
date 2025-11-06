import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "../../../assets/css/AuthSlider.css";

export default function AuthSlider() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initial = location.pathname.includes("signup") ? "signup" : "signin";

  const [mode, setMode] = useState(initial); // "signin" | "signup"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // signin state
  const [siEmail, setSiEmail] = useState("");
  const [siPass, setSiPass] = useState("");

  // signup state
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPass, setSuPass] = useState("");

  useEffect(() => setMode(initial), [initial]);
  useEffect(() => {
    if (auth?.isAuthenticated) navigate("/H", { replace: true });
  }, [auth?.isAuthenticated, navigate]);

  const submitSignIn = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await auth.login(siEmail.trim(), siPass);
      navigate("/H", { replace: true });
    } catch (err) {
      setError(err?.message || "Sign in failed");
    } finally { setLoading(false); }
  };

  const submitSignUp = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await auth.register({ name: suName.trim(), email: suEmail.trim(), password: suPass });
      navigate("/H", { replace: true });
    } catch (err) {
      setError(err?.message || "Sign up failed");
    } finally { setLoading(false); }
  };

  const autofill = (u) => {
    setSiEmail(u.email); setSiPass(u.password); setSuEmail(u.email);
  };

  const toggleMode = () => setMode((m) => (m === "signup" ? "signin" : "signup"));

  return (
    <div className={`as-root ${mode === "signup" ? "as--signup" : "as--signin"}`} role="main">
      <div className="as-card" aria-hidden={false}>
        <section className="as-panel as-panel--left" aria-labelledby="signin-title">
          <h2 id="signin-title">Welcome back</h2>
          <p className="as-sub">Sign in to continue</p>

          <form className="as-form" onSubmit={submitSignIn} noValidate>
            {error && <div className="as-error" role="alert">{error}</div>}
            <input className="as-input" value={siEmail} onChange={(e) => setSiEmail(e.target.value)} type="email" placeholder="Email" required />
            <input className="as-input" value={siPass} onChange={(e) => setSiPass(e.target.value)} type="password" placeholder="Password" required />
            <div className="as-actions">
              <button className="btn btn--primary" type="submit" disabled={loading}>{loading ? "Signing…" : "Sign in"}</button>
              <button type="button" className="btn btn--ghost" onClick={() => setMode("signup")}>Create account</button>
            </div>
          </form>

          {auth?.mockUsers?.length > 0 && (
            <div className="as-mock">
              <small>Mock accounts</small>
              <div className="as-mock-list">
                {auth.mockUsers.map((u) => (
                  <button key={u.email} className="btn-link" onClick={() => autofill(u)}>{u.email}</button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="as-panel as-panel--right" aria-labelledby="signup-title">
          <h2 id="signup-title">Create account</h2>
          <p className="as-sub">Quick — get playing in seconds</p>

          <form className="as-form" onSubmit={submitSignUp} noValidate>
            <input className="as-input" value={suName} onChange={(e) => setSuName(e.target.value)} type="text" placeholder="Full name" required />
            <input className="as-input" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} type="email" placeholder="Email" required />
            <input className="as-input" value={suPass} onChange={(e) => setSuPass(e.target.value)} type="password" placeholder="Password" required />
            <div className="as-actions">
              <button className="btn btn--primary" type="submit" disabled={loading}>{loading ? "Creating…" : "Create account"}</button>
              <button type="button" className="btn btn--ghost" onClick={() => setMode("signin")}>Have an account?</button>
            </div>
          </form>
        </section>

        <div className="as-overlay" aria-hidden={false}>
          <div className="as-overlay-inner">
            <h3>{mode === "signup" ? "Join the game" : "Welcome back"}</h3>
            <p className="as-sub">{mode === "signup" ? "Create an account and start collecting items." : "Sign in to access your inventory and play."}</p>
            {/* Circle toggle button replaces the two overlay action buttons */}
            <button
              className="as-toggle"
              aria-pressed={mode === "signup"}
              aria-label={mode === "signup" ? "Switch to sign in" : "Switch to sign up"}
              onClick={toggleMode}
              title={mode === "signup" ? "Switch to Sign in" : "Switch to Sign up"}
            >
              {/* single chevron icon — CSS handles rotation */}
              <span className="as-toggle-icon">›</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}