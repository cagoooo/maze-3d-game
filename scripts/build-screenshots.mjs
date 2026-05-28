/**
 * PWA manifest screenshots 生成器。
 *
 * 產出兩張：
 *   - screenshot-wide.png    (1280×720, wide form_factor)   — Android Chrome 桌機介面
 *   - screenshot-mobile.png  (720×1280, narrow form_factor) — Android Chrome 手機介面
 *
 * 視覺：模擬「遊戲中」畫面（走廊 + HUD overlay + 中央光球 + 十字準星 + 角標），
 *      與 build-og.mjs / build-icons.mjs 同設計語言（v0.6 Immersive HiFi）。
 *
 * 用途：Chrome / Edge / Samsung Internet 把 PWA 加入主畫面時，安裝對話框會顯示這些
 *      screenshots 讓使用者預覽，提高安裝率。
 *
 * 字型 fallback chain：同 build-og.mjs（subset TTF → Windows → Linux Noto CJK → macOS PingFang）
 *
 * 設計參考：IMPROVEMENTS.md §12.1.2 + Web App Manifest spec `screenshots` 欄位
 */

import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outDir = path.join(projectRoot, "public");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

// ─── 字型 fallback chain（同 build-og.mjs）────────────────────
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
};

function pickFont(arr) {
  return arr.find((p) => existsSync(p));
}

const fontBold = pickFont(FONT_CANDIDATES.bold);
const fontReg = pickFont(FONT_CANDIDATES.regular);
const fontMono = pickFont(FONT_CANDIDATES.mono);

if (fontBold) GlobalFonts.registerFromPath(fontBold, "SsBold");
if (fontReg) GlobalFonts.registerFromPath(fontReg, "SsReg");
if (fontMono) GlobalFonts.registerFromPath(fontMono, "SsMono");

if (!fontBold || !fontReg) {
  console.warn("⚠️  找不到繁中字型，screenshot 內中文會 tofu");
}

const THEME = {
  bgDeep: "#06080d",
  cyan: "#5cd6ff",
  mint: "#7fffd4",
  amber: "#ffd76e",
  red: "#ff5577",
  white: "#ffffff",
  border: "rgba(255,255,255,0.12)",
};

