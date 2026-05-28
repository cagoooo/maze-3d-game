import { theme, tintPalette, type Tint } from "./theme";
import { useReducedMotion } from "./useReducedMotion";

interface CorridorBackdropProps {
  /** Tint 色相切換：cyan(預設)、mint(通關)、red(失敗)、amber(排行榜)。 */
  tint?: Tint;
  /** 走廊內光球數量（0-3） */
  orbCount?: number;
  /** 是否顯示 REC 角落電影感邊框 */
  corners?: boolean;
}

/**
 * 第一人稱走廊靜態 SVG 背景。
 *
 * Note: 上線時可以把這個換成直接渲染 <MazeScene /> 的「待機模式」——
 * 攝影機鎖在玩家位置、開啟自動緩慢漂移（左右擺動 3°、上下 1°）。
 * 這個 SVG 是備援，也是低階裝置的 fallback。
 */
export function CorridorBackdrop({
  tint = "cyan",
  orbCount = 3,
  corners = true,
}: CorridorBackdropProps) {
  const tints = tintPalette[tint];
  const reduceMotion = useReducedMotion();
  const gradId = `imm-far-${tint}`;
  const wallId = `imm-wall-${tint}`;
  const orbs = [
    { cx: 960, cy: 780, r: 22 },
    { cx: 640, cy: 920, r: 16 },
    { cx: 1280, cy: 880, r: 18 },
  ].slice(0, orbCount);

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: theme.bgDeep,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={tints.far} />
            <stop offset="100%" stopColor={theme.bgDeep} />
          </radialGradient>
          <linearGradient id={wallId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tints.wallA} />
            <stop offset="50%" stopColor={tints.wallB} />
            <stop offset="100%" stopColor="#0a1525" />
          </linearGradient>
        </defs>
        <rect width="1920" height="1080" fill={`url(#${gradId})`} opacity=".5" />
        <polygon points="0,0 1920,0 1140,440 780,440" fill="#0a1220" opacity=".85" />
        <polygon
          points="0,1080 1920,1080 1140,580 780,580"
          fill="#0a1525"
          stroke={`${tints.glow}33`}
          strokeWidth="1"
        />
        <polygon points="0,0 780,440 780,580 0,1080" fill={`url(#${wallId})`} opacity=".95" />
        <polygon
          points="1920,0 1140,440 1140,580 1920,1080"
          fill={`url(#${wallId})`}
          opacity=".95"
        />
        {Array.from({ length: 10 }).map((_, i) => {
          const t = (i + 1) / 11;
          const k = t * t * 1.15;
          const y = 580 + (1080 - 580) * k;
          if (y > 1080) return null;
          return (
            <line
              key={i}
              x1={780 - 780 * k}
              y1={y}
              x2={1140 + 780 * k}
              y2={y}
              stroke={`${tints.glow}22`}
              strokeWidth="1"
            />
          );
        })}
        <rect
          x="810"
          y="450"
          width="300"
          height="130"
          fill={theme.bgDeep}
          stroke={tints.glow}
          strokeWidth="2"
          opacity=".85"
        />
        {orbs.map((p, i) => (
          <g key={i} opacity={tint === "red" ? 0.4 : 1}>
            <circle cx={p.cx} cy={p.cy} r={p.r * 1.8} fill={tints.glow} opacity=".15" />
            <circle cx={p.cx} cy={p.cy} r={p.r} fill={tints.glow} opacity=".95">
              {!reduceMotion && (
                <animate
                  attributeName="opacity"
                  values="1;.55;1"
                  dur={`${1.8 + i * 0.3}s`}
                  repeatCount="indefinite"
                />
              )}
            </circle>
            <circle
              cx={p.cx - p.r * 0.35}
              cy={p.cy - p.r * 0.35}
              r={p.r * 0.3}
              fill="#fff"
              opacity=".7"
            />
          </g>
        ))}
        {/* atmospheric particles */}
        {Array.from({ length: 18 }).map((_, i) => {
          const x = (i * 113) % 1920;
          const y = 200 + ((i * 71) % 680);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r=".7"
              fill={tints.glow}
              opacity={0.3 + ((i * 7) % 5) * 0.1}
            />
          );
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 55%, transparent 5%, ${theme.bgDeep}cc 80%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 120,
          background: `linear-gradient(180deg, ${theme.bgDeep}, transparent)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 160,
          background: `linear-gradient(0deg, ${theme.bgDeep}, transparent)`,
        }}
      />
      {corners && <CornerMarks color={`${tints.glow}55`} />}
    </div>
  );
}

function CornerMarks({ color }: { color: string }) {
  const base = {
    position: "absolute" as const,
    width: 22,
    height: 22,
    borderColor: color,
    borderStyle: "solid" as const,
    borderWidth: 0,
  };
  return (
    <>
      <div style={{ ...base, top: 24, left: 24, borderTopWidth: 1, borderLeftWidth: 1 }} />
      <div style={{ ...base, top: 24, right: 24, borderTopWidth: 1, borderRightWidth: 1 }} />
      <div style={{ ...base, bottom: 24, left: 24, borderBottomWidth: 1, borderLeftWidth: 1 }} />
      <div style={{ ...base, bottom: 24, right: 24, borderBottomWidth: 1, borderRightWidth: 1 }} />
    </>
  );
}
