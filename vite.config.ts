import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { readFileSync } from "fs";

// GitHub Pages 部署：repo 模式下 basePath 是 "/<repo-name>/"
// 本地 dev / root domain 部署是 "/"
const basePath = process.env.BASE_PATH ?? "/";
const port = Number(process.env.PORT) || 5173;

// 把 package.json 的 version 注入給前端用（HUD / StartScreen 顯示）
const pkg = JSON.parse(readFileSync(path.resolve(import.meta.dirname, "package.json"), "utf-8"));

export default defineConfig({
  base: basePath,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
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
