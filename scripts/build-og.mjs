/**
 * OG 社群分享預覽圖生成器（1200×630 PNG）。
 *
 * 視覺：v0.6 Immersive HiFi 風格
 *   - 深底 #06080d + 走廊透視 SVG
 *   - 中央毛玻璃 panel
 *   - Cyan→Mint 漸層大標題「3D 迷宮冒險」
 *   - 等寬眉題「READY TO ENTER · 準備進入」
 *   - 副標 + 角落電影感邊框 + 動態光球裝飾
 *   - 底部署名（阿凱老師 + 石門國小）
 *
 * 字型解析順序（fallback chain）：
 *   1. scripts/fonts/NotoSansTC-*.ttf（可選，commit 後 Linux CI 也能跑 — 目前不存在用 #2/#3）
 *   2. Windows 系統字型（msjhbd.ttc / msjh.ttc）— 開發者本地
 *   3. Linux 系統字型（/usr/share/fonts/...）— Ubuntu CI
 *   4. macOS 系統字型（PingFang TC）
 *
 * 設計參考：skill `og-social-preview-zh` Step 1（字型綁專案不依賴系統）。
 * 目前先保留 Windows 路徑為主，未來搬 CI 再 subset Noto Sans TC 進專案。
 */

import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// ─── 字型 fallback chain ───────────────────────────────────────────────
const FONT_CANDIDATES = {
  bold: [
    path.join(__dirname, "fonts", "NotoSansTC-Bold-Subset.ttf"),
    "C:\\Windows\\Fonts\\msjhbd.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansTC-Bold.ttf",
    "/System/Library/Fonts/PingFang.ttc",
  ],
  regular: [
    path.join(__dirname, "fonts", "NotoSansTC-Regular-Subset.ttf"),
    "C:\\Windows\\Fonts\\msjh.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansTC-Regular.ttf",
    "/System/Library/Fonts/PingFang.ttc",
  ],
  mono: [
    "C:\\Windows\\Fonts\\consola.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    "/System/Library/Fonts/Menlo.ttc",
  ],
  emoji: [
    "C:\\Windows\\Fonts\\seguiemj.ttf",
    "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf",
    "/System/Library/Fonts/Apple Color Emoji.ttc",
  ],
};

function pickFont(candidates) {
  return candidates.find((p) => existsSync(p));
}

const fontBold = pickFont(FONT_CANDIDATES.bold);
const fontRegular = pickFont(FONT_CANDIDATES.regular);
const fontMono = pickFont(FONT_CANDIDATES.mono);
const fontEmoji = pickFont(FONT_CANDIDATES.emoji);

if (fontBold) GlobalFonts.registerFromPath(fontBold, "OgBold");
if (fontRegular) GlobalFonts.registerFromPath(fontRegular, "OgRegular");
if (fontMono) GlobalFonts.registerFromPath(fontMono, "OgMono");
if (fontEmoji) GlobalFonts.registerFromPath(fontEmoji, "OgEmoji");

if (!fontBold || !fontRegular) {
  console.warn(
    "⚠️  找不到繁中字型！中文會變方框（tofu）。請任一：\n" +
      "    (Win)  C:\\Windows\\Fonts\\msjhbd.ttc 應已內建\n" +
      "    (Ubuntu) sudo apt-get install fonts-noto-cjk\n" +
      "    (CI) 為 scripts/fonts/ 加入 subset Noto Sans TC（見 skill og-social-preview-zh）",
  );
}

console.log("[OG] 字型 fallback 選用：");
console.log("  Bold    :", fontBold ?? "(none)");
console.log("  Regular :", fontRegular ?? "(none)");
console.log("  Mono    :", fontMono ?? "(none)");
console.log("  Emoji   :", fontEmoji ?? "(none)");

// ─── Theme tokens（與 src/game/ui/theme.ts 對齊）──────────────────────
const THEME = {
  bgDeep: "#06080d",
  cyan: "#5cd6ff",
  mint: "#7fffd4",
  amber: "#ffd76e",
  red: "#ff5577",
  white: "#ffffff",
  textDim: "rgba(255,255,255,0.6)",
  textFade: "rgba(255,255,255,0.4)",
  border: "rgba(255,255,255,0.12)",
};

// ─── 1200×630 OG image ───────────────────────────────────────────────
const W = 1200;
const H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

// === 底層：深底走廊 ===
ctx.fillStyle = THEME.bgDeep;
ctx.fillRect(0, 0, W, H);

// 中央 radial 光暈（走廊盡頭）
const halo = ctx.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, W * 0.6);
halo.addColorStop(0, "rgba(42,85,119,0.55)");
halo.addColorStop(0.5, "rgba(26,58,92,0.18)");
halo.addColorStop(1, "rgba(0,0,0,0)");
ctx.fillStyle = halo;
ctx.fillRect(0, 0, W, H);

