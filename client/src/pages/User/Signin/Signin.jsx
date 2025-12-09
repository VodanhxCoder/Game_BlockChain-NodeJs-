// Handles credential-based sign-in, mock autofill, and redirect logic for authenticated users.
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { useLanguage } from "../../../context/LanguageContext";
import { hashTextSHA256 } from "../../../utils/Passwordhasher";
import { sanitizeInput } from "../../../utils/sanitizer";
import "../../../assets/css/auth.css";

const TRANSITION_MS = 420;

export default function SignIn() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.from?.pathname || "/H";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const recaptchaRef = useRef(null);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/H', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Reset reCAPTCHA when theme changes
  useEffect(() => {
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
      setCaptchaToken(null);
    }
  }, [isDark]);

  // Check if CAPTCHA is required on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
        const res = await fetch(`${API_BASE}/api/auth/check-status`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.requiresCaptcha) {
            setRequiresCaptcha(true);
          }
        }
      } catch (err) {
        console.error("Failed to check auth status:", err);
      }
    };
    checkAuthStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    
    if (requiresCaptcha && !captchaToken) {
      setError(t("auth.errorCaptcha"));
      return;
    }
    
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);
    if (!sanitizedEmail || !sanitizedPassword) {
      setError(t("auth.errorFillAll"));
      return;
    }
    setLoading(true);
    try {
      // Hash the password on the client before sending to the login handler.
      // NOTE: Ensure your backend expects the hashed password; otherwise adapt accordingly.
      const hashed = await hashTextSHA256(sanitizedPassword);
      await login(sanitizedEmail, hashed, captchaToken);
      navigate(returnTo, { replace: true });
    } catch (err) {
      // Handle specific error cases
      if (err?.isBanned) {
        setError(t("auth.errorBanned"));
      } else if (err?.isInactive) {
        setError(t("auth.errorInactive"));
      } else {
        setError(err?.message || t("auth.errorSignIn"));
      }
      
      if (err?.requiresCaptcha) {
        setRequiresCaptcha(true);
      }
    } finally {
      setLoading(false);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setCaptchaToken(null);
      }
    }
  };

  const swapToSignup = () => {
    if (isSwapping) return;
    setIsSwapping(true);
    setTimeout(() => navigate("/signup"), TRANSITION_MS);
  };

  const socialProviders = [
    {
      id: "google",
      label: t("Tiêp tục với Google"),
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M12 10.2v3.8h5.3c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.2 2.8-7.1 0-.7-.1-1.4-.2-2H12z"
          />
          <path
            fill="#34A853"
            d="M5.3 14.3l-.8.6-2.5 1.9C3.3 19.6 7.3 22 12 22c2.9 0 5.4-1 7.2-2.8l-3.1-2.4c-.9.6-2 .9-3.2.9-2.5 0-4.7-1.7-5.5-4.1z"
          />
          <path
            fill="#4A90E2"
            d="M2 6.2C.9 8.4.9 10.8 2 13l3.3-2.6C4.9 9.5 4.9 8.5 5.3 7.6L2 6.2z"
          />
          <path
            fill="#FBBC05"
            d="M12 4.5c1.5 0 2.8.5 3.8 1.4l2.8-2.8C16.1 1.2 14.2 0.5 12 0.5 7.3 0.5 3.3 2.9 2 6.2l3.3 1.4C6.2 5.2 8.4 4.5 12 4.5z"
          />
        </svg>
      ),
    },
    {
      id: "github",
      label: t("auth.continueGithub"),
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 .5C5.4.5 0 6 0 12.7c0 5.4 3.4 10 8.2 11.6.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1 1.7-.8 1.9-1.2.1-.6.4-1 .7-1.2-2.6-.3-5.3-1.3-5.3-5.9 0-1.3.4-2.3 1.1-3.1-.1-.3-.5-1.5.1-3.2 0 0 .9-.3 3 1.2.8-.2 1.7-.3 2.6-.3s1.8.1 2.6.3c2.1-1.4 3-1.2 3-1.2.6 1.7.2 2.9.1 3.2.7.8 1.1 1.8 1.1 3.1 0 4.6-2.7 5.6-5.3 5.9.4.4.7 1 .7 2v2.9c0 .3.2.7.8.6 4.8-1.6 8.2-6.2 8.2-11.6C24 6 18.6.5 12 .5z"
          />
        </svg>
      ),
    },
  ];

  const handleProvider = (providerId) => {
    // Redirect to OAuth endpoint
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
    window.location.href = `${API_BASE}/api/auth/${providerId}`;
  };

  return (
    <div className={`auth-page auth-split ${isSwapping ? "is-exiting" : ""}`}>
      <div className="auth-shell is-signin" role="main" aria-labelledby="signin-title">
        <section className="auth-panel auth-panel--form">
          <div className="auth-panel__header">
            <div className="auth-brand">
              <div className="auth-logo" aria-hidden>BLK</div>
              <div className="auth-title">
                <h2 id="signin-title">{t("auth.welcomeBack")}</h2>
                <div className="auth-sub">{t("auth.welcomeSub")}</div>
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

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <label className="auth-field">
              <span className="field-label">{t("auth.email")}</span>
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
              <span className="field-label">{t("auth.password")}</span>
              <div className="password-input-container">
                <input
                  className="field-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={`password-toggle ${isDark ? 'dark' : 'light'}`}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t("auth.hidePass") : t("auth.showPass")}
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

            <div className="auth-row">
              <label className="auth-remember">
                <input type="checkbox" defaultChecked /> {t("auth.rememberMe")}
              </label>
              <Link to="/forgot" className="auth-link">{t("auth.forgotPass")}</Link>
            </div>

            {requiresCaptcha && (
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
            )}

            <div className="auth-actions">
              <button type="submit" className="btn primary" disabled={loading}>
                {loading ? t("auth.signingIn") : t("auth.signIn")}
              </button>
              <button type="button" className="btn btn-outline" onClick={swapToSignup} disabled={isSwapping}>
                {t("auth.createAccount")}
              </button>
            </div>
          </form>

          <div className="auth-social-block">
            <small>{t("auth.socialLogin")}</small>
            <div className="auth-social-buttons">
              {socialProviders.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  className="auth-social-btn"
                  onClick={() => handleProvider(provider.id)}
                  disabled={isSwapping}
                >
                  <span className={`auth-social-icon auth-social-icon--${provider.id}`}>{provider.icon}</span>
                  <span>{provider.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="auth-panel auth-panel--preview">
          <p className="auth-eyebrow">{t("auth.newPilot")}</p>
          <h3>{t("auth.forgeIdentity")}</h3>
          <ul className="auth-preview-list">
            <li>{t("auth.feature1")}</li>
            <li>{t("auth.feature2")}</li>
            <li>{t("auth.feature3")}</li>
          </ul>
          <button type="button" className="auth-preview-btn" onClick={swapToSignup} disabled={isSwapping}>
            {t("auth.slideToSignUp")}
          </button>
        </aside>
      </div>
    </div>
  );
}
