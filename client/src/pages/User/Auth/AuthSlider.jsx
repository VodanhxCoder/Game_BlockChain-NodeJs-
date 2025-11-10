// Combines sign-in/sign-up flows with theme toggling inside a single slider-styled portal.
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";

export default function AuthSlider() {
  const auth = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const initial = location.pathname.includes("signup") ? "signup" : "signin";

  const [mode, setMode] = useState(initial); // "signin" | "signup"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // signin fields
  const [siEmail, setSiEmail] = useState("");
  const [siPass, setSiPass] = useState("");

  // signup fields
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPass, setSuPass] = useState("");

  useEffect(() => setMode(initial), [initial]);
  useEffect(() => {
    if (auth?.isAuthenticated) navigate("/H", { replace: true });
  }, [auth?.isAuthenticated, navigate]);

  const submitSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await auth.login(siEmail.trim(), siPass);
      navigate("/H", { replace: true });
    } catch (err) {
      setError(err?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const submitSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await auth.register({ name: suName.trim(), email: suEmail.trim(), password: suPass });
      navigate("/H", { replace: true });
    } catch (err) {
      setError(err?.message || "Tạo tài khoản thất bại");
    } finally {
      setLoading(false);
    }
  };

  const autofill = (user) => {
    setSiEmail(user.email);
    setSiPass(user.password);
    setSuEmail(user.email);
  };

  const toggleMode = () => setMode((prev) => (prev === "signup" ? "signin" : "signup"));

  return (
    <div className={`as-portal ${mode === "signup" ? "is-signup" : "is-signin"}`} role="main">
      <div className="as-portal__glow" aria-hidden="true" />
      <div className="as-card">
        <header className="as-card__header">
          <div className="as-brand">
            <div className="as-logo">BLK</div>
            <div>
              <h1>BlockVerse</h1>
              <p>Blockchain arcade platform</p>
            </div>
          </div>
          <button
            type="button"
            className="as-theme-toggle"
            aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
            onClick={toggleTheme}
          >
            {isDark ? "☾" : "☀"}
          </button>
        </header>

        <div className="as-columns">
          <section className="as-panel" aria-labelledby="signin-title">
            <div>
              <p className="as-eyebrow">Đã có tài khoản</p>
              <h2 id="signin-title">Đăng nhập để tiếp tục</h2>
            </div>
            <form className="as-form" onSubmit={submitSignIn} noValidate>
              {error && <div className="as-error" role="alert">{error}</div>}
              <input
                className="as-input"
                value={siEmail}
                onChange={(e) => setSiEmail(e.target.value)}
                type="email"
                placeholder="Email"
                required
              />
              <input
                className="as-input"
                value={siPass}
                onChange={(e) => setSiPass(e.target.value)}
                type="password"
                placeholder="Mật khẩu"
                required
              />
              <div className="as-actions">
                <button className="as-btn as-btn--primary" type="submit" disabled={loading}>
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
                </button>
                <button type="button" className="as-btn as-btn--ghost" onClick={() => setMode("signup")}>
                  Tạo tài khoản
                </button>
              </div>
            </form>

            {auth?.mockUsers?.length ? (
              <div className="as-mock">
                <small>Tài khoản mẫu</small>
                <div className="as-mock-list">
                  {auth.mockUsers.map((u) => (
                    <button key={u.email} className="as-chip" type="button" onClick={() => autofill(u)}>
                      {u.email}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="as-panel" aria-labelledby="signup-title">
            <div>
              <p className="as-eyebrow">Người chơi mới</p>
              <h2 id="signup-title">Tạo tài khoản 10 giây</h2>
            </div>
            <form className="as-form" onSubmit={submitSignUp} noValidate>
              <input
                className="as-input"
                value={suName}
                onChange={(e) => setSuName(e.target.value)}
                type="text"
                placeholder="Họ tên"
                required
              />
              <input
                className="as-input"
                value={suEmail}
                onChange={(e) => setSuEmail(e.target.value)}
                type="email"
                placeholder="Email"
                required
              />
              <input
                className="as-input"
                value={suPass}
                onChange={(e) => setSuPass(e.target.value)}
                type="password"
                placeholder="Mật khẩu"
                required
              />
              <div className="as-actions">
                <button className="as-btn as-btn--primary" type="submit" disabled={loading}>
                  {loading ? "Đang xử lý..." : "Tạo tài khoản"}
                </button>
                <button type="button" className="as-btn as-btn--ghost" onClick={() => setMode("signin")}>
                  Đã có tài khoản
                </button>
              </div>
            </form>
          </section>
        </div>

        <aside className="as-visual" aria-hidden="true">
          <div className="as-visual__content">
            <p className="as-eyebrow">{mode === "signup" ? "Gia nhập phi đội" : "Chào mừng trở lại"}</p>
            <h3>{mode === "signup" ? "Nhận NFT starter pack ngay" : "Sẵn sàng chiến đấu"}</h3>
            <p>
              {mode === "signup"
                ? "Kết nối ví, nhận skin khởi đầu và mở kho đồ đa chuỗi."
                : "Đồng bộ kho đồ, tiếp tục hành trình săn boss và leo rank."}
            </p>
            <button
              type="button"
              className="as-visual__toggle"
              aria-pressed={mode === "signup"}
              onClick={toggleMode}
            >
              {mode === "signup" ? "Chuyển sang đăng nhập" : "Chuyển sang đăng ký"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
