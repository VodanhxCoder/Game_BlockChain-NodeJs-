import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

/**
 * Wrap protected pages with <ProtectedPrompt> so:
 * - Route navigation still occurs
 * - If user is NOT authenticated, a prompt modal appears on top of the page
 * - User can close the prompt and remain on the page, or go to /signin
 */
export default function ProtectedPrompt({ children, label = "this page" }) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) setOpen(true);
    else setOpen(false);
  }, [isAuthenticated]);

  return (
    <>
      {/* render the page content regardless */}
      {children}

      {/* overlay prompt when not authenticated */}
      {open && (
        <div className="login-prompt" role="dialog" aria-modal="true" aria-label="Sign in required">
          <div className="prompt-card">
            <h4>Sign in required</h4>
            <p>You must sign in to access <strong>{label}</strong>.</p>
            <div className="prompt-actions">
              <button className="btn primary" onClick={() => navigate("/signin")}>Sign in</button>
              <button className="btn" onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}