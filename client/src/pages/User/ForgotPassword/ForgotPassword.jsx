import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { useTheme } from "../../../context/ThemeContext";
import { useLanguage } from "../../../context/LanguageContext";
import { sanitizeInput } from "../../../utils/sanitizer";
import "../../../assets/css/auth.css";

export default function ForgotPassword() {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    setError("");
    setMessage("");

    if (!captchaToken) {
      setError(t("auth.errorCaptcha") || "Vui lòng hoàn thành CAPTCHA.");
      return;
    }

    const sanitizedEmail = sanitizeInput(email);

    if (!sanitizedEmail) {
      setError(t("auth.errorFillAll") || "Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: sanitizedEmail,
          recaptchaToken: captchaToken
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Có lỗi xảy ra.");
      }

      setMessage(data.message || "Mật khẩu mới đã được gửi đến email của bạn.");
      // Optional: Redirect to login after a few seconds
      setTimeout(() => {
        navigate('/signin');
      }, 5000);

    } catch (err) {
      setError(err.message);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setCaptchaToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-split">
      <div className="auth-shell is-signin" role="main">
        <section className="auth-panel auth-panel--form">
          <div className="auth-panel__header">
            <div className="auth-brand">
              <div className="auth-logo" aria-hidden>BLK</div>
              <div className="auth-title">
                <h2>{t("auth.forgotPass") || "Quên mật khẩu?"}</h2>
                <div className="auth-sub">Nhập thông tin để nhận mật khẩu mới.</div>
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
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error" role="alert">{error}</div>}
            {message && <div className="auth-success" role="alert" style={{color: 'var(--success)', background: 'rgba(0, 255, 0, 0.1)', padding: '10px', borderRadius: '4px', marginBottom: '1rem'}}>{message}</div>}

            <label className="auth-field">
              <span className="field-label">{t("auth.email")}</span>
              <input
                className="field-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <div className="auth-captcha" style={{ margin: "20px 0", display: "flex", justifyContent: "center" }}>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={setCaptchaToken}
                theme={isDark ? "dark" : "light"}
              />
            </div>

            <div className="auth-actions">
              <button type="submit" className="auth-btn auth-btn--primary" disabled={loading}>
                {loading ? "Đang xử lý..." : "Gửi mật khẩu mới"}
              </button>
            </div>

            <div className="auth-footer">
              <Link to="/signin" className="auth-link">
                {t("auth.backToLogin") || "Quay lại đăng nhập"}
              </Link>
            </div>
          </form>
        </section>
        <section className="auth-panel auth-panel--visual">
          <div className="auth-visual-content">
            <h1>Recover Access</h1>
            <p>Securely reset your credentials and get back to the fleet.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
