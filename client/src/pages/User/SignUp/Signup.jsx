// Captures new user details, validates input, and animates the transition between auth pages.
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { sanitizeInput } from "../../../utils/sanitizer";
import EmailVerificationPopup from "../../../components/EmailVerificationPopup";
import "../../../assets/css/auth.css";
import "../../../assets/css/EmailVerification.css";

const TRANSITION_MS = 420;

export default function SignUp() {
  const { register, sendVerificationEmail, verifyEmail, resendVerificationEmail, checkAvailability } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [pendingUserData, setPendingUserData] = useState(null);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationUsername, setVerificationUsername] = useState("");
  const recaptchaRef = useRef(null);

  // Debug state
  // console.log("Signup render - showEmailVerification:", showEmailVerification, "pendingUserData:", pendingUserData, "verificationEmail:", verificationEmail, "verificationUsername:", verificationUsername);

  // Reset reCAPTCHA when theme changes
  useEffect(() => {
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
      setCaptchaToken(null);
    }
  }, [isDark]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) {
      return;
    }
    
    // Reset all states at the beginning
    setError("");
    setShowEmailVerification(false);
    setPendingUserData(null);
    setVerificationEmail("");
    setVerificationUsername("");
    
    if (!captchaToken) {
      setError("Please complete the reCAPTCHA verification.");
      return;
    }
    
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);
    const sanitizedConfirm = sanitizeInput(confirm);
    
    if (!sanitizedName || !sanitizedEmail || sanitizedPassword.length < 6 || sanitizedPassword !== sanitizedConfirm) {
      setError("Please enter valid details.");
      return;
    }
    
    setLoading(true);
    try {
      // Check if email and username are available first
      await checkAvailability(sanitizedEmail, sanitizedName);

      // Send verification email before showing popup
      await sendVerificationEmail(sanitizedEmail, sanitizedName);
      
      // Only if available and email sent, proceed with verification popup
      setVerificationEmail(sanitizedEmail);
      setVerificationUsername(sanitizedName);
      
      // Store user data for later registration
      setPendingUserData({
        name: sanitizedName,
        email: sanitizedEmail,
        password: sanitizedPassword,
        username: sanitizedName
      });
      
      setShowEmailVerification(true);
      
    } catch (err) {
      // Don't show popup if any pre-check fails
      setError(err?.message || "Could not proceed with registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = async () => {
    if (!pendingUserData) return;
    
    setLoading(true);
    try {
      // Now register the user after email verification
      await register(pendingUserData);
      setShowEmailVerification(false);
      navigate("/H", { replace: true });
    } catch (err) {
      console.error('Registration error:', err);
      if (err.message === 'EMAIL_VERIFICATION_REQUIRED') {
        setError("Please verify your email first.");
      } else {
        setError(err?.message || "Could not create account.");
      }
      setShowEmailVerification(false);
    } finally {
      setLoading(false);
      setPendingUserData(null);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) {
      throw new Error("No verification email");
    }
    
    return resendVerificationEmail(verificationEmail);
  };

  const handleCloseVerification = () => {
    setShowEmailVerification(false);
    setPendingUserData(null);
  };

  const swapToSignin = () => {
    if (isSwapping) return;
    setIsSwapping(true);
    setTimeout(() => navigate("/signin"), TRANSITION_MS);
  };

  return (
    <>
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
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

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
                <div className="password-input-container">
                  <input
                    className="field-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={`password-toggle ${isDark ? 'dark' : 'light'}`}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    )}
                  </button>
                </div>
              </label>

              <label className="auth-field">
                <span className="field-label">Confirm password</span>
                <div className="password-input-container">
                  <input
                    className="field-input"
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={`password-toggle ${isDark ? 'dark' : 'light'}`}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    )}
                  </button>
                </div>
              </label>

              <div className="recaptcha-container">
                <ReCAPTCHA
                  key={isDark ? "dark" : "light"}
                  ref={recaptchaRef}
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  onChange={(token) => setCaptchaToken(token)}
                  onExpired={() => setCaptchaToken(null)}
                  theme={isDark ? "dark" : "light"}
                />
              </div>

              <div className="auth-actions">
                <button type="submit" className="btn primary" disabled={loading}>
                  {loading ? "Sending verification..." : "Create account"}
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

      <EmailVerificationPopup
        isOpen={showEmailVerification}
        onClose={handleCloseVerification}
        onVerifySuccess={handleVerificationSuccess}
        email={verificationEmail}
        username={verificationUsername}
        onResendCode={handleResendVerification}
      />
    </>
  );
}
