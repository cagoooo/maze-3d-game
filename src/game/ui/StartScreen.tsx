import { useState, useEffect, useCallback } from "react";
import { Leaderboard } from "./Leaderboard";
import { Footer } from "./Footer";
import { loadProfile, saveProfile, type LeaderboardEntry } from "../leaderboard";
import type { Difficulty } from "../difficulty";
import { theme } from "./theme";
import { GlassCard, Corners, Eyebrow } from "./GlassCard";
import { CorridorBackdrop } from "./CorridorBackdrop";

interface StartScreenProps {
  onStart: () => void;
  leaderboard: LeaderboardEntry[];
  difficulty: Difficulty;
  allDifficulties: Difficulty[];
  onDifficultyChange: (d: Difficulty) => void;
  sharedSeed?: string;
  onClearShareSeed?: () => void;
}

export function StartScreen({
  onStart,
  leaderboard,
  difficulty,
  allDifficulties,
  onDifficultyChange,
  sharedSeed,
  onClearShareSeed,
}: StartScreenProps) {
  const initial = loadProfile();
  const [nickname, setNickname] = useState(initial.nickname);
  const [classCode, setClassCode] = useState(initial.classCode);

  useEffect(() => {
    saveProfile({ nickname, classCode });
  }, [nickname, classCode]);

  const handleStart = useCallback(() => {
    saveProfile({ nickname, classCode });
    onStart();
  }, [nickname, classCode, onStart]);

  return (
    <div
      data-testid="overlay-start"
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        background: theme.bgDeep,
        zIndex: 100,
        userSelect: "none",
        fontFamily: theme.body,
        color: theme.white,
      }}
    >
      <CorridorBackdrop tint="cyan" orbCount={3} />

      {/* Top REC chrome */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          fontFamily: theme.mono,
          fontSize: 11,
          color: theme.textDim,
          letterSpacing: "0.22em",
          zIndex: 2,
        }}
      >
        <span>
          <span style={{ color: theme.red, marginRight: 6, animation: "imm-blink 1.5s infinite" }}>●</span>
          REC · CORRIDOR_07
        </span>
        <span style={{ color: theme.cyan, letterSpacing: "0.4em", fontWeight: 600, fontSize: 12 }}>
          MAZE.OS
        </span>
        <span>FPS 60</span>
      </div>

      {/* Centered card */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 16px 40px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <GlassCard
          style={{
            width: "min(720px, 100%)",
            padding: "clamp(28px, 5vw, 52px) clamp(24px, 5vw, 56px)",
            animation: "imm-fade-in .5s ease",
          }}
        >
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: theme.cyan,
                boxShadow: `0 0 12px ${theme.cyan}`,
              }}
            />
            <Eyebrow color={theme.cyan}>Ready to enter · 準備進入</Eyebrow>
          </div>

          {/* Title */}
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(38px, 6vw, 64px)",
              fontWeight: 200,
              letterSpacing: "-0.02em",
              lineHeight: 1.02,
              color: theme.white,
              fontFamily: theme.display,
            }}
          >
            3D{" "}
            <span
              style={{
                fontWeight: 700,
                background: `linear-gradient(90deg, ${theme.cyan} 0%, ${theme.mint} 100%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              迷宮冒險
            </span>
          </h1>
          <p
            style={{
              margin: "14px 0 32px",
              fontSize: "clamp(13px, 1.6vw, 15px)",
              color: theme.textDim,
              lineHeight: 1.6,
              letterSpacing: "0.05em",
            }}
          >
            收集所有藍色光球 · 避開紅色巡守者 · 越快通關得分越高
          </p>

          {/* Shared seed banner */}
          {sharedSeed && (
            <div
              data-testid="banner-shared-seed"
              style={{
                background: "rgba(255,215,110,0.08)",
                border: `1px solid ${theme.amber}55`,
                borderRadius: 4,
                padding: "12px 16px",
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
              }}
            >
              <div>
                <Eyebrow color={theme.amber} size={10} style={{ marginBottom: 4 }}>
                  班級挑戰模式
                </Eyebrow>
                <div style={{ fontSize: 13, color: theme.text }}>
                  全班共用同一張迷宮 ·{" "}
                  <span style={{ fontFamily: theme.mono, color: theme.amber }}>seed {sharedSeed}</span>
                </div>
              </div>
              <button
                onClick={onClearShareSeed}
                data-testid="button-leave-share"
                style={{
                  background: "transparent",
                  border: `1px solid ${theme.border}`,
                  color: theme.textDim,
                  padding: "6px 10px",
                  fontFamily: theme.mono,
                  fontSize: 10,
                  letterSpacing: "0.25em",
                  borderRadius: 3,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                EXIT
              </button>
            </div>
          )}

          {/* Difficulty */}
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <Eyebrow color={theme.cyan} size={10}>難度 · Difficulty</Eyebrow>
              <Eyebrow color={theme.textFade} size={9}>
                {difficulty.description}
              </Eyebrow>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${allDifficulties.length}, 1fr)`,
                gap: 6,
              }}
            >
              {allDifficulties.map((d) => {
                const active = d.id === difficulty.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => onDifficultyChange(d)}
                    data-testid={`difficulty-${d.id}`}
                    style={{
                      padding: "16px 8px",
                      textAlign: "center",
                      cursor: "pointer",
                      border: `1px solid ${active ? theme.cyan : theme.border}`,
                      background: active ? "rgba(92,214,255,0.10)" : "rgba(255,255,255,0.015)",
                      borderRadius: 4,
                      position: "relative",
                      transition: "all .15s",
                      color: theme.text,
                      fontFamily: "inherit",
                    }}
                  >
                    {active && (
                      <span
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 10,
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: theme.cyan,
                          boxShadow: `0 0 0 3px rgba(92,214,255,0.25)`,
                        }}
                      />
                    )}
                    <div
                      style={{
                        fontFamily: theme.mono,
                        fontSize: 9,
                        color: active ? theme.cyan : theme.textFade,
                        letterSpacing: "0.25em",
                        marginBottom: 8,
                      }}
                    >
                      {d.id.toUpperCase()}
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: active ? 700 : 500,
                        color: active ? theme.white : theme.text,
                        letterSpacing: "0.05em",
                        marginBottom: 8,
                      }}
                    >
                      {d.emoji} {d.label}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 10,
                        fontFamily: theme.mono,
                        fontSize: 10,
                        color: theme.textFade,
                        letterSpacing: "0.1em",
                      }}
                    >
                      <span>{d.cols}×{d.rows}</span>
                      <span style={{ opacity: 0.3 }}>·</span>
                      <span>{d.time}s</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inputs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: 24,
              marginBottom: 32,
            }}
          >
            <ImmField label="暱稱" en="CALLSIGN">
              <input
                data-testid="input-nickname"
                type="text"
                maxLength={4}
                placeholder="最多 4 字"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.trim())}
                style={fieldInputStyle(!!nickname)}
              />
            </ImmField>
            <ImmField label="班級" en="CLASS">
              <input
                data-testid="input-classcode"
                type="text"
                maxLength={6}
                placeholder="601 (選填)"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.trim())}
                style={fieldInputStyle(!!classCode)}
              />
            </ImmField>
          </div>

          {/* CTA */}
          <button
            onClick={handleStart}
            data-testid="button-start-game"
            style={{
              width: "100%",
              padding: "20px 24px",
              background: theme.white,
              color: theme.bgDeep,
              border: "none",
              borderRadius: 3,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.3em",
              fontFamily: theme.body,
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = theme.cyan;
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = theme.white;
            }}
          >
            <span>進入迷宮</span>
            <span style={{ fontFamily: theme.mono, fontSize: 11, opacity: 0.55, letterSpacing: "0.2em" }}>
              ENTER ↵
            </span>
          </button>

          {/* Hint */}
          <div
            style={{
              marginTop: 22,
              paddingTop: 18,
              borderTop: `1px solid ${theme.borderSoft}`,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 24,
              fontFamily: theme.mono,
              fontSize: 10,
              color: theme.textFade,
              letterSpacing: "0.2em",
            }}
          >
            <span>WASD · MOVE</span>
            <span>MOUSE · LOOK</span>
            <span>
              <span style={{ color: theme.cyan }}>◆</span> COLLECT
            </span>
            <span>
              <span style={{ color: theme.red }}>▲</span> AVOID
            </span>
            <span>ESC · PAUSE</span>
          </div>
        </GlassCard>

        {/* Leaderboard below — wider, separated for breathing room */}
        <div style={{ marginTop: 36, width: "min(720px, 100%)" }}>
          <Leaderboard entries={leaderboard} accent={theme.cyan} />
        </div>

        <Footer showVersion />
      </div>

      {/* Bottom-corner credits */}
      <Corners color={theme.border} />
    </div>
  );
}

function ImmField({
  label,
  en,
  children,
}: {
  label: string;
  en: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "block" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 13, color: theme.text, letterSpacing: "0.05em" }}>{label}</span>
        <span
          style={{
            fontFamily: theme.mono,
            fontSize: 9,
            color: theme.textFade,
            letterSpacing: "0.3em",
          }}
        >
          {en}
        </span>
      </div>
      {children}
    </label>
  );
}

function fieldInputStyle(filled: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "10px 0",
    background: "transparent",
    border: "none",
    borderBottom: `1px solid ${filled ? theme.cyan : theme.border}`,
    color: theme.white,
    fontSize: 17,
    fontFamily: theme.body,
    outline: "none",
    transition: "border-color .15s",
  };
}
