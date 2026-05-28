/**
 * Immersive Preview design tokens.
 *
 * 用法：
 *   import { theme } from "./theme";
 *   <div style={{ background: theme.bgDeep, color: theme.text }}>...
 */

export const theme = {
  // Backgrounds
  bgDeep:        "#06080d",
  bgPanel:       "rgba(10,18,30,0.55)",
  bgPanelStrong: "rgba(10,18,30,0.82)",
  bgOver:        "rgba(255,255,255,0.04)",

  // Accents
  cyan:     "#5cd6ff",
  cyanSoft: "#a6c8e8",
  mint:     "#7fffd4",
  amber:    "#ffd76e",
  red:      "#ff5577",
  redSoft:  "#ff7799",

  // Neutrals
  white:     "#ffffff",
  text:      "rgba(255,255,255,0.92)",
  textDim:   "rgba(255,255,255,0.6)",
  textFade:  "rgba(255,255,255,0.4)",
  textGhost: "rgba(255,255,255,0.25)",
  border:    "rgba(255,255,255,0.12)",
  borderSoft:"rgba(255,255,255,0.06)",

  // Fonts
  body:    '"Inter", "Noto Sans TC", sans-serif',
  mono:    '"JetBrains Mono", monospace',
  display: '"Inter", "Noto Sans TC", sans-serif',

  // Shadows / glass
  glassBlur:   "blur(24px) saturate(140%)",
  glassShadow: "0 30px 80px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.08)",
} as const;

export type Tint = "cyan" | "mint" | "red" | "amber";

export const tintPalette: Record<
  Tint,
  { far: string; wallA: string; wallB: string; glow: string }
> = {
  cyan:  { far: "#2a5577", wallA: "#1a3a5c", wallB: "#2a5582", glow: theme.cyan  },
  mint:  { far: "#2a6e58", wallA: "#1a4a3a", wallB: "#2a6e58", glow: theme.mint  },
  red:   { far: "#5c2a3a", wallA: "#3a1a2a", wallB: "#582a3a", glow: theme.red   },
  amber: { far: "#5c4a2a", wallA: "#3a2e1a", wallB: "#5c4a2a", glow: theme.amber },
};

/**
 * 共用 keyframes — 在 App 啟動時呼叫一次即可。
 *
 * 含 `prefers-reduced-motion: reduce` 覆寫：動暈症 / 前庭敏感 / 老花玩家
 * 在 OS 開啟「減少動態效果」後，所有 imm-* keyframes 都會變成「無動作」靜止狀態。
 *
 * 注意：CSS `@media (prefers-reduced-motion)` 內覆寫的 `@keyframes` 會接管 base 定義
 * （Chrome / Firefox / Safari 都支援）；但 SVG SMIL `<animate>` 元素 CSS 控不住，
 * 需要 useReducedMotion hook 條件 render（見 CorridorBackdrop.tsx）。
 *
 * WCAG 2.3.3 (Animation from Interactions) Level AAA 要求。
 */
export function injectImmersiveKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById("imm-keyframes")) return;
  const s = document.createElement("style");
  s.id = "imm-keyframes";
  s.textContent = `
    @keyframes imm-blink { 50% { opacity:.3 } }
    @keyframes imm-pulse { 0%,100% { opacity:1 } 50% { opacity:.5 } }
    @keyframes imm-float { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-4px) } }
    @keyframes imm-fade-in { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }

    @media (prefers-reduced-motion: reduce) {
      @keyframes imm-blink { 0%,100% { opacity:1 } 50% { opacity:1 } }
      @keyframes imm-pulse { 0%,100% { opacity:1 } 50% { opacity:1 } }
      @keyframes imm-float { 0%,100% { transform:none } 50% { transform:none } }
      @keyframes imm-fade-in { from { opacity:1; transform:none; } to { opacity:1; transform:none; } }

      /* 額外保護：把任何套用 imm-* animation 的元素的 transition 也關掉，避免 hover/state 切換閃爍 */
      *, *::before, *::after {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
        scroll-behavior: auto !important;
      }
    }
  `;
  document.head.appendChild(s);
}
