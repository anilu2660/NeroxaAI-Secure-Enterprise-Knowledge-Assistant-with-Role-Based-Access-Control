import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
    }),
    react(),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        // Rewrite cookie domain so HttpOnly cookies set by the backend
        // are accepted by the browser when accessed via the Vite dev server.
        cookieDomainRewrite: { "localhost:8000": "localhost" },
        // Don't let the proxy follow 3xx redirects — let the browser handle them
        // so OAuth state cookies on the callback path are preserved correctly.
        followRedirects: false,
      },
    },
  },
});
