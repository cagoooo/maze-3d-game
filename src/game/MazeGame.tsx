import { useState, useCallback, useEffect, useRef } from "react";
import { generateMaze } from "./maze/MazeGenerator";
import type { PlayerState } from "./ui/Minimap";
import { loadLeaderboard, saveScore, type LeaderboardEntry } from "./leaderboard";
import { MazeScene } from "./MazeScene";
import { HUD } from "./ui/HUD";
import { StartScreen } from "./ui/StartScreen";
import { GameOverScreen } from "./ui/GameOverScreen";
import { WinScreen } from "./ui/WinScreen";
import { useWebGLSupport, NoWebGLScreen } from "./WebGLCheck";

type GameState = "start" | "playing" | "gameover" | "win";
type GameOverReason = "timeout" | "enemy" | null;

const MAZE_COLS = 9;
const MAZE_ROWS = 9;
const POINTS_PER_ORB = 100;
const GAME_TIME = 150;
const TIME_BONUS_PER_SEC = 10;

function newMaze() {
  return generateMaze(MAZE_COLS, MAZE_ROWS);
}

export function MazeGame() {
  const webglSupported = useWebGLSupport();
  const [gameState, setGameState] = useState<GameState>("start");
  const [currentMaze, setCurrentMaze] = useState(() => newMaze());
  const [mazeId, setMazeId] = useState(0);
  const totalOrbs = currentMaze.orbPositions.length;
  const collectedRef = useRef<boolean[]>(new Array(totalOrbs).fill(false));
  const [collectedCount, setCollectedCount] = useState(0);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(3);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const timeLeftRef = useRef(GAME_TIME);
  const finalElapsedRef = useRef(0);
  const finalBonusRef = useRef(0);
  const [isLocked, setIsLocked] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<GameOverReason>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerStateRef = useRef<PlayerState>({
    gx: currentMaze.startX,
    gz: currentMaze.startZ,
    yaw: 0,
  });
  const exploredGridRef = useRef<boolean[][]>(
    Array.from({ length: currentMaze.height }, () =>
      new Array(currentMaze.width).fill(false),
    ),
  );
  const leaderboardRef = useRef<LeaderboardEntry[]>(loadLeaderboard());
  const lastRankRef = useRef<number | null>(null);
  const [mapVisible, setMapVisible] = useState(true);

  const isPaused = gameState === "playing" && !isLocked;
  const effectiveActive = gameState === "playing" && isLocked;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyP" || e.code === "Backquote") {
        setMapVisible((v) => !v);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    playerStateRef.current = {
      gx: currentMaze.startX,
      gz: currentMaze.startZ,
      yaw: 0,
    };
    exploredGridRef.current = Array.from(
      { length: currentMaze.height },
      () => new Array(currentMaze.width).fill(false),
    );
  }, [currentMaze]);

  useEffect(() => {
    if (gameState !== "playing" || !isLocked) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      timeLeftRef.current = Math.max(0, timeLeftRef.current - 1);
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        finalElapsedRef.current = GAME_TIME;
        finalBonusRef.current = 0;
        setGameOverReason("timeout");
        setGameState("gameover");
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, isLocked]);

  const handleStart = useCallback(() => {
    setGameState("playing");
  }, []);

  const handleOrbCollect = useCallback(
    (idx: number) => {
      if (collectedRef.current[idx]) return;
      collectedRef.current[idx] = true;
      const newCollected = collectedRef.current.filter(Boolean).length;
      setCollectedCount(newCollected);
      setScore((s) => s + POINTS_PER_ORB);
      if (newCollected === totalOrbs) {
        const remaining = timeLeftRef.current;
        const bonus = remaining * TIME_BONUS_PER_SEC;
        finalElapsedRef.current = GAME_TIME - remaining;
        finalBonusRef.current = bonus;
        const finalScore = totalOrbs * POINTS_PER_ORB + bonus;
        setScore((s) => s + bonus);
        if (timerRef.current) clearInterval(timerRef.current);
        const result = saveScore({
          score: finalScore,
          timeLeft: remaining,
          date: new Date().toISOString(),
        });
        leaderboardRef.current = result.entries;
        lastRankRef.current = result.rank;
        setTimeout(() => setGameState("win"), 500);
      }
    },
    [totalOrbs]
  );

  const handleDamage = useCallback(() => {
    setHealth((h) => {
      const next = h - 1;
      if (next <= 0) {
        finalElapsedRef.current = GAME_TIME - timeLeftRef.current;
        finalBonusRef.current = 0;
        setGameOverReason("enemy");
        setTimeout(() => setGameState("gameover"), 400);
        return 0;
      }
      return next;
    });
  }, []);

  const handleRestart = useCallback(() => {
    const fresh = newMaze();
    collectedRef.current = new Array(fresh.orbPositions.length).fill(false);
    timeLeftRef.current = GAME_TIME;
    finalElapsedRef.current = 0;
    finalBonusRef.current = 0;
    setCurrentMaze(fresh);
    setMazeId((n) => n + 1);
    setCollectedCount(0);
    setScore(0);
    setHealth(3);
    setTimeLeft(GAME_TIME);
    setIsLocked(false);
    setGameOverReason(null);
    setGameState("playing");
  }, []);

  if (webglSupported === null) {
    return (
      <div style={{
        width: "100vw", height: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0a0a1a", color: "#00e5ff", fontSize: "1.2rem",
      }}>
        正在載入...
      </div>
    );
  }

  if (webglSupported === false) {
    return <NoWebGLScreen />;
  }

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden", background: "#000" }}>
      <MazeScene
        key={mazeId}
        mazeData={currentMaze}
        gameActive={effectiveActive}
        onOrbCollect={handleOrbCollect}
        onDamage={handleDamage}
        collectedRef={collectedRef}
        onLockChange={setIsLocked}
        playerStateRef={playerStateRef}
        exploredGridRef={exploredGridRef}
      />

      {gameState === "playing" && (
        <HUD
          score={score}
          collected={collectedCount}
          total={totalOrbs}
          health={health}
          timeLeft={timeLeft}
          isLocked={isLocked}
          isPaused={isPaused}
          mazeData={currentMaze}
          playerStateRef={playerStateRef}
          exploredGridRef={exploredGridRef}
          mapVisible={mapVisible}
        />
      )}

      {gameState === "start" && (
        <StartScreen onStart={handleStart} leaderboard={leaderboardRef.current} />
      )}
      {gameState === "gameover" && (
        <GameOverScreen
          score={score}
          collected={collectedCount}
          onRestart={handleRestart}
          reason={gameOverReason}
        />
      )}
      {gameState === "win" && (
        <WinScreen
          score={score}
          timeBonus={finalBonusRef.current}
          elapsed={finalElapsedRef.current}
          onRestart={handleRestart}
          leaderboard={leaderboardRef.current}
          rank={lastRankRef.current}
        />
      )}
    </div>
  );
}
