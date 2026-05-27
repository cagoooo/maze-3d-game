import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outDir = path.join(projectRoot, "public");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const FONT_BOLD = "C:\\Windows\\Fonts\\msjhbd.ttc";
if (existsSync(FONT_BOLD)) GlobalFonts.registerFromPath(FONT_BOLD, "MsJhBold");

function drawIcon(size, outName) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // 圓角矩形背景
  const r = size * 0.22;
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#0a0a1a");
  grad.addColorStop(0.5, "#0d1a2e");
  grad.addColorStop(1, "#0a0a1a");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, r);
  ctx.fill();

  // 內框光環
  const halo = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size * 0.6,
  );
  halo.addColorStop(0, "rgba(0,229,255,0.35)");
  halo.addColorStop(0.6, "rgba(0,150,255,0.08)");
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, r);
  ctx.fill();

  // 中央光球（icon 主視覺）
  const orb = ctx.createRadialGradient(
    size / 2,
    size * 0.45,
    0,
    size / 2,
    size * 0.45,
    size * 0.3,
  );
  orb.addColorStop(0, "rgba(0,229,255,1)");
  orb.addColorStop(0.6, "rgba(0,160,220,0.65)");
  orb.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = orb;
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.45, size * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // 3D 文字
  ctx.fillStyle = "#0a0a1a";
  ctx.shadowColor = "rgba(0,229,255,0.7)";
  ctx.shadowBlur = size * 0.04;
  ctx.font = `900 ${size * 0.22}px MsJhBold, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("3D", size / 2, size * 0.45);
  ctx.shadowBlur = 0;

  // 下方「迷宮」
  ctx.fillStyle = "rgba(0,229,255,0.95)";
  ctx.font = `700 ${size * 0.16}px MsJhBold, sans-serif`;
  ctx.fillText("迷宮", size / 2, size * 0.78);

  // 外框
  ctx.strokeStyle = "rgba(0,229,255,0.45)";
  ctx.lineWidth = size * 0.012;
  ctx.beginPath();
  ctx.roundRect(
    size * 0.04,
    size * 0.04,
    size * 0.92,
    size * 0.92,
    r * 0.85,
  );
  ctx.stroke();

  const outPath = path.join(outDir, outName);
  writeFileSync(outPath, canvas.toBuffer("image/png"));
  console.log(
    `✅ ${outName} generated (${size}×${size}, ${(canvas.toBuffer("image/png").length / 1024).toFixed(1)} KB)`,
  );
}

drawIcon(192, "icon-192.png");
drawIcon(512, "icon-512.png");
// Apple touch icon（不一定要 maskable）
drawIcon(180, "apple-touch-icon.png");