// ─── 主繪圖函式 ──────────────────────────────────────────────
function drawScreenshot(W, H, narrow = false) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // ── 1. 底層深底走廊 ──
  ctx.fillStyle = THEME.bgDeep;
  ctx.fillRect(0, 0, W, H);

  // 中央走廊 radial halo
  const cy = H * 0.5;
  const halo = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, W * 0.6);
  halo.addColorStop(0, "rgba(42,85,119,0.45)");
  halo.addColorStop(0.6, "rgba(26,58,92,0.12)");
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  // 牆面三角（透視兩側）
  const cxL = W * 0.42;
  const cxR = W * 0.58;
  const ceilingY = H * 0.42;
  const floorY = H * 0.58;

  ctx.fillStyle = "#0a1525";
  ctx.globalAlpha = 0.95;
  // 左牆
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(cxL, ceilingY);
  ctx.lineTo(cxL, floorY);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  // 右牆
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(cxR, ceilingY);
  ctx.lineTo(cxR, floorY);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
  // 天花板
  ctx.fillStyle = "#0a1220";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(cxR, ceilingY);
  ctx.lineTo(cxL, ceilingY);
  ctx.closePath();
  ctx.fill();
  // 地板
  ctx.fillStyle = "#0a1525";
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(W, H);
  ctx.lineTo(cxR, floorY);
  ctx.lineTo(cxL, floorY);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // 走廊盡頭暗門
  const doorW = W * 0.12;
  const doorH = H * 0.14;
  ctx.fillStyle = THEME.bgDeep;
  ctx.fillRect(W / 2 - doorW / 2, ceilingY + 4, doorW, doorH);
  ctx.strokeStyle = "rgba(92,214,255,0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(W / 2 - doorW / 2, ceilingY + 4, doorW, doorH);

  // 透視線（cyan）
  ctx.strokeStyle = "rgba(92,214,255,0.2)";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 6; i++) {
    const t = i / 7;
    const k = t * t;
    ctx.beginPath();
    ctx.moveTo(cxL - cxL * k, floorY + (H - floorY) * k);
    ctx.lineTo(cxR + (W - cxR) * k, floorY + (H - floorY) * k);
    ctx.stroke();
  }

  // ── 2. 中央光球（走廊盡頭懸浮）──
  const orbCx = W / 2;
  const orbCy = ceilingY + doorH / 2;
  const orbR = Math.min(W, H) * 0.04;
  const orbHalo = ctx.createRadialGradient(orbCx, orbCy, 0, orbCx, orbCy, orbR * 2.5);
  orbHalo.addColorStop(0, "rgba(127,255,212,0.85)");
  orbHalo.addColorStop(0.35, "rgba(92,214,255,0.5)");
  orbHalo.addColorStop(1, "rgba(92,214,255,0)");
  ctx.fillStyle = orbHalo;
  ctx.beginPath();
  ctx.arc(orbCx, orbCy, orbR * 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = THEME.cyan;
  ctx.beginPath();
  ctx.arc(orbCx, orbCy, orbR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.arc(orbCx - orbR * 0.28, orbCy - orbR * 0.28, orbR * 0.32, 0, Math.PI * 2);
  ctx.fill();

  // ── 3. 額外裝飾光球（側邊） ──
  function decoOrb(cx, cy, r, color) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2);
    g.addColorStop(0, color);
    g.addColorStop(0.5, color.replace(/,1\)$|,\d\.\d+\)$/, ",0.3)"));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  decoOrb(W * 0.18, H * 0.78, Math.min(W, H) * 0.03, "rgba(92,214,255,1)");
  decoOrb(W * 0.82, H * 0.65, Math.min(W, H) * 0.025, "rgba(92,214,255,1)");

  // ── 4. 中央十字準星 ──
  const ccX = W / 2;
  const ccY = H / 2;
  const csz = 18;
  ctx.strokeStyle = "rgba(92,214,255,0.9)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ccX, ccY, 3, 0, Math.PI * 2);
  ctx.stroke();
  // 四向短線
  for (const [dx, dy] of [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ]) {
    ctx.beginPath();
    ctx.moveTo(ccX + dx * 8, ccY + dy * 8);
    ctx.lineTo(ccX + dx * csz, ccY + dy * csz);
    ctx.stroke();
  }

  // ── 5. HUD overlay（上方面板）──
  drawHudPanels(ctx, W, H, narrow);

  // ── 6. 角標 REC + MAZE.OS ──
  ctx.font = `600 ${narrow ? 11 : 12}px "SsMono", monospace`;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  // 左上 red dot + REC
  ctx.fillStyle = THEME.red;
  ctx.beginPath();
  ctx.arc(narrow ? 18 : 26, narrow ? 22 : 26, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText("REC", narrow ? 28 : 36, narrow ? 26 : 30);

  // 右上 MAZE.OS
  ctx.textAlign = "right";
  ctx.fillStyle = THEME.cyan;
  ctx.font = `600 ${narrow ? 11 : 13}px "SsMono", monospace`;
  ctx.fillText("MAZE.OS", W - (narrow ? 18 : 26), narrow ? 26 : 30);

  return canvas;
}

