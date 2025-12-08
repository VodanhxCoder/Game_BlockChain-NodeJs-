import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "app.mock.auth";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
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
        
        if (!isMounted) return;
        
        if (data.authenticated) {
          setUser(data.user);
          setTimeout(() => {
            if (isMounted) {
              setLoading(false);
            }
          }, 0);
        } else {
          setLoading(false);
        }
      } catch (e) {
        // Session check failed - proceed without session (silent fail)
        if (isMounted) setLoading(false);
      }
    };
    
    checkSession();
    
    return () => {
      isMounted = false;
    };
  }, []);

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
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email, passwordHash: password }),
        });
      } catch (fetchError) {
        // Handle network errors (server not running, connection refused, etc.)
        if (fetchError.message.includes('Failed to fetch') || fetchError.name === 'TypeError') {
          throw new Error('Unable to connect to server.');
        }
        throw new Error('Server connection error');
      }

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
        try { 
          errData = await response.json(); 
        } catch (e) {
          // If can't parse JSON, provide a generic error message
          throw new Error('Login error: Server returned invalid response');
        }
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
        walletAddress: data.user.walletAddress || null,
      };
      setUser(user);
      return user;
    } catch (error) {
      // Error will be displayed to user via UI
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
      // Logout failed on server, but clear local state anyway
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

      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: username || email, 
            email: email,
            passwordHash: hashed,
            playername: name 
          }),
        });
      } catch (fetchError) {
        // Handle network errors
        if (fetchError.message.includes('Failed to fetch') || fetchError.name === 'TypeError') {
          throw new Error('Unable to connect to server. Please check your connection or start the server.');
        }
        throw new Error('Server connection error');
      }

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
      // Error will be displayed to user via UI
      throw error;
    }
  };

  const sendVerificationEmail = async (email, username) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-verification`, {
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
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
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
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
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
      const response = await fetch(`${API_BASE_URL}/api/auth/check-availability`, {
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
      checkAvailability
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
