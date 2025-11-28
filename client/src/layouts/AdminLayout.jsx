import React, { useState, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminMenu from "../components/AdminMenu";
import "../assets/css/admin.css";

export default function AdminLayout() {
  const { isAuthenticated, user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  // Close sidebar when clicking outside (mobile)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return <div className="splash-screen">Đang tải...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Only admins can access admin panel
  if (user?.role !== "admin") {
    console.log('[AdminLayout] Non-admin user detected, redirecting to /H');
    return <Navigate to="/H" replace />;
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="admin-shell">
      {/* Mobile Menu Toggle Button */}
      <button
        className="admin-mobile-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 12h18M3 6h18M3 18h18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Overlay for mobile */}
      <div
        className={`admin-sidebar-overlay ${isSidebarOpen ? "active" : ""}`}
        onClick={closeSidebar}
      />

      <aside className={`admin-shell__sidebar ${isSidebarOpen ? "open" : ""}`}>
        <AdminMenu />
      </aside>
      <main className="admin-shell__content">
        <Outlet />
      </main>
    </div>
  );
}
