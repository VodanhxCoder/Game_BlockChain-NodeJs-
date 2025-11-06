import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../assets/css/Homepage.css";
import { useAuth } from "../context/AuthContext";

const items = [
  { key: "home", to: "/H", label: "Home" },
  { key: "shop", to: "/shop", label: "Shop" },
  { key: "inventory", to: "/inventory", label: "Inventory" },
  { key: "leaderboards", to: "/leaderboards", label: "Leaderboards" },
  { key: "settings", to: "/settings", label: "Settings" },
];

export default function Menu() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState({ open: false, label: "", to: "" });

  const openPrompt = (label, to) => setPrompt({ open: true, label, to });
  const closePrompt = () => setPrompt({ open: false, label: "", to: "" });
  const handleSignIn = () => {
    closePrompt();
    navigate("/signin");
  };
  const handleLogout = () => {
    logout();
    navigate("/H");
  };

  return (
    <>
      <nav className="side-menu" aria-label="Main menu">
        <ul className="menu-list">
          {items.map((m) => (
            <li key={m.key}>
              {m.key === "home" || isAuthenticated ? (
                <NavLink to={m.to} className={({ isActive }) => (isActive ? "active" : undefined)}>
                  <span className="menu-label">{m.label}</span>
                </NavLink>
              ) : (
                <NavLink
                  to={m.to}
                  onClick={() => openPrompt(m.label, m.to)}
                  className={({ isActive }) => (isActive ? "active menu-locked" : "menu-locked")}
                >
                  <span className="menu-label">{m.label}</span>
                </NavLink>
              )}
            </li>
          ))}

          {/* removed Sign In / Sign Up from the menu as requested */}
        </ul>

        <div className="menu-footer">
          {isAuthenticated ? (
            <>
              <div className="user">Signed in as <strong>{user.name}</strong></div>
              <button className="btn" onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            <small>Sign in to unlock Shop, Inventory and Settings</small>
          )}
        </div>
      </nav>

      {/* Prompt rendered as page overlay (outside the menu) */}
      {prompt.open && (
        <div className="login-prompt" role="dialog" aria-modal="true" aria-label="Sign in required">
          <div className="prompt-card">
            <h4>Sign in required</h4>
            <p>You must sign in to access <strong>{prompt.label}</strong>.</p>
            <div className="prompt-actions">
              <button className="btn primary" onClick={handleSignIn}>Sign in</button>
              <button className="btn" onClick={closePrompt}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}