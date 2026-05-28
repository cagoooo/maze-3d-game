import { formatDate, type LeaderboardEntry } from "../leaderboard";
import { theme } from "./theme";
import { GlassCard, Eyebrow } from "./GlassCard";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  highlightRank?: number | null;
  accent?: string;
  title?: string;
}

const MEDAL_COLORS = [theme.amber, "#d6d6d6", "#c89770"];

export function Leaderboard({
  entries,
  highlightRank = null,
  accent = theme.cyan,
  title = "歷史光榮榜",
}: LeaderboardProps) {
  const rows: (LeaderboardEntry | null)[] = [0, 1, 2].map((i) => entries[i] ?? null);

  return (
    <GlassCard
      strong
      style={{
        padding: 0,
        overflow: "hidden",
      }}
    >
      {/* Title row */}
      <div
        data-testid="leaderboard"
        style={{
          padding: "14px 22px",
          borderBottom: `1px solid ${theme.borderSoft}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Eyebrow color={accent} size={10}>{title}</Eyebrow>
        <Eyebrow color={theme.textFade} size={9}>HALL OF EXPLORERS</Eyebrow>
      </div>

      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "44px 1fr 110px 70px 90px",
          padding: "10px 22px",
          gap: 12,
          borderBottom: `1px solid ${theme.borderSoft}`,
          fontFamily: theme.mono,
          fontSize: 9,
          color: theme.textFade,
          letterSpacing: "0.25em",
        }}
      >
        <span>RANK</span>
        <span>PLAYER · 玩家</span>
        <span>DATE</span>
        <span style={{ textAlign: "right" }}>TIME</span>
        <span style={{ textAlign: "right" }}>SCORE</span>
      </div>

      {/* Rows */}
      {rows.map((entry, i) => {
        const rank = i + 1;
        const isHighlight = highlightRank === rank;
        const nameLabel = entry?.nickname
          ? entry.classCode
            ? `${entry.nickname}・${entry.classCode}`
            : entry.nickname
          : "";

        return (
          <div
            key={i}
            data-testid={`leaderboard-row-${rank}`}
            style={{
              display: "grid",
              gridTemplateColumns: "44px 1fr 110px 70px 90px",
              padding: "12px 22px",
              gap: 12,
              alignItems: "center",
              borderBottom: i < 2 ? `1px solid ${theme.borderSoft}` : "none",
              background: isHighlight ? `${accent}10` : "transparent",
              borderLeft: isHighlight ? `2px solid ${accent}` : "2px solid transparent",
            }}
          >
            {/* Rank medal */}
            <div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: `${MEDAL_COLORS[i]}25`,
                  border: `1px solid ${MEDAL_COLORS[i]}`,
                  color: MEDAL_COLORS[i],
                  fontFamily: theme.mono,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {rank}
              </span>
            </div>

            {/* Player */}
            <div
              style={{
                color: entry ? theme.white : theme.textGhost,
                fontWeight: isHighlight ? 700 : 500,
                fontSize: 14,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={nameLabel}
            >
              {entry ? nameLabel : "—"}
              {isHighlight && (
                <span
                  style={{
                    marginLeft: 8,
                    fontFamily: theme.mono,
                    fontSize: 9,
                    color: accent,
                    letterSpacing: "0.3em",
                  }}
                >
                  ← YOU
                </span>
              )}
            </div>

            {/* Date */}
            <div
              style={{
                color: entry ? theme.textDim : theme.textGhost,
                fontFamily: theme.mono,
                fontSize: 11,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {entry ? formatDate(entry.date) : "—"}
            </div>

            {/* Time left */}
            <div
              style={{
                textAlign: "right",
                color: entry ? theme.cyanSoft : theme.textGhost,
                fontFamily: theme.mono,
                fontSize: 12,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {entry ? `${entry.timeLeft}s` : "—"}
            </div>

            {/* Score */}
            <div
              style={{
                textAlign: "right",
                color: entry ? (isHighlight ? accent : theme.amber) : theme.textGhost,
                fontFamily: theme.body,
                fontSize: 16,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.01em",
              }}
            >
              {entry ? entry.score.toLocaleString() : "—"}
            </div>
          </div>
        );
      })}

      {entries.length === 0 && (
        <div
          style={{
            padding: "18px 22px",
            color: theme.textFade,
            fontSize: 12,
            textAlign: "center",
            letterSpacing: "0.1em",
          }}
        >
          尚無紀錄 · 成為第一位探險家
        </div>
      )}
    </GlassCard>
  );
}
