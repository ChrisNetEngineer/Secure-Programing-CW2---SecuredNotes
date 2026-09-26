import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function contentSecurityPolicy(isDev) {
  const directives = [
    "default-src 'self'",
    // Vite HMR injects an inline module script; production builds do not.
    isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self'",
    isDev ? "style-src 'self' 'unsafe-inline'" : "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    isDev ? "connect-src 'self' ws: wss:" : "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "script-src-attr 'none'",
  ];

  return directives.join("; ");
}

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  const headers = {
    "Content-Security-Policy": contentSecurityPolicy(isDev),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
  };

  return {
    plugins: [react()],
    server: {
      headers,
      proxy: {
        "/api": "http://localhost:3000",
      },
    },
    preview: {
      headers,
    },
  };
});
