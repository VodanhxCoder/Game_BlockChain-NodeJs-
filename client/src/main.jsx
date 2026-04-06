import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./routes/router";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { Web3Provider } from "./context/Web3Context";
import "./assets/css/ui.css";
import "./assets/css/AuthSlider.css";
import axios from 'axios';
import { mapLegacyApiUrl } from './services/backendHosts';

// Configure axios defaults
axios.defaults.withCredentials = true;

// Add a request interceptor to attach the JWT token
axios.interceptors.request.use(
  (config) => {
    if (typeof config.url === 'string') {
      config.url = mapLegacyApiUrl(config.url);
    }
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Add ngrok skip header to bypass warning page
    config.headers['ngrok-skip-browser-warning'] = 'true';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const rootElement = document.getElementById("root");

createRoot(rootElement).render(
  <React.StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <Web3Provider>
            <BrowserRouter>
              <AppRouter />
            </BrowserRouter>
          </Web3Provider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  </React.StrictMode>
);
