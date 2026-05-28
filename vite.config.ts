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

// OG 圖 cache-bust 用：版本字串 + 短 hash，每次 build 都不同，
// 強制 FB / LINE / Twitter CDN 重抓新預覽圖（按 skill og-social-preview-zh §5）
const ogImageVersion = `${pkg.version}-${Date.now().toString(36)}`;

export default defineConfig({
  base: basePath,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  // index.html 內的 __OG_IMAGE_VERSION__ 占位字串，build 時替換成 ogImageVersion
  // 不用 define 是因為 define 只處理 .ts/.tsx 內的 token，不處理 .html
  plugins: [
    {
      name: "og-image-version",
      transformIndexHtml(html) {
        return html.replace(/__OG_IMAGE_VERSION__/g, ogImageVersion);
      },
    },
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
        "opengraph.png",
        "icon-192.png",
        "icon-512.png",
        "icon-512-maskable.png",
        "screenshot-wide.png",
        "screenshot-mobile.png",
        "robots.txt",
        "sitemap.xml",
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
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        // PWA screenshots：Android Chrome / Edge / Samsung Internet 加裝主畫面對話框會顯示
        screenshots: [
          {
            src: "screenshot-wide.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
            label: "3D 迷宮探索 — 桌機 / 平板橫向",
          },
          {
            src: "screenshot-mobile.png",
            sizes: "720x1280",
            type: "image/png",
            form_factor: "narrow",
            label: "3D 迷宮探索 — 手機豎向 + 觸控搖桿",
          },
        ],
        // PWA shortcuts：iOS / Android 長按主畫面 icon 跳出快捷選單
        // 學生可直接跳特定難度進場（搭配 urlParams.ts 已支援的 ?d= 參數）
        shortcuts: [
          {
            name: "簡單難度",
            short_name: "🌱 簡單",
            description: "7×7 迷宮，180 秒，敵人不追擊（適合第一次玩 / 低年級）",
            url: `${basePath}?d=easy`,
            icons: [{ src: "icon-192.png", sizes: "192x192", type: "image/png" }],
          },
          {
            name: "普通難度",
            short_name: "🔥 普通",
            description: "9×9 迷宮，150 秒（預設）",
            url: `${basePath}?d=normal`,
            icons: [{ src: "icon-192.png", sizes: "192x192", type: "image/png" }],
          },
          {
            name: "困難難度",
            short_name: "💀 困難",
            description: "13×13 迷宮，敵人視線追蹤（高年級挑戰）",
            url: `${basePath}?d=hard`,
            icons: [{ src: "icon-192.png", sizes: "192x192", type: "image/png" }],
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
