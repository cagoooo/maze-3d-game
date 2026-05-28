import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
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
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // prompt：偵測到新 SW 後，由 app 自己決定何時呼叫 updateServiceWorker(true)
      // 避免玩家正在玩到一半就被強制 reload；改為在 StartScreen / 結算畫面顯示 banner
      registerType: "prompt",
      // 自己用 useRegisterSW (virtual:pwa-register/react) 註冊，不要 plugin 自動 inject
      injectRegister: false,
      includeAssets: [
        "favicon.svg",
        "apple-touch-icon.png",
        "opengraph.jpg",
        "robots.txt",
      ],
      manifest: {
        name: "3D 迷宮冒險",
        short_name: "迷宮",
        description: "第一人稱 3D 迷宮探索遊戲（阿凱老師 / 石門國小）",
        theme_color: "#0a0a1a",
        background_color: "#0a0a1a",
        display: "standalone",
        orientation: "landscape",
        lang: "zh-TW",
        start_url: basePath,
        scope: basePath,
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,jpg}"],
        // Three.js / R3F chunk 大、設長快取（hashed filename 改動就自動換）
        runtimeCaching: [
          {
            urlPattern: /\/assets\/(three|r3f)-.*\.js$/,
            handler: "CacheFirst",
            options: {
              cacheName: "three-libs",
              expiration: {
                maxEntries: 8,
                maxAgeSeconds: 60 * 60 * 24 * 60,
              },
            },
          },
          {
            urlPattern: /\/audio\/.*\.(mp3|ogg|wav)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "audio",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
        ],
      },
    }),
  ],
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
