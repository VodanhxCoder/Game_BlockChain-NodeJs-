import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute - Redirects based on user role after login
 * - Admins go to /admin
 * - Regular users (players) go to /H (game homepage)
 */
export default function RoleBasedRedirect() {
  const { isAuthenticated, loading, user } = useAuth();

  console.log('[RoleBasedRedirect] loading:', loading, 'isAuthenticated:', isAuthenticated, 'role:', user?.role);

  if (loading) {
    return <div className="splash-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Redirect based on role
  if (user?.role === 'admin') {
    console.log('[RoleBasedRedirect] Admin detected, redirecting to /admin');
    return <Navigate to="/admin" replace />;
  }

  console.log('[RoleBasedRedirect] Player detected, redirecting to /H');
  return <Navigate to="/H" replace />;
}
