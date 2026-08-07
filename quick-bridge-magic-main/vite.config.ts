import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { apiDevPlugin } from "./src/lib/vite-api-dev";

export default defineConfig({
  build: {
    outDir: "dist/client",
  },
  plugins: [
    TanStackRouterVite({ routesDirectory: "./src/routes", generatedRouteTree: "./src/routeTree.gen.ts" }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
    apiDevPlugin(),
  ],
  server: {
    host: true,
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      "/__mockup": {
        target: "http://localhost:23636",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
