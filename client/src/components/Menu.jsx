import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

const NAV_ITEMS = [
  { key: "home", to: "/H", icon: "home", public: true },
  { key: "shop", to: "/shop", icon: "shop" },
  { key: "inventory", to: "/inventory", icon: "inventory" },
  { key: "leaderboards", to: "/leaderboards", icon: "leaderboard" },
  { key: "settings", to: "/settings", icon: "settings" },
];

function Icon({ name }) {
  switch (name) {
    case "home":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M3 11L12 3l9 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 10v10h14V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "shop":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M4 7h16l-2 11H6L4 7z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 11v4m4-4v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M9 4h6l1 3H8l1-3z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "inventory":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9 6v12m6-12v12" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4 10h16" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "leaderboard":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M6 10h3v9H6zM15 5h3v14h-3zM10.5 13h3v6h-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case "settings":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.5 1.65 1.65 0 0 0-1.82.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.5-1 1.65 1.65 0 0 0-.32-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.5 1.65 1.65 0 0 0 1.82-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.26 1.3.73 1.77.47.47 1.11.73 1.77.73H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.5 1z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

export default function Menu() {
  const { isAuthenticated, user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(null);
  const displayName = user?.name?.trim() || user?.username || user?.email || "";
  const displayEmail = user?.email || user?.username || "";

  const handleLogout = () => {
    logout();
    navigate("/H");
  };

  const requireAuth = (event, item) => {
    if (!item.public && !isAuthenticated) {
      event.preventDefault();
      setPrompt(item);
    }
  };

  return (
    <>
      <nav className="menu-panel" aria-label="Main navigation">
        <div className="menu-panel__top">
          <div className="menu-user" aria-live="polite">
            {isAuthenticated ? (
              <>
                <strong>{displayName}</strong>
                <small>{displayEmail}</small>
              </>
            ) : (
              <>
                <strong>{t("menu.guest")}</strong>
                <small>{t("menu.locked")}</small>
              </>
            )}
          </div>
          <div className="menu-action-bar">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={t("menu.theme")}
              title={t("menu.theme")}
            >
              {isDark ? "☾" : "☀"}
            </button>
            <button
              type="button"
              className="theme-toggle theme-toggle--lang"
              onClick={toggleLanguage}
              aria-label={t("menu.language")}
              title={t("menu.language")}
            >
              {lang === "vi" ? "VI" : "EN"}
            </button>
          </div>
        </div>

        <div className="menu-divider" />

        <div className="menu-panel__scroll">
          <ul className="menu-items">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => ["menu-link", isActive ? "is-active" : ""].filter(Boolean).join(" ")}
                  data-locked={!item.public && !isAuthenticated}
                  onClick={(event) => requireAuth(event, item)}
                >
                  <span className="menu-link__icon">
                    <Icon name={item.icon} />
                  </span>
                  <span className="menu-link__meta">
                    <span className="menu-link__label">{t(`nav.${item.key}.label`)}</span>
                    <span className="menu-link__hint">{t(`nav.${item.key}.hint`)}</span>
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="menu-footer">
          {isAuthenticated ? (
            <button type="button" className="ui-btn ui-btn--primary menu-footer__cta" onClick={handleLogout}>
              {t("menu.signOut")}
            </button>
          ) : (
            <div className="menu-footer__guest">
              <small>{t("menu.locked")}</small>
              <div className="menu-footer__actions">
                <button type="button" className="ui-btn ui-btn--primary" onClick={() => navigate("/signin")}>
                  {t("menu.signIn")}
                </button>
                <button type="button" className="ui-btn ui-btn--ghost" onClick={() => navigate("/signup")}>
                  {t("menu.signUp")}
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {prompt && (
        <div className="auth-prompt" role="dialog" aria-modal="true" aria-label={t("auth.promptTitle")}>
          <div className="auth-prompt__card">
            <h3>{t("auth.promptTitle")}</h3>
            <p>
              {t("auth.promptDescription")} <strong>{t(`nav.${prompt.key}.label`)}</strong>.
            </p>
            <div className="auth-prompt__actions">
              <button type="button" className="ui-btn ui-btn--primary" onClick={() => navigate("/signin")}>
                {t("auth.signInCta")}
              </button>
              <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setPrompt(null)}>
                {t("auth.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
