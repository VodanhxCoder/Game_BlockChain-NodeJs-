import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "app.mock.auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const login = async (email, password) => {
    try {
  const response = await fetch('http://localhost:3000/api/login', {
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

  const logout = () => setUser(null);

  const register = async ({ name, email, password }) => {
    try {
      // Hash the password using SHA-256 (same as login)
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashed = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const response = await fetch('http://localhost:3000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: email, 
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