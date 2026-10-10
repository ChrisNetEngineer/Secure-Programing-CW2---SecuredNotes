import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  preview: {
    port: 5174,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
