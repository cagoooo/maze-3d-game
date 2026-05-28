/**
 * 玩家成績分享卡片生成器（runtime / browser-side）。
 *
 * 玩家通關後在 WinScreen 點「分享成績」→ 用 Canvas 2D API 即時生成 1200×630 PNG
 * （重用 v0.6 Immersive HiFi 視覺語言），透過 Web Share API 分享 / 下載 / 複製連結。
 *
 * 設計與 scripts/build-og.mjs 對齊：相同走廊透視 + 中央毛玻璃 panel + 漸層大標題，
 * 但內容換成「玩家自己的成績」— 暱稱 + 班級 + 分數 + 時間 + 難度 + 排名。
 *
 * 字型策略：依賴 index.html 已載的 Google Fonts（Inter / Noto Sans TC / JetBrains Mono），
 * 生圖前 await document.fonts.ready 確保不會 tofu 或落到 fallback。
 *
 * 設計參考：IMPROVEMENTS.md §12.2.1
 */

import type { Difficulty } from "./difficulty";
import { theme } from "./ui/theme";

export interface ShareCardData {
  nickname: string;
  classCode?: string;
  score: number;
  timeLeft: number;
  elapsed: number; // 通關用時（秒）
  rank: number | null;
  difficulty: Difficulty;
  totalOrbs: number;
}

const W = 1200;
const H = 630;

/** 等所有 webfont 載入完，避免 Canvas fillText fallback 到系統字型 */
async function waitFonts() {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore */
    }
  }
}

/** 主入口：生成 PNG Blob */
export async function generateShareCard(data: ShareCardData): Promise<Blob> {
  await waitFonts();

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context 不可用");

  drawShareCard(ctx, data);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob 失敗"))),
      "image/png",
      0.95,
    );
  });
}

