import { formatDate, type LeaderboardEntry } from "../leaderboard";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  highlightRank?: number | null;
  accent?: string;
  title?: string;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export function Leaderboard({
  entries,
  highlightRank = null,
  accent = "#00e5ff",
  title = "歷史光榮榜",
}: LeaderboardProps) {
  const rows: (LeaderboardEntry | null)[] = [0, 1, 2].map(
    (i) => entries[i] ?? null,
  );

  return (
    <div
      style={{
        background: "rgba(0,12,28,0.78)",
        border: `1px solid ${accent}44`,
        borderRadius: "12px",
        padding: "1rem 1.25rem 1.1rem",
        minWidth: "320px",
        maxWidth: "92vw",
      }}
      data-testid="leaderboard"
    >
      <div
        style={{
          color: accent,
          fontWeight: 800,
          fontSize: "0.85rem",
          letterSpacing: "0.18em",
          textAlign: "center",
          marginBottom: "0.7rem",
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto 1fr auto auto",
          columnGap: "10px",
          rowGap: "6px",
          fontSize: "0.82rem",
          alignItems: "center",
        }}
      >
        <div
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.7rem",
            letterSpacing: "0.1em",
          }}
        >
          排名
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.7rem",
            letterSpacing: "0.1em",
          }}
        >
          玩家
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.7rem",
            letterSpacing: "0.1em",
          }}
        >
          日期
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.7rem",
            letterSpacing: "0.1em",
            textAlign: "right",
          }}
        >
          剩餘秒
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.7rem",
            letterSpacing: "0.1em",
            textAlign: "right",
          }}
        >
          得分
        </div>

        {rows.map((entry, i) => {
          const isHighlight = highlightRank === i + 1;
          const baseColor = entry ? "#fff" : "rgba(255,255,255,0.25)";
          const bg = isHighlight ? `${accent}22` : "transparent";
          const nameLabel = entry?.nickname
            ? entry.classCode
              ? `${entry.nickname}・${entry.classCode}`
              : entry.nickname
            : entry
              ? "—"
              : "";
          return (
            <div
              key={i}
              style={{ display: "contents" }}
              data-testid={`leaderboard-row-${i + 1}`}
            >
              <div
                style={{
                  background: bg,
                  borderRadius: "6px",
                  padding: "4px 6px",
                  fontWeight: 700,
                  color: isHighlight ? accent : baseColor,
                }}
              >
                {MEDALS[i]} {i + 1}
              </div>
              <div
                style={{
                  background: bg,
                  borderRadius: "6px",
                  padding: "4px 6px",
                  color: entry ? "#fff" : baseColor,
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "100px",
                }}
                title={nameLabel}
              >
                {entry ? nameLabel : "—"}
              </div>
              <div
                style={{
                  background: bg,
                  borderRadius: "6px",
                  padding: "4px 6px",
                  color: entry ? "rgba(255,255,255,0.75)" : baseColor,
                  fontVariantNumeric: "tabular-nums",
                  fontSize: "0.76rem",
                }}
              >
                {entry ? formatDate(entry.date) : "—"}
              </div>
              <div
                style={{
                  background: bg,
                  borderRadius: "6px",
                  padding: "4px 6px",
                  color: entry ? "#9ad8ff" : baseColor,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {entry ? `${entry.timeLeft}s` : "—"}
              </div>
              <div
                style={{
                  background: bg,
                  borderRadius: "6px",
                  padding: "4px 6px",
                  color: entry
                    ? isHighlight
                      ? accent
                      : "#ffd700"
                    : baseColor,
                  fontWeight: 800,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {entry ? entry.score : "—"}
              </div>
            </div>
          );
        })}
      </div>

      {entries.length === 0 && (
        <div
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: "0.75rem",
            textAlign: "center",
            marginTop: "0.6rem",
          }}
        >
          尚無紀錄，成為第一位英雄！
        </div>
      )}
    </div>
  );
}
