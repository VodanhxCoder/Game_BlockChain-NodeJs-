import React, { createContext, useContext, useEffect, useState } from "react";
import { mapLegacyApiUrl } from "../services/backendHosts";

const TOKEN_KEY = "auth_token";
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to set token
  const setToken = (token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      // Trigger re-fetch of user
      fetchUser(token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    }
  };

  const fetchUser = async (token) => {
    try {
      const response = await fetch(mapLegacyApiUrl('/api/auth/me'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const data = await response.json();
      
      if (data.authenticated) {
        setUser(data.user);
      } else {
        // Token invalid or expired
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      }
    } catch (e) {
      console.error('Failed to fetch user:', e);
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Check token on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, recaptchaToken) => {
    try {
      // Regular credential-based login
      const response = await fetch(mapLegacyApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ username: email, passwordHash: password, recaptchaToken }),
      });

      // If Fail2Ban or middleware reports a ban
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
        err.isBanned = true;
        err.remaining = remaining;
        err.ip = data.ip;
        throw err;
      }

      // If account is banned (403 status)
      if (response.status === 403) {
        const errorData = await response.json();
        const err = new Error(errorData.error || 'Account access denied');
        if (errorData.isBanned) {
          err.isBanned = true;
        }
        if (errorData.isInactive) {
          err.isInactive = true;
        }
        throw err;
      }

      if (!response.ok) {
        const errorData = await response.json();
        const err = new Error(errorData.error || 'Login failed');
        if (errorData.requiresCaptcha) {
          err.requiresCaptcha = true;
        }
        throw err;
      }

      const data = await response.json();
      
      if (data.token) {
        setToken(data.token);
        return data.user;
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Optional: Call backend to blacklist token
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        await fetch(mapLegacyApiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setToken(null);
    }
  };

  const register = async ({ name, email, password, username }) => {
    try {
      // Hash the password using SHA-256 (same as login)
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashed = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const response = await fetch(mapLegacyApiUrl('/api/auth/signup'), {
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
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (e) {
          throw new Error('Registration error: Server returned invalid response');
        }
        throw new Error(errorData.error || 'Registration failed');
      }

      const responseData = await response.json();
      
      if (responseData.token) {
        setToken(responseData.token);
        return responseData.user;
      }
    } catch (error) {
      // Error will be displayed to user via UI
      throw error;
    }
  };

  // Keep existing helper functions
  const sendVerificationEmail = async (email, username) => {
    try {
      const response = await fetch(mapLegacyApiUrl('/api/auth/send-verification'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send verification email');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const verifyEmail = async (email, code) => {
    try {
      const response = await fetch(mapLegacyApiUrl('/api/auth/verify-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Email verification failed');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const resendVerificationEmail = async (email) => {
    try {
      const response = await fetch(mapLegacyApiUrl('/api/auth/resend-verification'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend verification email');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const checkAvailability = async (email, username) => {
    try {
      const response = await fetch(mapLegacyApiUrl('/api/auth/check-availability'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check availability');
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser,
      loading, 
      isAuthenticated: !!user, 
      login, 
      logout, 
      register,
      sendVerificationEmail,
      verifyEmail,
      resendVerificationEmail,
      checkAvailability,
      setToken // Export setToken for OAuthCallback
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
