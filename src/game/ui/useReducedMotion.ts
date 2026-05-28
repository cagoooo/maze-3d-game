/**
 * `prefers-reduced-motion` 偵測 hook。
 *
 * 用法：
 *   const reduceMotion = useReducedMotion();
 *   <div style={{ animation: reduceMotion ? undefined : "imm-pulse 1.5s infinite" }}>
 *
 * 或用於 SVG SMIL `<animate>` 條件渲染（CSS `@media` 無法控制 SMIL）：
 *   {!reduceMotion && <animate attributeName="opacity" ... />}
 *
 * macOS：系統偏好設定 → 輔助使用 → 顯示器 → 減少動態效果
 * Windows：設定 → 輕鬆存取 → 顯示 → 在 Windows 中顯示動畫
 * iOS：設定 → 輔助使用 → 動態效果 → 減少動態效果
 * Android：設定 → 協助工具 → 移除動畫效果
 *
 * 設計參考：IMPROVEMENTS.md §11.1.2、skill og-social-preview-zh、WCAG 2.3.3
 */

import { useEffect, useState } from "react";

const MQ = "(prefers-reduced-motion: reduce)";

export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(MQ).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(MQ);
    const handler = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduce;
}
