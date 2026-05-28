/**
 * 成績分享按鈕（WinScreen 用）。
 *
 * 兩顆並排：
 *   1. 「分享成績」— 點擊生成個人化 PNG → Web Share API → fallback 下載
 *   2. 「複製連結」— 只複製公開遊戲 URL 給好友
 *
 * 設計：Immersive HiFi 風格，使用 mint 色呼應 WinScreen 的通關氛圍。
 * 含 loading state、success toast、error 顯示。
 *
 * 設計參考：IMPROVEMENTS.md §12.2.1
 */

import { useState, useCallback } from "react";
import { shareScoreCard, copyShareLink, type ShareCardData } from "../shareCard";
import { theme } from "./theme";

interface ShareButtonProps {
  data: ShareCardData;
}

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const TOAST_DURATION_MS = 2400;

export function ShareButton({ data }: ShareButtonProps) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const showToast = useCallback((message: string, kind: "success" | "error") => {
    setStatus({ kind, message });
    setTimeout(() => setStatus({ kind: "idle" }), TOAST_DURATION_MS);
  }, []);

  const handleShare = useCallback(async () => {
    if (status.kind === "loading") return;
    setStatus({ kind: "loading" });
    try {
      const result = await shareScoreCard(data);
      switch (result.kind) {
        case "share":
          showToast("分享完成！", "success");
          break;
        case "download":
          showToast("成績卡已下載 ✓ 文字已複製到剪貼簿", "success");
          break;
        case "copy":
          showToast("連結已複製到剪貼簿", "success");
          break;
        case "cancelled":
          setStatus({ kind: "idle" });
          break;
      }
    } catch (e) {
      const msg = (e as Error)?.message ?? "未知錯誤";
      showToast(`分享失敗：${msg}`, "error");
    }
  }, [data, status.kind, showToast]);

  const handleCopyLink = useCallback(async () => {
    const ok = await copyShareLink();
    showToast(ok ? "連結已複製 ✓" : "複製失敗，請手動分享", ok ? "success" : "error");
  }, [showToast]);

  const isLoading = status.kind === "loading";

  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={handleShare}
          disabled={isLoading}
          data-testid="button-share-score"
          aria-label="分享我的成績"
          style={{
            padding: "14px 28px",
            background: isLoading ? "rgba(127,255,212,0.4)" : theme.mint,
            color: theme.bgDeep,
            border: "none",
            borderRadius: 3,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.25em",
            fontFamily: theme.body,
            cursor: isLoading ? "wait" : "pointer",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 12,
            transition: "filter .15s",
          }}
          onMouseEnter={(e) => {
            if (!isLoading)
              (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.12)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1)";
          }}
        >
          <span aria-hidden style={{ fontSize: 16 }}>
            {isLoading ? "⟳" : "✦"}
          </span>
          <span>{isLoading ? "產生中" : "分享我的成績"}</span>
        </button>

        <button
          onClick={handleCopyLink}
          data-testid="button-copy-link"
          aria-label="複製遊戲連結"
          style={{
            padding: "14px 22px",
            background: "transparent",
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 3,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.25em",
            fontFamily: theme.body,
            cursor: "pointer",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 10,
            transition: "border-color .15s, color .15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = theme.cyan;
            (e.currentTarget as HTMLButtonElement).style.color = theme.cyan;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = theme.border;
            (e.currentTarget as HTMLButtonElement).style.color = theme.text;
          }}
        >
          <span aria-hidden>🔗</span>
          複製連結
        </button>
      </div>

      {/* Status toast */}
      {(status.kind === "success" || status.kind === "error") && (
        <div
          role="status"
          aria-live="polite"
          data-testid="share-toast"
          style={{
            marginTop: 12,
            padding: "8px 16px",
            background:
              status.kind === "error" ? "rgba(255,85,119,0.12)" : "rgba(127,255,212,0.10)",
            border: `1px solid ${
              status.kind === "error" ? theme.red : theme.mint
            }55`,
            borderRadius: 3,
            color: status.kind === "error" ? theme.red : theme.mint,
            fontSize: 12,
            fontFamily: theme.body,
            letterSpacing: "0.05em",
            animation: "imm-fade-in .25s ease",
          }}
        >
          {status.message}
        </div>
      )}
    </>
  );
}
