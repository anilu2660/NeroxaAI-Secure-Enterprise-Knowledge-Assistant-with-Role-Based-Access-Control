import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target =
    env["VITE_API_URL"] ||
    env["VITE_API_BASE_URL"] ||
    env["BACKEND_URL"] ||
    "http://localhost:8000";

  return {
    plugins: [
      TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      react(),
    ],
    server: {
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
          // Rewrite cookie domain so HttpOnly cookies set by the backend
          // are accepted by the browser when accessed via the Vite dev server.
          cookieDomainRewrite: { [target.replace(/^https?:\/\//, "")]: "localhost" },
          // Don't let the proxy follow 3xx redirects — let the browser handle them
          // so OAuth state cookies on the callback path are preserved correctly.
          followRedirects: false,
        },
      },
    },
  };
});
