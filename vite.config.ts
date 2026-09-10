import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { cloudflare } from "@cloudflare/vite-plugin";

/**
 * TanStack Start on Cloudflare Workers.
 *
 * The Cloudflare plugin is build-only: in dev it fights Vite's own server, and
 * the site needs nothing from the Workers runtime while developing.
 */
export default defineConfig(({ command }) => ({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    // Route the Worker through src/server.ts (the security-header wrapper).
    tanstackStart({ server: { entry: "server" } }),
    viteReact(),
    ...(command === "build" ? [cloudflare({ viteEnvironment: { name: "ssr" } })] : []),
  ],
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
}));
