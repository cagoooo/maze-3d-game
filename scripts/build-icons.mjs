/**
 * PWA / favicon PNG 圖標生成器。
 *
 * 視覺：v0.6 Immersive HiFi 風格（與 favicon.svg 視覺對齊）
 *   - 深底圓角 + 走廊透視底紋
 *   - 中央 cyan 光球 + mint 出口三角
 *   - 192/512/180 三種尺寸（maskable safe area = 80% 中央）
 *
 * 字型 fallback 同 build-og.mjs。
 */

import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outDir = path.join(projectRoot, "public");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const FONT_CANDIDATES = [
  path.join(__dirname, "fonts", "NotoSansTC-Bold-Subset.ttf"),
  "C:\\Windows\\Fonts\\msjhbd.ttc",
  "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
  "/usr/share/fonts/truetype/noto/NotoSansTC-Bold.ttf",
  "/System/Library/Fonts/PingFang.ttc",
];
const fontBold = FONT_CANDIDATES.find((p) => existsSync(p));
if (fontBold) GlobalFonts.registerFromPath(fontBold, "IconBold");
if (!fontBold) {
  console.warn("⚠️  找不到繁中字型，icon 上的「迷宮」字會 tofu。");
}

const THEME = {
  bgGradTop: "#0d1a2e",
  bgGradBottom: "#06080d",
  cyan: "#5cd6ff",
  mint: "#7fffd4",
  white: "#ffffff",
};

function drawIcon(size, outName, { maskable = false } = {}) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // maskable safe area = 中央 80%（PWA spec），所以實際視覺要縮在 inner box 內
  const innerInset = maskable ? size * 0.1 : 0;
  const innerSize = size - innerInset * 2;
  const ix = innerInset;
  const iy = innerInset;

  // maskable 時整面塗滿底色（任意形狀遮罩都安全）
  if (maskable) {
    ctx.fillStyle = THEME.bgGradBottom;
    ctx.fillRect(0, 0, size, size);
  }

  // 圓角矩形深底漸層
  const r = innerSize * (maskable ? 0.18 : 0.22);
  const bgGrad = ctx.createLinearGradient(ix, iy, ix + innerSize, iy + innerSize);
  bgGrad.addColorStop(0, THEME.bgGradTop);
  bgGrad.addColorStop(1, THEME.bgGradBottom);
  ctx.fillStyle = bgGrad;
  roundRect(ctx, ix, iy, innerSize, innerSize, r);
  ctx.fill();

  // 走廊透視（地板梯形 + 透視線）
  const cx = ix + innerSize / 2;
  const floorTopY = iy + innerSize * 0.62;
  const floorBottomY = iy + innerSize * 0.92;
  ctx.fillStyle = "#0a1525";
  ctx.beginPath();
  ctx.moveTo(ix + innerSize * 0.18, floorBottomY);
  ctx.lineTo(ix + innerSize * 0.82, floorBottomY);
  ctx.lineTo(ix + innerSize * 0.62, floorTopY);
  ctx.lineTo(ix + innerSize * 0.38, floorTopY);
  ctx.closePath();
  ctx.fill();

  // 透視線（cyan 細）
  ctx.strokeStyle = "rgba(92,214,255,0.45)";
  ctx.lineWidth = Math.max(0.6, innerSize * 0.004);
  ctx.beginPath();
  ctx.moveTo(ix + innerSize * 0.18, floorBottomY);
  ctx.lineTo(ix + innerSize * 0.38, floorTopY);
  ctx.moveTo(ix + innerSize * 0.82, floorBottomY);
  ctx.lineTo(ix + innerSize * 0.62, floorTopY);
  ctx.moveTo(ix + innerSize * 0.38, floorTopY);
  ctx.lineTo(ix + innerSize * 0.62, floorTopY);
  ctx.stroke();

  // 內框光環（中央發光）
  const haloGrad = ctx.createRadialGradient(
    cx,
    iy + innerSize * 0.42,
    0,
    cx,
    iy + innerSize * 0.42,
    innerSize * 0.5,
  );
  haloGrad.addColorStop(0, "rgba(92,214,255,0.4)");
  haloGrad.addColorStop(0.6, "rgba(92,214,255,0.08)");
  haloGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = haloGrad;
  roundRect(ctx, ix, iy, innerSize, innerSize, r);
  ctx.fill();

  // 中央光球（走廊盡頭懸浮）
  const orbCx = cx;
  const orbCy = iy + innerSize * 0.42;
  const orbR = innerSize * 0.16;
  // 外暈
  const orbHalo = ctx.createRadialGradient(orbCx, orbCy, 0, orbCx, orbCy, orbR * 2.4);
  orbHalo.addColorStop(0, "rgba(127,255,212,0.85)");
  orbHalo.addColorStop(0.35, "rgba(92,214,255,0.5)");
  orbHalo.addColorStop(1, "rgba(92,214,255,0)");
  ctx.fillStyle = orbHalo;
  ctx.beginPath();
  ctx.arc(orbCx, orbCy, orbR * 2.4, 0, Math.PI * 2);
  ctx.fill();
  // 核心
  ctx.fillStyle = THEME.cyan;
  ctx.beginPath();
  ctx.arc(orbCx, orbCy, orbR, 0, Math.PI * 2);
  ctx.fill();
  // 高光
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.arc(orbCx - orbR * 0.28, orbCy - orbR * 0.28, orbR * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // 右上 mint 出口三角
  const triX = ix + innerSize * 0.74;
  const triY = iy + innerSize * 0.12;
  const triSize = innerSize * 0.1;
  ctx.fillStyle = THEME.mint;
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.moveTo(triX, triY);
  ctx.lineTo(triX + triSize, triY + triSize / 2);
  ctx.lineTo(triX, triY + triSize);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // 「3D」字（左下小，避免擋光球）
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = `900 ${innerSize * 0.12}px "IconBold", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("3D", ix + innerSize * 0.14, iy + innerSize * 0.84);

  // 細邊框
  if (!maskable) {
    ctx.strokeStyle = "rgba(92,214,255,0.3)";
    ctx.lineWidth = Math.max(1, innerSize * 0.006);
    roundRect(ctx, ix + 1, iy + 1, innerSize - 2, innerSize - 2, r - 1);
    ctx.stroke();
  }

  const buf = canvas.toBuffer("image/png");
  const outPath = path.join(outDir, outName);
  writeFileSync(outPath, buf);
  console.log(
    `✅ ${outName} generated (${size}×${size}, ${(buf.length / 1024).toFixed(1)} KB)${maskable ? " [maskable]" : ""}`,
  );
}

drawIcon(192, "icon-192.png");
drawIcon(512, "icon-512.png");
drawIcon(180, "apple-touch-icon.png");
// maskable 版（PWA manifest 已宣告 icon-512 為 maskable，所以保留同檔但生成額外 safe 版本）
drawIcon(512, "icon-512-maskable.png", { maskable: true });

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
