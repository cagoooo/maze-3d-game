import type { CSSProperties, ReactNode } from "react";
import { theme } from "./theme";

interface GlassCardProps {
  children: ReactNode;
  style?: CSSProperties;
  /** strong = 較不透明（HUD 用），預設較透（中央 panel 用）。 */
  strong?: boolean;
  /** 是否啟用 backdrop-filter；低階裝置可關閉。 */
  blur?: boolean;
}

/**
 * 沉浸預覽風格的毛玻璃面板。
 * Safari iOS 需要 -webkit-backdrop-filter，所以這裡同時設兩個前綴。
 */
export function GlassCard({
  children,
  style,
  strong = false,
  blur = true,
}: GlassCardProps) {
  return (
    <div
      style={{
        background: strong ? theme.bgPanelStrong : theme.bgPanel,
        backdropFilter: blur ? theme.glassBlur : undefined,
        WebkitBackdropFilter: blur ? theme.glassBlur : undefined,
        border: `1px solid ${theme.border}`,
        borderRadius: 6,
        boxShadow: theme.glassShadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** 角落電影感小邊框（Start / Win / Lose / Leaderboard 都用）。 */
export function Corners({
  color = theme.cyan,
  inset = 24,
  size = 22,
}: {
  color?: string;
  inset?: number;
  size?: number;
}) {
  const base: CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    borderColor: color,
    borderStyle: "solid",
    borderWidth: 0,
    pointerEvents: "none",
  };
  return (
    <>
      <div style={{ ...base, top: inset, left: inset, borderTopWidth: 1, borderLeftWidth: 1 }} />
      <div style={{ ...base, top: inset, right: inset, borderTopWidth: 1, borderRightWidth: 1 }} />
      <div style={{ ...base, bottom: inset, left: inset, borderBottomWidth: 1, borderLeftWidth: 1 }} />
      <div style={{ ...base, bottom: inset, right: inset, borderBottomWidth: 1, borderRightWidth: 1 }} />
    </>
  );
}

/** 小寫等寬眉題標籤（"READY TO ENTER"、"SCORE" 之類）。 */
export function Eyebrow({
  children,
  color = theme.cyan,
  size = 11,
  style,
}: {
  children: ReactNode;
  color?: string;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: theme.mono,
        fontSize: size,
        color,
        letterSpacing: "0.35em",
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
