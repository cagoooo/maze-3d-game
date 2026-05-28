import { Footer } from "./Footer";
import { theme } from "./theme";
import { GlassCard, Corners, Eyebrow } from "./GlassCard";
import { CorridorBackdrop } from "./CorridorBackdrop";

interface GameOverScreenProps {
  score: number;
  collected: number;
  onRestart: () => void;
  reason: "timeout" | "enemy" | null;
}

export function GameOverScreen({ score, collected, onRestart, reason }: GameOverScreenProps) {
  const isTimeout = reason === "timeout";
  const accent = isTimeout ? theme.amber : theme.red;
  const tint = isTimeout ? "amber" : "red";
  const subtitle = isTimeout ? "時間到了，挑戰失敗" : "被紅怪抓到了";
  const reasonEn = isTimeout ? "MISSION TIMEOUT" : "CAUGHT BY ENEMY";

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
      <CorridorBackdrop tint={tint} orbCount={1} />
      {/* extra red/amber inset wash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: `inset 0 0 200px ${accent}55`,
          pointerEvents: "none",
        }}
      />

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
          animation: "imm-fade-in .5s ease",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Eyebrow color={accent} size={12} style={{ marginBottom: 22 }}>
            ✕  {reasonEn}  ✕
          </Eyebrow>

          <h1
            data-testid="text-gameover-title"
            style={{
              margin: 0,
              fontFamily: theme.display,
              fontSize: "clamp(64px, 11vw, 120px)",
              fontWeight: 200,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: theme.white,
            }}
          >
            {isTimeout ? (
              <>
                時間
                <span style={{ fontWeight: 700, color: accent, textShadow: `0 0 40px ${accent}99` }}>到</span>
              </>
            ) : (
              <>
                GAME{" "}
                <span style={{ fontWeight: 700, color: accent, textShadow: `0 0 40px ${accent}99` }}>OVER</span>
              </>
            )}
          </h1>

          <div
            data-testid="text-gameover-reason"
            style={{
              marginTop: 18,
              fontSize: 18,
              color: theme.textDim,
              letterSpacing: "0.2em",
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Stats */}
        <GlassCard
          style={{
            padding: "24px 36px",
            width: "min(540px, 100%)",
            borderColor: `${accent}44`,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            <StatCell label="FINAL SCORE" zh="本局得分" value={score.toLocaleString()} color={accent} big />
            <StatCell label="ORBS COLLECTED" zh="已收集" value={`${collected}`} color={theme.cyan} border />
          </div>
        </GlassCard>

        {/* CTA */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div
            style={{
              fontFamily: theme.mono,
              fontSize: 10,
              color: theme.textFade,
              letterSpacing: "0.3em",
              animation: "imm-blink 1.4s infinite",
            }}
          >
            PRESS ANY KEY TO CONTINUE
          </div>
          <button
            onClick={onRestart}
            data-testid="button-restart-game"
            style={{
              padding: "16px 40px",
              background: accent,
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
              (e.target as HTMLButtonElement).style.filter = "brightness(1.15)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.filter = "brightness(1)";
            }}
          >
            重新開始
            <span style={{ fontFamily: theme.mono, fontSize: 10, opacity: 0.55, letterSpacing: "0.2em" }}>
              R
            </span>
          </button>
        </div>

        <Footer />
      </div>

      <Corners color={`${accent}66`} />
    </div>
  );
}

function StatCell({
  label,
  zh,
  value,
  color,
  big = false,
  border = false,
}: {
  label: string;
  zh: string;
  value: string;
  color: string;
  big?: boolean;
  border?: boolean;
}) {
  return (
    <div
      style={{
        padding: "0 24px",
        textAlign: "center",
        borderLeft: border ? `1px solid ${theme.borderSoft}` : "none",
      }}
    >
      <Eyebrow color={theme.textFade} size={9} style={{ marginBottom: 8 }}>
        {label}
      </Eyebrow>
      <div
        data-testid={big ? "text-final-score" : undefined}
        style={{
          fontFamily: theme.body,
          fontSize: big ? 40 : 30,
          fontWeight: big ? 300 : 300,
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
