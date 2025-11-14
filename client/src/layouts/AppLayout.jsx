import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Menu from "../components/Menu";

export default function AppLayout() {
  const { isAuthenticated, loading, user } = useAuth();

  console.log('[AppLayout] loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', user?.username);

  if (loading) {
    return <div className="splash-screen">Đang tải giao diện...</div>;
  }

  if (!isAuthenticated) {
    console.log('[AppLayout] Not authenticated, redirecting to signin');
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <Menu />
      </aside>
      <main className="app-shell__content">
        <div className="app-shell__backdrop" aria-hidden="true" />
        <Outlet />
      </main>
    </div>
  );
}
