import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const ADMIN_NAV_ITEMS = [
  { key: "dashboard", to: "/admin", icon: "dashboard", label: "Dashboard" },
  { key: "users", to: "/admin/users", icon: "users", label: "Quản lý tài khoản" },
  { key: "items", to: "/admin/items", icon: "items", label: "Quản lý vật phẩm" },
  { key: "layout", to: "/admin/layout", icon: "layout", label: "Chỉnh layout game" },
];

function Icon({ name }) {
  switch (name) {
    case "dashboard":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
          <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
          <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
          <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "users":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "items":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M20 7h-9M14 17H5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="17" cy="17" r="3" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "layout":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M9 3v18M3 9h6M3 15h6" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "moon":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "sun":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AdminMenu() {
  const { isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  return (
    <nav className="admin-menu">
      <div className="admin-menu__header">
        <h1 className="admin-menu__title">
          <span>🛡️ Admin Panel</span>
          <span className="admin-menu__badge">PRO</span>
        </h1>
        <div style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {isDark ? "Dark" : "Light"}
          </button>
        </div>
      </div>

      {ADMIN_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.key}
          to={item.to}
          end={item.to === "/admin"}
          className={({ isActive }) =>
            `admin-menu__item ${isActive ? "active" : ""}`
          }
        >
          <span className="admin-menu__icon">
            <Icon name={item.icon} />
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}

      <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
        <button
          type="button"
          className="ui-btn ui-btn--primary"
          onClick={handleLogout}
          style={{ width: "100%" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: "0.5rem" }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Đăng xuất
        </button>
      </div>
    </nav>
  );
}