function drawShareCard(ctx: CanvasRenderingContext2D, data: ShareCardData) {
  const { nickname, classCode, score, elapsed, rank, difficulty, totalOrbs } = data;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const elapsedStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // ─── 1. 底層：深底走廊（同 build-og.mjs 視覺）───────────────
  ctx.fillStyle = theme.bgDeep;
  ctx.fillRect(0, 0, W, H);

  // 中央 radial halo（mint 主色，呼應通關成功的情緒）
  const halo = ctx.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, W * 0.6);
  halo.addColorStop(0, "rgba(42,110,88,0.6)");
  halo.addColorStop(0.5, "rgba(26,74,58,0.18)");
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  // 牆面三角（透視兩側）
  ctx.fillStyle = "#0a1525";
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W * 0.4, H * 0.4);
  ctx.lineTo(W * 0.4, H * 0.55);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(W * 0.6, H * 0.4);
  ctx.lineTo(W * 0.6, H * 0.55);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#0a1220";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W * 0.6, H * 0.4);
  ctx.lineTo(W * 0.4, H * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#0a1525";
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(W, H);
  ctx.lineTo(W * 0.6, H * 0.55);
  ctx.lineTo(W * 0.4, H * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // 透視線
  ctx.strokeStyle = "rgba(127,255,212,0.22)"; // mint 色
  ctx.lineWidth = 1;
  for (let i = 1; i <= 8; i++) {
    const t = i / 9;
    const k = t * t;
    ctx.beginPath();
    ctx.moveTo(W * 0.4 - W * 0.4 * k, H * 0.55 + (H - H * 0.55) * k);
    ctx.lineTo(W * 0.6 + W * 0.4 * k, H * 0.55 + (H - H * 0.55) * k);
    ctx.stroke();
  }

  // 中央毛玻璃 panel
  const panelX = W * 0.06;
  const panelY = H * 0.16;
  const panelW = W * 0.88;
  const panelH = H * 0.74;
  ctx.fillStyle = "rgba(10,18,30,0.85)";
  roundRect(ctx, panelX, panelY, panelW, panelH, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(127,255,212,0.25)";
  ctx.lineWidth = 1;
  roundRect(ctx, panelX, panelY, panelW, panelH, 8);
  ctx.stroke();

  // ─── 2. 上方眉題 STAGE CLEAR + 雙光點 ────────────────────
  const eyebrowY = panelY + 60;
  const eyebrowText = "STAGE CLEAR · 通關成功";
  ctx.font = `600 22px "JetBrains Mono", "Inter", monospace`;
  ctx.fillStyle = theme.mint;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(eyebrowText, W / 2, eyebrowY);

  // 雙光點裝飾
  const txtWidth = ctx.measureText(eyebrowText).width;
  ctx.shadowColor = theme.mint;
  ctx.shadowBlur = 12;
  ctx.fillStyle = theme.mint;
  ctx.beginPath();
  ctx.arc(W / 2 - txtWidth / 2 - 18, eyebrowY - 7, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W / 2 + txtWidth / 2 + 18, eyebrowY - 7, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // ─── 3. 玩家暱稱 + 班級 ─────────────────────────────────
  const safeNick = (nickname || "玩家").slice(0, 4);
  ctx.font = `500 38px "Inter", "Noto Sans TC", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.textAlign = "center";
  const nameY = eyebrowY + 50;
  const nameText = classCode ? `${safeNick}・${classCode}` : safeNick;
  ctx.fillText(nameText, W / 2, nameY);

  // ─── 4. 巨大漸層分數（mint→cyan）─────────────────────────
  const scoreY = nameY + 130;
  const scoreStr = score.toLocaleString();
  ctx.font = `200 150px "Inter", "Noto Sans TC", sans-serif`;
  const scoreMetric = ctx.measureText(scoreStr);
  const scoreGradX1 = W / 2 - scoreMetric.width / 2;
  const scoreGradX2 = W / 2 + scoreMetric.width / 2;
  const scoreGrad = ctx.createLinearGradient(scoreGradX1, scoreY, scoreGradX2, scoreY);
  scoreGrad.addColorStop(0, "#ffffff");
  scoreGrad.addColorStop(0.5, theme.mint);
  scoreGrad.addColorStop(1, theme.cyan);
  ctx.fillStyle = scoreGrad;
  ctx.shadowColor = "rgba(127,255,212,0.4)";
  ctx.shadowBlur = 30;
  ctx.fillText(scoreStr, W / 2, scoreY);
  ctx.shadowBlur = 0;

  // 分數說明
  ctx.font = `400 18px "Noto Sans TC", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText("最終分數 · FINAL SCORE", W / 2, scoreY + 36);

  // ─── 5. 三欄統計（時間 / 排名 / 難度）─────────────────────
  const statsY = scoreY + 120;
  const cellW = panelW / 3;
  const cells = [
    {
      label: "ELAPSED",
      zh: "通關時間",
      value: elapsedStr,
      color: theme.cyan,
    },
    {
      label: rank !== null ? "RANK" : "ORBS",
      zh: rank !== null ? "排行榜名次" : "收集光球",
      value: rank !== null ? `#${rank}` : `${totalOrbs}`,
      color: rank !== null ? theme.amber : theme.cyan,
    },
    {
      label: "DIFFICULTY",
      zh: "難度",
      value: `${difficulty.emoji} ${difficulty.label}`,
      color: theme.mint,
    },
  ];
  cells.forEach((c, i) => {
    const cx = panelX + cellW * (i + 0.5);
    // 分隔線
    if (i > 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(panelX + cellW * i, statsY - 25);
      ctx.lineTo(panelX + cellW * i, statsY + 50);
      ctx.stroke();
    }
    // EN label
    ctx.font = `600 12px "JetBrains Mono", monospace`;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.textAlign = "center";
    ctx.fillText(c.label, cx, statsY - 8);
    // value
    ctx.font = `400 38px "Inter", "Noto Sans TC", sans-serif`;
    ctx.fillStyle = c.color;
    ctx.fillText(c.value, cx, statsY + 30);
    // zh label
    ctx.font = `400 13px "Noto Sans TC", sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(c.zh, cx, statsY + 52);
  });

  // ─── 6. 底部 CTA：邀請挑戰 ──────────────────────────────
  ctx.font = `500 18px "Noto Sans TC", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "center";
  ctx.fillText("你也來挑戰看看 ↓", W / 2, H - 76);

  ctx.font = `600 22px "JetBrains Mono", monospace`;
  ctx.fillStyle = theme.cyan;
  ctx.fillText("cagoooo.github.io/maze-3d-game", W / 2, H - 48);

  // ─── 7. 角落電影感邊框 ─────────────────────────────────
  ctx.strokeStyle = "rgba(127,255,212,0.5)";
  ctx.lineWidth = 1.5;
  const inset = 28;
  const cornerLen = 32;
  // 四角
  for (const [x, y, dx, dy] of [
    [inset, inset, cornerLen, cornerLen],
    [W - inset, inset, -cornerLen, cornerLen],
    [inset, H - inset, cornerLen, -cornerLen],
    [W - inset, H - inset, -cornerLen, -cornerLen],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + dy);
    ctx.stroke();
  }

  // ─── 8. 左上 + 右上小字 ────────────────────────────────
  ctx.font = `500 13px "JetBrains Mono", monospace`;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "left";
  // 左上 mint dot + SHARED
  ctx.fillStyle = theme.mint;
  ctx.beginPath();
  ctx.arc(56, 36, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText("SHARED · 成績卡片", 66, 41);

  // 右上 MAZE.OS
  ctx.textAlign = "right";
  ctx.fillStyle = theme.mint;
  ctx.font = `600 14px "JetBrains Mono", monospace`;
  ctx.fillText("MAZE.OS", W - 56, 41);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

// ─── Web Share API 包裝 + fallback ─────────────────────────────

export interface ShareResult {
  /** "share" = Web Share API 成功；"download" = 下載到本地；"copy" = 連結已複製到剪貼簿；"cancelled" = 使用者取消 */
  kind: "share" | "download" | "copy" | "cancelled";
  /** 公開遊戲 URL（不含玩家資訊，給按複製用）*/
  shareUrl: string;
}

const SHARE_URL = "https://cagoooo.github.io/maze-3d-game/";

function buildShareText(data: ShareCardData): string {
  const safeNick = (data.nickname || "玩家").slice(0, 4);
  const minutes = Math.floor(data.elapsed / 60);
  const seconds = data.elapsed % 60;
  const elapsedStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const rankStr = data.rank !== null ? ` · 排行榜第 ${data.rank} 名` : "";
  return `${safeNick} 在「3D 迷宮冒險」拿到 ${data.score.toLocaleString()} 分（${elapsedStr}, ${data.difficulty.label}）${rankStr} ✨\n你也來挑戰：${SHARE_URL}`;
}

/**
 * 嘗試（依序）：Web Share API 分享圖+文 → 下載 PNG → 複製連結
 */
export async function shareScoreCard(data: ShareCardData): Promise<ShareResult> {
  const blob = await generateShareCard(data);
  const safeNick = (data.nickname || "player").slice(0, 4).replace(/[^a-zA-Z0-9一-龥]/g, "");
  const fileName = `maze-${safeNick}-${data.score}.png`;
  const text = buildShareText(data);

  // 路線 A：Web Share API + 檔案
  if (typeof navigator !== "undefined" && navigator.canShare && navigator.share) {
    try {
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "3D 迷宮冒險 — 我的成績",
          text,
          url: SHARE_URL,
          files: [file],
        });
        return { kind: "share", shareUrl: SHARE_URL };
      }
    } catch (err) {
      const e = err as Error;
      // AbortError = 使用者取消（不是錯誤）
      if (e.name === "AbortError") return { kind: "cancelled", shareUrl: SHARE_URL };
      console.warn("[share] Web Share API failed, fallback to download:", e);
    }
  }

  // 路線 B：下載 PNG + 複製文字到剪貼簿
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    // 順便複製分享文字到剪貼簿
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        /* clipboard 權限不足無所謂 */
      }
    }
    return { kind: "download", shareUrl: SHARE_URL };
  } catch (e) {
    console.warn("[share] download failed:", e);
  }

  // 路線 C：最後 fallback 只複製連結
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(SHARE_URL);
  }
  return { kind: "copy", shareUrl: SHARE_URL };
}

/** 只複製遊戲連結（不下載圖）— 給「複製連結」按鈕用 */
export async function copyShareLink(): Promise<boolean> {
  if (!navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(SHARE_URL);
    return true;
  } catch {
    return false;
  }
}