// ─── HUD 面板（依方向不同排版）──
function drawHudPanels(ctx, W, H, narrow) {
  const pad = narrow ? 14 : 22;
  const panelTop = narrow ? 48 : 56;

  if (!narrow) {
    // wide：上方三欄（Score / Timer / Orbs）
    drawPanel(ctx, pad, panelTop, 200, 70, () => {
      eyebrow(ctx, pad + 14, panelTop + 18, THEME.cyan, "SCORE · 得分");
      bigNum(ctx, pad + 14, panelTop + 52, "1,280", THEME.white);
    });
    drawPanel(ctx, W / 2 - 130, panelTop, 260, 70, () => {
      eyebrow(ctx, W / 2 - 116, panelTop + 18, "rgba(255,255,255,0.6)", "TIME · 剩餘時間");
      bigNum(ctx, W / 2 - 116, panelTop + 56, "1:42", "#ffffff", 36, true);
    });
    drawPanel(ctx, W - pad - 200, panelTop, 200, 70, () => {
      eyebrow(ctx, W - pad - 186, panelTop + 18, THEME.cyan, "ORBS · 光球");
      bigNum(ctx, W - pad - 186, panelTop + 52, "8 / 12", THEME.cyan);
    });
    return;
  }

  // narrow（手機豎）：頂部單條 + 底部搖桿提示
  drawPanel(ctx, pad, panelTop, W - pad * 2, 100, () => {
    eyebrow(ctx, pad + 14, panelTop + 16, THEME.cyan, "SCORE · 得分");
    bigNum(ctx, pad + 14, panelTop + 48, "1,280", THEME.white, 24);
    eyebrow(ctx, W / 2 - 24, panelTop + 16, "rgba(255,255,255,0.6)", "TIME");
    bigNum(ctx, W / 2 - 24, panelTop + 48, "1:42", THEME.white, 22, true);
    eyebrow(ctx, W - pad - 80, panelTop + 16, THEME.cyan, "ORBS");
    bigNum(ctx, W - pad - 80, panelTop + 48, "8/12", THEME.cyan, 20);
    // 進度條
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(pad + 14, panelTop + 80, W - pad * 2 - 28, 3);
    const grad = ctx.createLinearGradient(pad + 14, 0, pad + 14 + (W - pad * 2 - 28) * 0.66, 0);
    grad.addColorStop(0, THEME.cyan);
    grad.addColorStop(1, THEME.mint);
    ctx.fillStyle = grad;
    ctx.fillRect(pad + 14, panelTop + 80, (W - pad * 2 - 28) * 0.66, 3);
  });

  // 底部搖桿示意（手機才畫）
  const joyR = 60;
  const joyCx = pad + joyR + 10;
  const joyCy = H - pad - joyR - 30;
  ctx.fillStyle = "rgba(10,18,30,0.6)";
  ctx.beginPath();
  ctx.arc(joyCx, joyCy, joyR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(92,214,255,0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();
  // 內圈手指位置
  ctx.fillStyle = "rgba(92,214,255,0.7)";
  ctx.beginPath();
  ctx.arc(joyCx + 15, joyCy - 10, 24, 0, Math.PI * 2);
  ctx.fill();

  // 右下右半畫面拖曳提示
  ctx.font = `500 11px "SsMono", monospace`;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "right";
  ctx.fillText("← 拖曳 ・ 滑視角 →", W - pad - 10, H - pad - 20);
  ctx.textAlign = "left";
}

function drawPanel(ctx, x, y, w, h, drawContent) {
  ctx.fillStyle = "rgba(10,18,30,0.82)";
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 4);
  ctx.stroke();
  drawContent();
}

function eyebrow(ctx, x, y, color, text) {
  ctx.font = `600 9px "SsMono", monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = "0.3em"; // some renderers ignore but harmless
  ctx.fillText(text, x, y);
}

function bigNum(ctx, x, y, text, color, size = 28, mono = false) {
  ctx.font = `${mono ? '300' : '400'} ${size}px "${mono ? "SsMono" : "SsBold"}", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y);
}

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

// ─── 輸出 ──────────────────────────────────────────────────
const wideCanvas = drawScreenshot(1280, 720, false);
const widePath = path.join(outDir, "screenshot-wide.png");
writeFileSync(widePath, wideCanvas.toBuffer("image/png"));
console.log(
  `✅ screenshot-wide.png  (1280×720, ${(wideCanvas.toBuffer("image/png").length / 1024).toFixed(1)} KB)`,
);

const narrowCanvas = drawScreenshot(720, 1280, true);
const narrowPath = path.join(outDir, "screenshot-mobile.png");
writeFileSync(narrowPath, narrowCanvas.toBuffer("image/png"));
console.log(
  `✅ screenshot-mobile.png (720×1280, ${(narrowCanvas.toBuffer("image/png").length / 1024).toFixed(1)} KB)`,
);
