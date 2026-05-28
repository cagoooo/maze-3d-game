import { Leaderboard } from "./Leaderboard";
import { Footer } from "./Footer";
import type { LeaderboardEntry } from "../leaderboard";
import { theme } from "./theme";
import { GlassCard, Corners, Eyebrow } from "./GlassCard";
import { CorridorBackdrop } from "./CorridorBackdrop";

interface WinScreenProps {
  score: number;
  timeBonus: number;
  elapsed: number;
  onRestart: () => void;
  leaderboard: LeaderboardEntry[];
  rank: number | null;
}

export function WinScreen({
  score,
  timeBonus,
  elapsed,
  onRestart,
  leaderboard,
  rank,
}: WinScreenProps) {
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const collectScore = score - timeBonus;

  return (
    <div
      className="maze-overlay-in"
      style={{
        position: "fixed",
        inset: 0,
        background: theme.bgDeep,
        zIndex: 100,
        userSelect: "none",
        overflowY: "auto",
        fontFamily: theme.body,
        color: theme.white,
      }}
    >
      <CorridorBackdrop tint="mint" orbCount={3} />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 16px 40px",
          gap: 32,
          animation: "imm-fade-in .6s ease",
        }}
      >
        {/* Hero score */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: theme.mint,
                boxShadow: `0 0 14px ${theme.mint}`,
              }}
            />
            <Eyebrow color={theme.mint}>STAGE CLEAR · 通關成功</Eyebrow>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: theme.mint,
                boxShadow: `0 0 14px ${theme.mint}`,
              }}
            />
          </div>

          <h1
            data-testid="text-win-score"
            style={{
              margin: 0,
              fontFamily: theme.display,
              fontSize: "clamp(72px, 13vw, 128px)",
              fontWeight: 200,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: theme.white,
            }}
          >
            <span
              style={{
                background: `linear-gradient(180deg, #fff 0%, ${theme.mint} 100%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {score.toLocaleString()}
            </span>
          </h1>

          <div
            style={{
              marginTop: 12,
              fontSize: 16,
              color: theme.textDim,
              letterSpacing: "0.1em",
            }}
          >
            最終分數 · Final Score
          </div>

          {rank !== null && (
            <div
              data-testid="text-new-rank"
              style={{
                marginTop: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 16px",
                border: `1px solid ${theme.amber}`,
                color: theme.amber,
                fontFamily: theme.mono,
                fontSize: 11,
                letterSpacing: "0.3em",
                borderRadius: 30,
                background: "rgba(255,215,110,.08)",
              }}
            >
              ★ NEW RECORD · 排行榜第 {rank} 名
            </div>
          )}
        </div>

        {/* Stats */}
        <GlassCard style={{ padding: "26px 36px", width: "min(720px, 100%)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
            <StatCell label="COLLECT SCORE" zh="收集得分" value={collectScore.toLocaleString()} color={theme.cyan} />
            <StatCell label="TIME BONUS" zh="時間加分" value={`+${timeBonus.toLocaleString()}`} color={theme.mint} border />
            <StatCell label="ELAPSED" zh="完成時間" value={timeStr} color={theme.amber} />
          </div>
        </GlassCard>

        {/* Leaderboard */}
        <div style={{ width: "min(720px, 100%)" }}>
          <Leaderboard entries={leaderboard} highlightRank={rank} accent={theme.mint} />
        </div>

        {/* CTA */}
        <button
          onClick={onRestart}
          data-testid="button-play-again"
          style={{
            padding: "16px 40px",
            background: theme.white,
            color: theme.bgDeep,
            border: "none",
            borderRadius: 3,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.3em",
            fontFamily: theme.body,
            cursor: "pointer",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background = theme.mint;
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = theme.white;
          }}
        >
          再玩一次
          <span style={{ fontFamily: theme.mono, fontSize: 10, opacity: 0.55, letterSpacing: "0.2em" }}>
            ↵ ENTER
          </span>
        </button>

        <Footer />
      </div>

      <Corners color={`${theme.mint}55`} />
    </div>
  );
}

function StatCell({
  label,
  zh,
  value,
  color,
  border = false,
}: {
  label: string;
  zh: string;
  value: string;
  color: string;
  border?: boolean;
}) {
  return (
    <div
      style={{
        padding: "0 24px",
        textAlign: "center",
        borderLeft: border ? `1px solid ${theme.borderSoft}` : "none",
        borderRight: border ? `1px solid ${theme.borderSoft}` : "none",
      }}
    >
      <Eyebrow color={theme.textFade} size={9} style={{ marginBottom: 8 }}>
        {label}
      </Eyebrow>
      <div
        style={{
          fontFamily: theme.body,
          fontSize: 30,
          fontWeight: 300,
          color,
          letterSpacing: "-0.01em",
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div style={{ marginTop: 4, fontSize: 11, color: theme.textFade, letterSpacing: "0.1em" }}>
        {zh}
      </div>
    </div>
  );
}