// 牆面三角（透視兩側）
ctx.fillStyle = "#0a1525";
ctx.globalAlpha = 0.95;
// 左牆
ctx.beginPath();
ctx.moveTo(0, 0);
ctx.lineTo(W * 0.4, H * 0.4);
ctx.lineTo(W * 0.4, H * 0.55);
ctx.lineTo(0, H);
ctx.closePath();
ctx.fill();
// 右牆
ctx.beginPath();
ctx.moveTo(W, 0);
ctx.lineTo(W * 0.6, H * 0.4);
ctx.lineTo(W * 0.6, H * 0.55);
ctx.lineTo(W, H);
ctx.closePath();
ctx.fill();
// 天花板
ctx.fillStyle = "#0a1220";
ctx.beginPath();
ctx.moveTo(0, 0);
ctx.lineTo(W, 0);
ctx.lineTo(W * 0.6, H * 0.4);
ctx.lineTo(W * 0.4, H * 0.4);
ctx.closePath();
ctx.fill();
// 地板
ctx.fillStyle = "#0a1525";
ctx.beginPath();
ctx.moveTo(0, H);
ctx.lineTo(W, H);
ctx.lineTo(W * 0.6, H * 0.55);
ctx.lineTo(W * 0.4, H * 0.55);
ctx.closePath();
ctx.fill();
ctx.globalAlpha = 1;

// 透視線（cyan 細線從中央向四角放射）
ctx.strokeStyle = "rgba(92,214,255,0.22)";
ctx.lineWidth = 1;
for (let i = 1; i <= 8; i++) {
  const t = i / 9;
  const k = t * t;
  // 地板網格線
  ctx.beginPath();
  ctx.moveTo(W * 0.4 - W * 0.4 * k, H * 0.55 + (H - H * 0.55) * k);
  ctx.lineTo(W * 0.6 + W * 0.4 * k, H * 0.55 + (H - H * 0.55) * k);
  ctx.stroke();
}

// 走廊盡頭暗門
ctx.fillStyle = THEME.bgDeep;
ctx.fillRect(W * 0.42, H * 0.41, W * 0.16, H * 0.13);
ctx.strokeStyle = "rgba(92,214,255,0.5)";
ctx.lineWidth = 2;
ctx.strokeRect(W * 0.42, H * 0.41, W * 0.16, H * 0.13);

// === 裝飾光球 ===
function drawOrb(cx, cy, r, color) {
  const orbGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.8);
  orbGrad.addColorStop(0, color);
  orbGrad.addColorStop(0.4, color.replace(/,1\)|,0\.\d+\)/g, ",0.45)"));
  orbGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2);
  ctx.fill();
  // 核心
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
  // 高光
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.arc(cx - r * 0.18, cy - r * 0.18, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
}
drawOrb(180, 480, 26, "rgba(92,214,255,1)");
drawOrb(1010, 510, 22, "rgba(92,214,255,1)");
drawOrb(900, 200, 16, "rgba(127,255,212,1)");

// === 中央毛玻璃 panel（背景 80% 透明，inner shadow 模擬 backdrop-blur）===
const panelX = W * 0.08;
const panelY = H * 0.22;
const panelW = W * 0.84;
const panelH = H * 0.62;
const panelR = 6;

ctx.fillStyle = "rgba(10,18,30,0.78)";
roundRect(ctx, panelX, panelY, panelW, panelH, panelR);
ctx.fill();

// inner top highlight
ctx.strokeStyle = "rgba(255,255,255,0.08)";
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(panelX + panelR, panelY + 0.5);
ctx.lineTo(panelX + panelW - panelR, panelY + 0.5);
ctx.stroke();

// 邊框
ctx.strokeStyle = THEME.border;
ctx.lineWidth = 1;
roundRect(ctx, panelX, panelY, panelW, panelH, panelR);
ctx.stroke();

// === Eyebrow 眉題 ===
ctx.fillStyle = THEME.cyan;
ctx.font = `600 22px "OgMono", "OgBold", monospace`;
ctx.textAlign = "left";
ctx.textBaseline = "alphabetic";
const eyebrowY = panelY + 62;
// cyan dot + halo
const dotX = panelX + 56;
ctx.beginPath();
ctx.arc(dotX, eyebrowY - 7, 7, 0, Math.PI * 2);
ctx.fillStyle = THEME.cyan;
ctx.fill();
ctx.shadowColor = THEME.cyan;
ctx.shadowBlur = 16;
ctx.beginPath();
ctx.arc(dotX, eyebrowY - 7, 7, 0, Math.PI * 2);
ctx.fill();
ctx.shadowBlur = 0;
// eyebrow text
ctx.fillStyle = THEME.cyan;
ctx.font = `600 22px "OgMono", "OgBold", monospace`;
const eyebrowText = "READY TO ENTER · 準備進入";
ctx.fillText(eyebrowText, dotX + 22, eyebrowY);

