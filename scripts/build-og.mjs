import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Windows 內建字型 — 不需另外下載
const FONT_BOLD = "C:\\Windows\\Fonts\\msjhbd.ttc";
const FONT_REG = "C:\\Windows\\Fonts\\msjh.ttc";
const FONT_EMOJI = "C:\\Windows\\Fonts\\seguiemj.ttf";

if (existsSync(FONT_BOLD)) GlobalFonts.registerFromPath(FONT_BOLD, "MsJhBold");
if (existsSync(FONT_REG)) GlobalFonts.registerFromPath(FONT_REG, "MsJh");
if (existsSync(FONT_EMOJI)) GlobalFonts.registerFromPath(FONT_EMOJI, "SegoeEmoji");

const W = 1200;
const H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

// === 底層漸層 ===
const grad = ctx.createLinearGradient(0, 0, W, H);
grad.addColorStop(0, "#0a0a1a");
grad.addColorStop(0.5, "#0d1a2e");
grad.addColorStop(1, "#0a0a1a");
ctx.fillStyle = grad;
ctx.fillRect(0, 0, W, H);

// === 中央放射性光暈 ===
const halo = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 500);
halo.addColorStop(0, "rgba(0,229,255,0.18)");
halo.addColorStop(0.5, "rgba(0,150,255,0.06)");
halo.addColorStop(1, "rgba(0,0,0,0)");
ctx.fillStyle = halo;
ctx.fillRect(0, 0, W, H);

// === 裝飾光球（左上 + 右下）===
function drawOrb(cx, cy, radius, color) {
  const orbGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  orbGrad.addColorStop(0, color);
  orbGrad.addColorStop(0.5, color.replace(/[\d.]+\)/, "0.3)"));
  orbGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}
drawOrb(150, 130, 70, "rgba(0,229,255,0.9)");
drawOrb(1050, 500, 80, "rgba(255,170,0,0.85)");
drawOrb(1080, 110, 50, "rgba(255,51,102,0.7)");

// === 主標題 ===
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.shadowColor = "rgba(0,229,255,0.7)";
ctx.shadowBlur = 30;
ctx.fillStyle = "#00e5ff";
ctx.font = "900 110px MsJhBold, SegoeEmoji, sans-serif";
ctx.fillText("3D 迷宮冒險", W / 2, H / 2 - 75);

ctx.shadowBlur = 0;

// === 副標 ===
ctx.fillStyle = "rgba(220,236,255,0.92)";
ctx.font = "500 34px MsJh, SegoeEmoji, sans-serif";
ctx.fillText("收集光球　・　躲避紅怪　・　與時間賽跑", W / 2, H / 2 + 15);

// === 標籤 ===
ctx.fillStyle = "rgba(255,215,0,0.9)";
ctx.font = "700 26px MsJhBold, SegoeEmoji, sans-serif";
ctx.fillText("🏆 線上排行榜　・　🎮 桌機 + iPad 可玩", W / 2, H / 2 + 75);

// === 作者區塊 ===
ctx.fillStyle = "rgba(180,220,255,0.55)";
ctx.font = "500 22px MsJh, SegoeEmoji, sans-serif";
ctx.fillText(
  "Made with ❤️ by 阿凱老師（桃園市龍潭區石門國民小學）",
  W / 2,
  H - 55,
);

// === 邊框光線 ===
ctx.strokeStyle = "rgba(0,229,255,0.25)";
ctx.lineWidth = 2;
ctx.strokeRect(20, 20, W - 40, H - 40);

// === 輸出 ===
const outDir = path.join(projectRoot, "public");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "opengraph.jpg");
writeFileSync(outPath, canvas.toBuffer("image/jpeg", 90));
console.log(`✅ OG image generated: ${path.relative(projectRoot, outPath)}`);
console.log(`   Size: ${W}×${H}`);
