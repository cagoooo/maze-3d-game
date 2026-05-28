import { Minimap, type PlayerState } from "./Minimap";
import { DamageOverlay } from "./DamageOverlay";
import type { MazeData } from "../maze/MazeGenerator";
import { theme } from "./theme";
import { GlassCard, Eyebrow } from "./GlassCard";

interface HUDProps {
  score: number;
  collected: number;
  total: number;
  health: number;
  timeLeft: number;
  isLocked: boolean;
  isPaused: boolean;
  mazeData: MazeData;
  playerStateRef: React.MutableRefObject<PlayerState>;
  exploredGridRef: React.MutableRefObject<boolean[][]>;
  mapVisible: boolean;
  onPauseToggle?: () => void;
  onRestart?: () => void;
  onMapToggle?: () => void;
  onMuteToggle?: () => void;
  muted?: boolean;
  isTouch?: boolean;
  showFullMap?: boolean;
  stealthRemaining?: number;
  speedRemaining?: number;
}

export function HUD({
  score,
  collected,
  total,
  health,
  timeLeft,
  isLocked,
  isPaused,
  mazeData,
  playerStateRef,
  exploredGridRef,
  mapVisible,
  onPauseToggle,
  onRestart,
  onMapToggle,
  onMuteToggle,
  muted = false,
  isTouch = false,
  showFullMap = false,
  stealthRemaining = 0,
  speedRemaining = 0,
}: HUDProps) {
  const safeTime = Math.max(0, timeLeft);
  const minutes = Math.floor(safeTime / 60);
  const seconds = safeTime % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const timeColor =
    safeTime <= 10 ? theme.red : safeTime <= 20 ? theme.amber : theme.white;
  const orbColor = collected === total ? theme.amber : theme.cyan;
  const totalPct = total > 0 ? (collected / total) * 100 : 0;

  return (
    <>
      {/* Top bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          zIndex: 50,
          pointerEvents: "none",
          fontFamily: theme.body,
        }}
      >
        {/* LEFT — Score */}
        <GlassCard strong style={{ padding: "12px 18px", minWidth: 150 }}>
          <Eyebrow color={theme.cyan} size={9} style={{ marginBottom: 4 }}>
            SCORE · 得分
          </Eyebrow>
          <div
            style={{
              fontFamily: theme.body,
              fontSize: 28,
              fontWeight: 300,
              letterSpacing: "-0.01em",
              color: theme.white,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
            data-testid="text-score"
          >
            {score.toLocaleString()}
          </div>
        </GlassCard>

        {/* CENTER — Timer */}
        <div style={{ textAlign: "center", flex: "0 1 auto", minWidth: 200 }}>
          <Eyebrow color={theme.textDim} size={9} style={{ marginBottom: 4 }}>
            TIME · 剩餘時間
          </Eyebrow>
          <div
            style={{
              fontFamily: theme.mono,
              fontSize: 40,
              fontWeight: 300,
              letterSpacing: "0.05em",
              color: timeColor,
              lineHeight: 1,
              textShadow: "0 2px 24px rgba(0,0,0,.8)",
              fontVariantNumeric: "tabular-nums",
              transition: "color .2s",
            }}
            data-testid="text-timer"
          >
            {timeStr}
          </div>
          {/* progress bar (orbs collected) */}
          <div
            style={{
              marginTop: 8,
              width: 220,
              height: 2,
              background: "rgba(255,255,255,.12)",
              position: "relative",
              margin: "8px auto 0",
            }}
          >
            <div
              data-testid="bar-progress"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                width: `${totalPct}%`,
                background: `linear-gradient(90deg, ${theme.cyan}, ${theme.mint})`,
                boxShadow: `0 0 10px ${theme.cyan}88`,
                transition: "width .3s ease",
              }}
            />
          </div>
        </div>

        {/* RIGHT — Orbs + Health + Buttons */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <GlassCard strong style={{ padding: "12px 18px", minWidth: 150, textAlign: "right" }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 6,
                gap: 12,
              }}
            >
              <Eyebrow color={theme.cyan} size={9}>ORBS · 光球</Eyebrow>
              <span
                data-testid="text-collected"
                style={{
                  fontFamily: theme.mono,
                  fontSize: 12,
                  color: orbColor,
                  letterSpacing: "0.1em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {collected}/{total}
              </span>
            </div>
            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", flexWrap: "wrap" }}>
              {Array.from({ length: Math.min(total, 12) }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: i < collected ? orbColor : "transparent",
                    border: i < collected ? "none" : `1px solid ${theme.textGhost}`,
                    boxShadow: i < collected ? `0 0 6px ${orbColor}88` : "none",
                  }}
                />
              ))}
              {total > 12 && (
                <span style={{ fontFamily: theme.mono, fontSize: 10, color: theme.textFade, marginLeft: 4 }}>
                  +{total - 12}
                </span>
              )}
            </div>
          </GlassCard>

          {/* Health */}
          <GlassCard strong style={{ padding: "10px 18px", minWidth: 150 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <Eyebrow color={theme.red} size={9}>HEALTH · 生命</Eyebrow>
              <span style={{ fontFamily: theme.mono, fontSize: 11, color: theme.text }}>
                {health}/3
              </span>
            </div>
            <div data-testid="bar-health" style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    background: i < health ? theme.red : "rgba(255,255,255,.12)",
                    borderRadius: 2,
                    boxShadow: i < health ? `0 0 6px ${theme.red}66` : "none",
                    transition: "background .2s",
                  }}
                />
              ))}
            </div>
          </GlassCard>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 6, pointerEvents: "auto" }}>
            <IconButton
              testId="button-pause"
              onClick={onPauseToggle}
              title={isPaused ? "繼續（同 ESC）" : "暫停（同 ESC）"}
              active={isPaused}
              tint={isPaused ? theme.amber : theme.cyan}
            >
              {isPaused ? "▶" : "⏸"}
            </IconButton>
            <IconButton
              testId="button-map-toggle"
              onClick={onMapToggle}
              title={mapVisible ? "隱藏小地圖（同 P）" : "顯示小地圖（同 P）"}
              active={mapVisible}
              tint={theme.cyan}
            >
              🗺
            </IconButton>
            <IconButton
              testId="button-restart"
              onClick={onRestart}
              title="重新開始整局"
              tint={theme.amber}
            >
              ↻
            </IconButton>
            <IconButton
              testId="button-mute"
              onClick={onMuteToggle}
              title={muted ? "取消靜音" : "靜音"}
              active={!muted}
              tint={theme.cyan}
            >
              {muted ? "🔇" : "🔊"}
            </IconButton>
          </div>
        </div>
      </div>

      {/* Crosshair */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="2" fill={theme.cyan} opacity=".9" />
          <line x1="16" y1="4" x2="16" y2="10" stroke={theme.cyan} strokeWidth="1" opacity=".7" />
          <line x1="16" y1="22" x2="16" y2="28" stroke={theme.cyan} strokeWidth="1" opacity=".7" />
          <line x1="4" y1="16" x2="10" y2="16" stroke={theme.cyan} strokeWidth="1" opacity=".7" />
          <line x1="22" y1="16" x2="28" y2="16" stroke={theme.cyan} strokeWidth="1" opacity=".7" />
        </svg>
      </div>

      {mapVisible && (
        <Minimap
          mazeData={mazeData}
          playerStateRef={playerStateRef}
          exploredGridRef={exploredGridRef}
          revealAll={showFullMap}
        />
      )}

      {/* Active effects */}
      {(stealthRemaining > 0 || speedRemaining > 0 || showFullMap) && (
        <div
          data-testid="active-effects"
          style={{
            position: "fixed",
            top: 160,
            left: 24,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            zIndex: 55,
            pointerEvents: "none",
          }}
        >
          {stealthRemaining > 0 && (
            <EffectChip color="rgba(200,200,210,1)" label="👻 隱身" remainingMs={stealthRemaining} />
          )}
          {speedRemaining > 0 && (
            <EffectChip color={theme.amber} label="⚡ 加速" remainingMs={speedRemaining} />
          )}
          {showFullMap && <EffectChip color={theme.amber} label="🗺 全圖" remainingMs={null} />}
        </div>
      )}

      <DamageOverlay health={health} maxHealth={3} />

      {/* Bottom hint when locked */}
      {isLocked && (
        <div
          style={{
            position: "fixed",
            bottom: isTouch ? 180 : 24,
            left: isTouch ? "auto" : "50%",
            right: isTouch ? 20 : "auto",
            transform: isTouch ? "none" : "translateX(-50%)",
            zIndex: 50,
            padding: "8px 16px",
            background: "rgba(10,18,30,0.6)",
            backdropFilter: theme.glassBlur,
            WebkitBackdropFilter: theme.glassBlur,
            border: `1px solid ${theme.border}`,
            borderRadius: 3,
            color: theme.textDim,
            fontSize: 11,
            fontFamily: theme.mono,
            letterSpacing: "0.15em",
            pointerEvents: "none",
            maxWidth: "92vw",
          }}
        >
          {isTouch
            ? "左下搖桿 · 右半滑動 · 右上按鈕"
            : "WASD · MOUSE · ESC · P"}
        </div>
      )}

      {/* Pause overlay */}
      {isPaused && (
        <div
          data-testid="overlay-pause"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(6,8,13,0.78)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: theme.white,
            pointerEvents: "none",
            fontFamily: theme.body,
          }}
        >
          <Eyebrow color={theme.cyan} style={{ marginBottom: 18 }}>
            PAUSED · 遊戲暫停
          </Eyebrow>
          <div
            style={{
              fontSize: 64,
              fontWeight: 200,
              letterSpacing: "-0.02em",
              marginBottom: 18,
              background: `linear-gradient(180deg, ${theme.white} 0%, ${theme.cyan} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            遊戲暫停
          </div>
          <div style={{ fontSize: 14, color: theme.textDim, marginBottom: 8, letterSpacing: "0.05em" }}>
            {isTouch ? "點右上 ▶ 按鈕繼續探索" : "點擊畫面任意處 / 按 ESC 繼續探索"}
          </div>
          <div
            style={{
              fontFamily: theme.mono,
              fontSize: 10,
              color: theme.textFade,
              letterSpacing: "0.3em",
            }}
          >
            TIMER & ENEMIES PAUSED
          </div>
        </div>
      )}
    </>
  );
}

function IconButton({
  children,
  onClick,
  title,
  testId,
  active = false,
  tint = theme.cyan,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  testId: string;
  active?: boolean;
  tint?: string;
}) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      title={title}
      style={{
        width: 34,
        height: 34,
        background: active ? `${tint}22` : "rgba(10,18,30,0.6)",
        backdropFilter: theme.glassBlur,
        WebkitBackdropFilter: theme.glassBlur,
        border: `1px solid ${active ? tint : theme.border}`,
        borderRadius: 3,
        color: active ? tint : theme.text,
        fontSize: 14,
        cursor: "pointer",
        fontFamily: "inherit",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all .15s",
      }}
    >
      {children}
    </button>
  );
}

function EffectChip({
  label,
  remainingMs,
  color,
}: {
  label: string;
  remainingMs: number | null;
  color: string;
}) {
  return (
    <div
      style={{
        padding: "6px 12px",
        background: "rgba(10,18,30,0.82)",
        backdropFilter: theme.glassBlur,
        WebkitBackdropFilter: theme.glassBlur,
        border: `1px solid ${color}55`,
        borderRadius: 3,
        color,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: theme.body,
        letterSpacing: "0.1em",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span>{label}</span>
      {remainingMs !== null && (
        <span style={{ fontFamily: theme.mono, opacity: 0.7 }}>
          {(remainingMs / 1000).toFixed(1)}s
        </span>
      )}
    </div>
  );
}
