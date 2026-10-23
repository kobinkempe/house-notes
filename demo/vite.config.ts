import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  publicDir: fileURLToPath(new URL("../public", import.meta.url)),
  resolve: { alias: { "@": fileURLToPath(new URL("..", import.meta.url)) } },
  plugins: [react()],
  base: process.env.PORTFOLIO_PUBLIC_BASE || "/",
  build: {
    outDir: process.env.PORTFOLIO_OUTPUT_DIR || "../public-demo-dist",
    emptyOutDir: false,
  },
});
