import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "app.mock.auth";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: 'include'
        });
        const data = await response.json();
        
        console.log('[AuthContext] Session check response:', data);
        
        if (!isMounted) return;
        
        if (data.authenticated) {
          console.log('[AuthContext] Session restored:', data.user.username);
          // Use functional update to ensure batching
          setUser(data.user);
          // Small delay to ensure user state is committed
          setTimeout(() => {
            if (isMounted) {
              setLoading(false);
              console.log('[AuthContext] Loading set to false with user:', data.user.username);
            }
          }, 0);
        } else {
          console.log('[AuthContext] No active session');
          setLoading(false);
        }
      } catch (e) {
        console.error('[AuthContext] Session check failed:', e);
        if (isMounted) setLoading(false);
      }
    };
    
    checkSession();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Debug: track user state changes
  useEffect(() => {
    console.log('[AuthContext] User state changed:', user);
    console.log('[AuthContext] isAuthenticated:', !!user);
  }, [user]);

  // Remove localStorage sync - using session only
  // useEffect(() => {
  //   if (user) {
  //     localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  //     console.log('[AuthContext] User saved to localStorage:', user.username);
  //   } else {
  //     localStorage.removeItem(STORAGE_KEY);
  //     console.log('[AuthContext] User removed from localStorage');
  //   }
  // }, [user]);

  const login = async (email, password, isOAuth = false, oauthUserData = null) => {
    try {
      // Handle OAuth login - user data already provided from callback
      if (isOAuth && oauthUserData) {
        const user = {
          username: oauthUserData.username,
          name: oauthUserData.playername || oauthUserData.username,
          email: oauthUserData.email,
          role: oauthUserData.role,
          status: oauthUserData.status,
          highScore: oauthUserData.highScore || 0,
        };
        setUser(user);
        return user;
      }

      // Regular credential-based login
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, passwordHash: password }),
      });

      // If Fail2Ban or middleware reports a ban, surface a clear message to the UI
      if (response.status === 429) {
        let data = {};
        try { data = await response.json(); } catch (e) { /* ignore parse errors */ }
        const remaining = Number(data.remaining || 0);
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        const human = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        const msg = data && data.error
          ? `${data.error} (${human} remaining)`
          : `Too many failed attempts. Your IP is temporarily banned (${human}).`;
        const err = new Error(msg);
        // attach metadata so callers can react programmatically if they want
        err.isBanned = true;
        err.remaining = remaining;
        err.ip = data.ip;
        throw err;
      }

      if (!response.ok) {
        let errData = {};
        try { errData = await response.json(); } catch (e) {}
        throw new Error(errData.error || 'Invalid email or password');
      }

      const data = await response.json();
      const user = {
        username: data.user.username,
        name: data.user.playername,
        email: data.user.email,
        role: data.user.role,
        status: data.user.status,
        highScore: data.user.highScore,
      };
      setUser(user);
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.error('Logout API failed:', e);
    }
    setUser(null);
  };

  const register = async ({ name, email, password, username }) => {
    try {
      // Hash the password using SHA-256 (same as login)
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashed = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username || email, 
          email: email,
          passwordHash: hashed,
          playername: name 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const responseData = await response.json();
      const user = {
        username: responseData.user.username,
        name: responseData.user.playername,
        email: responseData.user.email,
        role: responseData.user.role,
        status: responseData.user.status,
        highScore: responseData.user.highScore,
      };
      setUser(user);
      return user;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
