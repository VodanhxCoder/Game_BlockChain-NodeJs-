import React from "react";
import { useTheme } from "../context/ThemeContext";
import "../assets/css/oauthLoading.css";

export default function OAuthLoading() {
  const { isDark } = useTheme();

  return (
    <div className="oauth-loading" data-theme={isDark ? "dark" : "light"}>
      <div className="oauth-loading__container">
        <div className="oauth-loading__spinner"></div>
        <h2 className="oauth-loading__title">Completing sign in...</h2>
        <p className="oauth-loading__subtitle">Please wait while we verify your account</p>
      </div>
    </div>
  );
}
