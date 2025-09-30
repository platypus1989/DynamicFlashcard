import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    // Only load Replit plugins if in Replit environment
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [
          // Dynamically import Replit-specific plugins
          (async () => {
            try {
              const { cartographer } = await import("@replit/vite-plugin-cartographer");
              return cartographer();
            } catch {
              return null;
            }
          })(),
          (async () => {
            try {
              const { devBanner } = await import("@replit/vite-plugin-dev-banner");
              return devBanner();
            } catch {
              return null;
            }
          })(),
          (async () => {
            try {
              const runtimeErrorOverlay = await import("@replit/vite-plugin-runtime-error-modal");
              return runtimeErrorOverlay.default();
            } catch {
              return null;
            }
          })(),
        ].filter(Boolean)
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
