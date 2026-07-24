import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Standalone config for unit tests — avoids loading the Lovable Vite wrapper
// (which pulls in SSR/Cloudflare plugins unrelated to testing).
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
