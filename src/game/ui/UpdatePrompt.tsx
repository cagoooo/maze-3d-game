/**
 * SW 更新通知 banner（Immersive HiFi 風格）。
 *
 * 因 vite.config.ts 設 `registerType: "prompt"` + `injectRegister: false`，
 * SW 偵測到新版本後不會自動 reload，由本元件透過 useRegisterSW 訂閱事件並顯示 banner。
 *
 * 三種狀態：
 *   - needRefresh：偵測到新 SW 等待 activate → 顯示 cyan banner「新版本就緒」
 *   - offlineReady：SW 第一次安裝完 → 顯示 mint 提示「離線就緒」4 秒後自動關
 *   - 兩者都 false → 不渲染
 *
 * 行為設計（教學情境友善）：
 *   - 不強制 reload，讓玩家在 StartScreen / 結算畫面自願更新
 *   - 「稍後」可關閉 banner 但保留 needRefresh 狀態，下次回到首頁會再提醒
 *   - 每 60 分鐘背景 polling 一次 SW update（教室場景：學生上課 40 分鐘內若有更新會在下課前看到）
 *   - prefers-reduced-motion 時停用 pulse / fade 動畫
 *
 * 設計參考：skill `pwa-cache-bust` §3 版本提示 banner + §4 雙線偵測
 */

import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { theme } from "./theme";
import { Eyebrow } from "./GlassCard";

const SW_UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 60 分鐘
const OFFLINE_READY_AUTOCLOSE_MS = 4500;

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      // 背景定期檢查更新（教室情境：上課中若有 deploy 學生會在 60 分內看到）
      setInterval(() => {
        registration.update().catch(() => {
          /* 無網路時失敗無所謂，下次 interval 再試 */
        });
      }, SW_UPDATE_CHECK_INTERVAL_MS);
    },
    onRegisterError(error) {
      console.warn("[SW] register error:", error);
    },
  });

  // prefers-reduced-motion 偵測
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // offlineReady 自動關
  useEffect(() => {
    if (!offlineReady) return;
    const t = setTimeout(() => setOfflineReady(false), OFFLINE_READY_AUTOCLOSE_MS);
    return () => clearTimeout(t);
  }, [offlineReady, setOfflineReady]);

  if (!needRefresh && !offlineReady) return null;

  const accent = needRefresh ? theme.cyan : theme.mint;

  return (
    <div
      data-testid={needRefresh ? "update-prompt" : "offline-ready"}
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        padding: "14px 20px",
        background: "rgba(10,18,30,0.92)",
        backdropFilter: theme.glassBlur,
        WebkitBackdropFilter: theme.glassBlur,
        border: `1px solid ${accent}66`,
        borderRadius: 6,
        boxShadow: `0 20px 60px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.08), 0 0 30px ${accent}33`,
        color: theme.white,
        fontFamily: theme.body,
        display: "flex",
        alignItems: "center",
        gap: 16,
        maxWidth: "92vw",
        animation: reduceMotion ? undefined : "imm-fade-in .35s ease",
      }}
    >
      {needRefresh ? (
        <>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: theme.cyan,
              boxShadow: `0 0 12px ${theme.cyan}`,
              animation: reduceMotion ? undefined : "imm-pulse 1.4s infinite",
              flexShrink: 0,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Eyebrow color={theme.cyan} size={9}>
              NEW VERSION · 新版本就緒
            </Eyebrow>
            <span style={{ fontSize: 13, color: theme.text, letterSpacing: "0.02em" }}>
              準備好玩新版迷宮了嗎？
            </span>
          </div>
          <button
            data-testid="button-update-now"
            onClick={() => {
              // updateServiceWorker(true) = 呼叫 skipWaiting 後 reload window
              updateServiceWorker(true).catch((err) => {
                console.warn("[SW] update failed, force reload:", err);
                window.location.reload();
              });
            }}
            style={{
              padding: "8px 16px",
              background: theme.cyan,
              color: theme.bgDeep,
              border: "none",
              borderRadius: 3,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.2em",
              fontFamily: theme.body,
              cursor: "pointer",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.filter = "brightness(1.15)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.filter = "brightness(1)";
            }}
          >
            立即更新
          </button>
          <button
            data-testid="button-update-later"
            onClick={() => setNeedRefresh(false)}
            title="稍後更新（下次回到首頁會再提醒）"
            aria-label="稍後更新"
            style={{
              background: "transparent",
              border: "none",
              color: theme.textDim,
              fontFamily: theme.mono,
              fontSize: 10,
              letterSpacing: "0.25em",
              cursor: "pointer",
              padding: "8px 4px",
            }}
          >
            稍後
          </button>
        </>
      ) : (
        <>
          <span
            style={{
              color: theme.mint,
              fontSize: 16,
              fontWeight: 700,
              flexShrink: 0,
              filter: `drop-shadow(0 0 6px ${theme.mint}88)`,
            }}
            aria-hidden
          >
            ✓
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Eyebrow color={theme.mint} size={9}>
              OFFLINE READY · 離線就緒
            </Eyebrow>
            <span style={{ fontSize: 12, color: theme.textDim, letterSpacing: "0.02em" }}>
              已快取完成，飛航模式也能玩
            </span>
          </div>
        </>
      )}
    </div>
  );
}
