/**
 * Chunk error 自癒模組。
 *
 * Vite 用 content hash 命名 chunk（例 `assets/index-Abc123.js`）。每次 build 都換新 hash。
 * 使用者瀏覽器卡舊版 SPA 載入時記住的 chunk URL，在新 deploy 後 404 →
 * 動態 import() throw `TypeError: Failed to fetch dynamically imported module` →
 * 預設會被 ErrorBoundary 接住顯示「發生錯誤」嚇到使用者。
 *
 * 本模組偵測這類錯誤 → 自動清 SW + cache + reload，使用者下次自動拿新版，無需手動清快取。
 *
 * 三層自癒架構（缺一不可，會在不同情境踩到）：
 *   1. SW 不 precache index.html（vite-plugin-pwa 預設行為已處理）
 *   2. window 'error' / 'unhandledrejection' 全域 listener  ← 本模組
 *   3. ErrorBoundary 內也接 chunk error 後委派 recoverFromChunkError ← ErrorBoundary.tsx
 *
 * 防無限循環：sessionStorage flag 標記已試過 reload，若 reload 後仍 chunk error 則不再自動 reload
 * 而是讓 ErrorBoundary fallback UI 顯示給使用者，提示手動處理。
 *
 * 設計參考：skill `vite-chunk-hash-pwa-self-heal`、`pwa-cache-bust`
 */

const RELOAD_FLAG = "maze_chunk_reload_attempted";

const CHUNK_ERR_PATTERN =
  /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|error loading dynamically imported module/i;

export function isChunkError(message: string | undefined | null): boolean {
  if (!message) return false;
  return CHUNK_ERR_PATTERN.test(message);
}

let recoveryInFlight = false;

export async function recoverFromChunkError(reason: string): Promise<void> {
  if (recoveryInFlight) return;
  recoveryInFlight = true;

  // 已試過自癒仍失敗 → 放棄讓 ErrorBoundary fallback UI 接手
  try {
    if (sessionStorage.getItem(RELOAD_FLAG) === "1") {
      console.warn("[chunk-recovery] 已試過自癒仍失敗，放棄:", reason);
      recoveryInFlight = false;
      return;
    }
    sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    /* sessionStorage 不可用（無痕 / 配額滿）→ 仍然嘗試一次 reload */
  }

  console.warn("[chunk-recovery] 偵測到舊 chunk 404，自癒中...", reason);

  showRecoveryToast();

  // 1. unregister 所有 SW（防舊 SW 又從 cache 回傳舊 chunk URL）
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister().catch(() => false)));
    }
  } catch (e) {
    console.warn("[chunk-recovery] unregister SW 失敗:", e);
  }

  // 2. 清所有 Cache Storage
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
    }
  } catch (e) {
    console.warn("[chunk-recovery] 清 cache 失敗:", e);
  }

  // 3. 1.2 秒後 reload 讓 toast 一閃可見
  setTimeout(() => window.location.reload(), 1200);
}

function showRecoveryToast() {
  if (typeof document === "undefined") return;
  if (document.getElementById("maze-chunk-toast")) return;
  const toast = document.createElement("div");
  toast.id = "maze-chunk-toast";
  toast.style.cssText = [
    "position:fixed",
    "left:50%",
    "top:32px",
    "transform:translateX(-50%)",
    "z-index:9999",
    "padding:14px 22px",
    "background:rgba(10,18,30,0.95)",
    "backdrop-filter:blur(24px) saturate(140%)",
    "-webkit-backdrop-filter:blur(24px) saturate(140%)",
    "border:1px solid rgba(92,214,255,0.45)",
    "border-radius:6px",
    'color:#fff',
    'font-family:"Inter","Noto Sans TC",sans-serif',
    "font-size:13px",
    "letter-spacing:0.05em",
    "box-shadow:0 0 30px rgba(92,214,255,0.35), 0 20px 60px rgba(0,0,0,.55)",
    "display:flex",
    "align-items:center",
    "gap:10px",
    "max-width:92vw",
  ].join(";");
  toast.innerHTML =
    '<span style="color:#5cd6ff;font-weight:600;font-size:14px;">⟳</span>' +
    '<span style="display:flex;flex-direction:column;gap:2px;">' +
    '<span style="font-family:\'JetBrains Mono\',monospace;font-size:9px;color:#5cd6ff;letter-spacing:0.35em;text-transform:uppercase;">UPDATING · 同步更新</span>' +
    '<span>正在載入最新版本...</span>' +
    "</span>";
  document.body.appendChild(toast);
}

/**
 * 在 app 啟動最早期呼叫一次。主要在 main.tsx 內 createRoot 之前。
 *
 * `useCapture: true` 確保即使元件內 catch 我們也能在 capture phase 先看到。
 */
export function installChunkErrorHandler(): void {
  if (typeof window === "undefined") return;
  if ((window as { __mazeChunkHandlerInstalled?: boolean }).__mazeChunkHandlerInstalled) return;
  (window as { __mazeChunkHandlerInstalled?: boolean }).__mazeChunkHandlerInstalled = true;

  const handler = (event: ErrorEvent | PromiseRejectionEvent) => {
    let message: string | undefined;
    if ("reason" in event) {
      const reason = event.reason;
      message = typeof reason === "string" ? reason : reason?.message ?? String(reason);
    } else {
      message = event.message;
    }
    if (isChunkError(message)) {
      void recoverFromChunkError(message ?? "unknown");
    }
  };

  window.addEventListener("error", handler, true);
  window.addEventListener("unhandledrejection", handler);
}

/** 進入正常頁面後（如 StartScreen mount 完成）清掉 reload flag，讓下次更新可再自癒 */
export function clearChunkRecoveryFlag(): void {
  try {
    sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    /* ignore */
  }
}