// === 主標題（Cyan → Mint 漸層）===
ctx.font = `900 130px "OgBold", "OgEmoji", sans-serif`;
const titleY = panelY + 218;
const title = "3D 迷宮冒險";
const titleX = panelX + 56;
// 漸層
const titleGrad = ctx.createLinearGradient(titleX, titleY, titleX + 720, titleY);
titleGrad.addColorStop(0, "#ffffff");
titleGrad.addColorStop(0.45, THEME.cyan);
titleGrad.addColorStop(1, THEME.mint);
ctx.fillStyle = titleGrad;
ctx.shadowColor = "rgba(92,214,255,0.35)";
ctx.shadowBlur = 30;
ctx.fillText(title, titleX, titleY);
ctx.shadowBlur = 0;

// === 副標 ===
ctx.fillStyle = "rgba(255,255,255,0.78)";
ctx.font = `400 30px "OgRegular", "OgEmoji", sans-serif`;
const subY = titleY + 56;
ctx.fillText(
  "收集藍色光球　·　避開紅色巡守者　·　越快通關得分越高",
  titleX,
  subY,
);

// === 三標籤 chips ===
const chipY = subY + 60;
const chips = [
  { label: "🎮  WASD + 滑鼠", color: THEME.cyan, bg: "rgba(92,214,255,0.10)" },
  { label: "📱  iPad 觸控搖桿", color: THEME.mint, bg: "rgba(127,255,212,0.10)" },
  { label: "🏆  全班排行榜", color: THEME.amber, bg: "rgba(255,215,110,0.10)" },
];
let chipX = titleX;
ctx.font = `600 22px "OgBold", "OgEmoji", sans-serif`;
for (const c of chips) {
  const w = ctx.measureText(c.label).width + 36;
  // bg
  ctx.fillStyle = c.bg;
  roundRect(ctx, chipX, chipY, w, 44, 3);
  ctx.fill();
  // border
  ctx.strokeStyle = c.color;
  ctx.lineWidth = 1;
  roundRect(ctx, chipX, chipY, w, 44, 3);
  ctx.stroke();
  // text
  ctx.fillStyle = c.color;
  ctx.fillText(c.label, chipX + 18, chipY + 30);
  chipX += w + 12;
}

// === 底部署名 + URL ===
ctx.font = `400 19px "OgRegular", "OgEmoji", sans-serif`;
ctx.fillStyle = THEME.textDim;
ctx.fillText(
  "Made with ❤️ by 阿凱老師（桃園市龍潭區石門國民小學）",
  titleX,
  panelY + panelH - 38,
);

// 右下 URL（等寬）
ctx.font = `600 18px "OgMono", monospace`;
ctx.fillStyle = THEME.cyan;
ctx.textAlign = "right";
ctx.fillText(
  "cagoooo.github.io/maze-3d-game →",
  panelX + panelW - 56,
  panelY + panelH - 38,
);

// === 角落電影感邊框 ===
function corner(x, y, dx, dy) {
  ctx.strokeStyle = "rgba(92,214,255,0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y);
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + dy);
  ctx.stroke();
}
const inset = 28;
const cornerLen = 32;
corner(inset, inset, cornerLen, cornerLen);
corner(W - inset, inset, -cornerLen, cornerLen);
corner(inset, H - inset, cornerLen, -cornerLen);
corner(W - inset, H - inset, -cornerLen, -cornerLen);

// === REC 角標（左上方小字）===
ctx.textAlign = "left";
ctx.font = `600 14px "OgMono", monospace`;
ctx.fillStyle = THEME.red;
ctx.beginPath();
ctx.arc(56, 36, 4, 0, Math.PI * 2);
ctx.fillStyle = THEME.red;
ctx.fill();
ctx.fillStyle = THEME.textFade;
ctx.font = `500 13px "OgMono", monospace`;
ctx.fillText("REC · CORRIDOR_07", 66, 41);

// 右上 FPS
ctx.textAlign = "right";
ctx.fillStyle = THEME.textFade;
ctx.fillText("FPS 60", W - 56, 41);

// 上方中央版本標籤
ctx.textAlign = "center";
ctx.fillStyle = THEME.cyan;
ctx.font = `600 16px "OgMono", monospace`;
ctx.fillText("MAZE.OS", W / 2, 41);

// ─── 輸出 PNG（OG image 用 PNG 對漸層 + 文字邊緣更清晰）────────────
const outDir = path.join(projectRoot, "public");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "opengraph.png");
writeFileSync(outPath, canvas.toBuffer("image/png"));

const stat = canvas.toBuffer("image/png").length;
console.log(
  `✅ OG image generated: ${path.relative(projectRoot, outPath)} (${W}×${H}, ${(stat / 1024).toFixed(1)} KB)`,
);

// ─── 工具：圓角矩形 ───────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
