import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// GitHub Pages 部署：repo 模式下 basePath 是 "/<repo-name>/"
// 本地 dev / root domain 部署是 "/"
const basePath = process.env.BASE_PATH ?? "/";
const port = Number(process.env.PORT) || 5173;

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          r3f: ["@react-three/fiber", "@react-three/drei"],
        },
      },
    },
  },
  server: {
    port,
    host: true,
  },
  preview: {
    port,
    host: true,
  },
});
