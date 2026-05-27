/**
 * Cloudflare Turnstile（vanilla wrapper，React 19 安全）
 *
 * 依 skill cloudflare-turnstile-integration：
 *  - Next 15 / React 19 / static export 下不要用 @marsidev/react-turnstile（時序競態）
 *  - 改用 vanilla CF API + 100ms polling
 *  - Script tag 加 ?render=explicit
 *  - Token 單次使用
 *
 * fail-open：sitekey 未設則 invisibleWidget 直接 resolve("")，後端也 fail-open 跳過驗證。
 */

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";
export const turnstileEnabled = Boolean(SITE_KEY);

const SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptLoaded = false;
let scriptLoading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoading) return scriptLoading;
  scriptLoading = new Promise((resolve, reject) => {
    if (typeof document === "undefined") return resolve();
    if (document.querySelector(`script[src^="${SCRIPT_URL}"]`)) {
      scriptLoaded = true;
      return resolve();
    }
    const s = document.createElement("script");
    s.src = SCRIPT_URL;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    s.onerror = () => reject(new Error("Turnstile script load failed"));
    document.head.appendChild(s);
  });
  return scriptLoading;
}

interface TurnstileGlobal {
  render: (
    container: HTMLElement | string,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
      size?: "normal" | "compact" | "invisible";
      theme?: "light" | "dark" | "auto";
    },
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
  execute: (container: HTMLElement | string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileGlobal;
  }
}

/**
 * 等到 window.turnstile 可用（每 100ms polling，最多 8s）
 */
async function waitForTurnstile(): Promise<TurnstileGlobal> {
  await loadScript();
  for (let i = 0; i < 80; i++) {
    if (typeof window !== "undefined" && window.turnstile) {
      return window.turnstile;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("Turnstile timeout (8s)");
}

/**
 * 在背景顯示 invisible widget，取 token 後立即 reset。
 * sitekey 未設時直接 resolve 空字串（後端 fail-open）。
 */
export async function getTurnstileToken(): Promise<string> {
  if (!turnstileEnabled) return "";
  if (typeof document === "undefined") return "";

  const t = await waitForTurnstile();

  // 找或建一個容器
  let container = document.getElementById(
    "maze-turnstile-container",
  ) as HTMLDivElement | null;
  if (!container) {
    container = document.createElement("div");
    container.id = "maze-turnstile-container";
    container.style.position = "fixed";
    container.style.bottom = "0";
    container.style.right = "0";
    container.style.opacity = "0";
    container.style.pointerEvents = "none";
    container.style.zIndex = "-1";
    document.body.appendChild(container);
  }

  return new Promise<string>((resolve, reject) => {
    let widgetId: string | null = null;
    const timeout = setTimeout(() => {
      if (widgetId) t.remove(widgetId);
      reject(new Error("Turnstile execute timeout (15s)"));
    }, 15000);

    try {
      widgetId = t.render(container!, {
        sitekey: SITE_KEY,
        size: "invisible",
        callback: (token: string) => {
          clearTimeout(timeout);
          if (widgetId) t.remove(widgetId);
          resolve(token);
        },
        "error-callback": () => {
          clearTimeout(timeout);
          if (widgetId) t.remove(widgetId);
          reject(new Error("Turnstile error"));
        },
      });
      // invisible widget 需要顯式 execute
      t.execute(container!);
    } catch (err) {
      clearTimeout(timeout);
      reject(err);
    }
  });
}
