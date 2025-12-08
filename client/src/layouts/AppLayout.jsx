import React, { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Menu from "../components/Menu";

export default function AppLayout() {
  const { isAuthenticated, loading, user } = useAuth();
  const [isMenuHidden, setIsMenuHidden] = useState(false);

  console.log('[AppLayout] loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', user?.username);

  if (loading) {
    return <div className="splash-screen">Đang tải giao diện...</div>;
  }

  if (!isAuthenticated) {
    console.log('[AppLayout] Not authenticated, redirecting to signin');
    return <Navigate to="/signin" replace />;
  }

  // If user is admin, redirect to admin panel
  if (user?.role === 'admin') {
    console.log('[AppLayout] Admin detected, redirecting to /admin');
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className={`app-shell ${isMenuHidden ? 'app-shell--menu-hidden' : ''}`}>
      {!isMenuHidden && (
        <aside className="app-shell__sidebar">
          <Menu onToggleMenu={() => setIsMenuHidden(!isMenuHidden)} />
        </aside>
      )}
      <main className="app-shell__content">
        {isMenuHidden && (
          <button 
            className="menu-toggle-btn"
            onClick={() => setIsMenuHidden(false)}
            title="Hiện menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </button>
        )}
        <div className="app-shell__backdrop" aria-hidden="true" />
        <Outlet />
      </main>
    </div>
  );
}
