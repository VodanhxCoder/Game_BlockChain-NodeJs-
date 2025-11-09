import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "app.mock.auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [mockUsers, setMockUsers] = useState([
    { id: 1, name: "Alice", email: "alice@example.com", password: "password123" },
    { id: 2, name: "Bob", email: "bob@example.com", password: "hunter2" },
  ]);
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
    const found = mockUsers.find((u) => u.email === email && u.password === password);
    if (!found) throw new Error("Invalid email or password");
    const u = { id: found.id, name: found.name, email: found.email };
    setUser(u);
    return u;
  };

  const logout = () => setUser(null);

  const register = async ({ name, email, password }) => {
    if (!email || !password || !name) throw new Error("Missing fields");
    if (mockUsers.some((u) => u.email === email)) throw new Error("Email already taken");
    const id = (mockUsers[ mockUsers.length - 1 ]?.id || 0) + 1;
    const newUser = { id, name, email, password };
    setMockUsers((s) => [...s, newUser]);
    const publicUser = { id, name, email };
    setUser(publicUser);
    return publicUser;
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout, register, mockUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}