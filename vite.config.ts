import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy any /api requests to the hosted API to avoid CORS during local dev
      // Browser -> Vite dev server (same origin) -> proxied to hosted API
      '/api': {
        target: 'https://motofix-admin-dashboard.onrender.com',
        changeOrigin: true,
        secure: true,
        ws: false,
      },
      // Proxy admin endpoints as well so frontend calls like `/admin/mechanics` are forwarded
      // to the live backend during local development.
      '/admin': {
        target: 'https://motofix-admin-dashboard.onrender.com',
        changeOrigin: true,
        secure: true,
        ws: false,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
