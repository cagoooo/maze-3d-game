import { useState, useCallback, useEffect, useRef } from "react";
import { generateMaze } from "./maze/MazeGenerator";
import type { PlayerState } from "./ui/Minimap";
import {
  loadLeaderboard,
  saveScore,
  loadProfile,
  type LeaderboardEntry,
} from "./leaderboard";
import { MazeScene, type TouchInput } from "./MazeScene";
import { HUD } from "./ui/HUD";
import { StartScreen } from "./ui/StartScreen";
import { GameOverScreen } from "./ui/GameOverScreen";
import { WinScreen } from "./ui/WinScreen";
import { Joystick } from "./ui/Joystick";
import { TouchLook } from "./ui/TouchLook";
import { TouchHint } from "./ui/TouchHint";
import { useWebGLSupport, NoWebGLScreen } from "./WebGLCheck";
import { usePlatform } from "./usePlatform";

type GameState = "start" | "playing" | "gameover" | "win";
type GameOverReason = "timeout" | "enemy" | null;

const MAZE_COLS = 9;
const MAZE_ROWS = 9;
const POINTS_PER_ORB = 100;
const GAME_TIME = 150;
const TIME_BONUS_PER_SEC = 10;
const TUTORIAL_KEY = "maze_tutorialDone_v1";

function newMaze() {
  return generateMaze(MAZE_COLS, MAZE_ROWS);
}

export function MazeGame() {
  const webglSupported = useWebGLSupport();
  const platform = usePlatform();
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
  // 觸控裝置自有暫停 state（沒有 pointer lock 概念）
  const [touchPaused, setTouchPaused] = useState(false);
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
  // 觸控輸入累積區（搖桿 + 視角拖曳寫入，MazeScene useFrame 消費）
  const touchInputRef = useRef<TouchInput>({
    moveX: 0,
    moveZ: 0,
    lookYaw: 0,
    lookPitch: 0,
  });
  const [showTutorial, setShowTutorial] = useState(false);

  // 觸控裝置：locked = !touchPaused；桌機：用 isLocked
  const effectiveLocked = platform.isTouch ? !touchPaused : isLocked;
  const isPaused = gameState === "playing" && !effectiveLocked;
  const effectiveActive = gameState === "playing" && effectiveLocked;

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
    if (gameState !== "playing" || !effectiveLocked) {
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
  }, [gameState, effectiveLocked]);

  const handleStart = useCallback(() => {
    setGameState("playing");
    setTouchPaused(false);
    // 觸控裝置初次玩顯示引導
    if (platform.isTouch && !localStorage.getItem(TUTORIAL_KEY)) {
      setShowTutorial(true);
    }
    // iOS / Android：嘗試請求全螢幕（progressive enhancement）
    if (platform.isTouch) {
      const elem = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
      };
      const req = elem.requestFullscreen ?? elem.webkitRequestFullscreen;
      req?.call(elem).catch(() => {});
    }
  }, [platform.isTouch]);

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
        const profile = loadProfile();
        const result = saveScore({
          score: finalScore,
          timeLeft: remaining,
          date: new Date().toISOString(),
          nickname: profile.nickname || undefined,
          classCode: profile.classCode || undefined,
        });
        leaderboardRef.current = result.entries;
        lastRankRef.current = result.rank;
        setTimeout(() => setGameState("win"), 500);
      }
    },
    [totalOrbs],
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
    // 重置觸控輸入累積
    touchInputRef.current.moveX = 0;
    touchInputRef.current.moveZ = 0;
    touchInputRef.current.lookYaw = 0;
    touchInputRef.current.lookPitch = 0;
    setCurrentMaze(fresh);
    setMazeId((n) => n + 1);
    setCollectedCount(0);
    setScore(0);
    setHealth(3);
    setTimeLeft(GAME_TIME);
    setIsLocked(false);
    setTouchPaused(false);
    setGameOverReason(null);
    setGameState("playing");
  }, []);

  const handlePauseToggle = useCallback(() => {
    if (platform.isTouch) {
      setTouchPaused((p) => !p);
    } else {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      } else {
        const canvas = document.querySelector("canvas");
        canvas?.requestPointerLock?.();
      }
    }
  }, [platform.isTouch]);

  const handleMapToggle = useCallback(() => {
    setMapVisible((v) => !v);
  }, []);

  const handleJoystick = useCallback((dx: number, dz: number) => {
    touchInputRef.current.moveX = dx;
    touchInputRef.current.moveZ = dz;
    // 一旦開始用搖桿，標記教學完成
    if ((dx !== 0 || dz !== 0) && !localStorage.getItem(TUTORIAL_KEY)) {
      localStorage.setItem(TUTORIAL_KEY, "1");
      setShowTutorial(false);
    }
  }, []);

  const handleLook = useCallback((dyaw: number, dpitch: number) => {
    touchInputRef.current.lookYaw += dyaw;
    touchInputRef.current.lookPitch += dpitch;
    if (!localStorage.getItem(TUTORIAL_KEY)) {
      localStorage.setItem(TUTORIAL_KEY, "1");
      setShowTutorial(false);
    }
  }, []);

  if (webglSupported === null) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a1a",
          color: "#00e5ff",
          fontSize: "1.2rem",
        }}
      >
        正在載入...
      </div>
    );
  }

  if (webglSupported === false) {
    return <NoWebGLScreen />;
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "#000",
      }}
    >
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
        touchInputRef={touchInputRef}
        isTouchDevice={platform.isTouch}
      />

      {gameState === "playing" && (
        <HUD
          score={score}
          collected={collectedCount}
          total={totalOrbs}
          health={health}
          timeLeft={timeLeft}
          isLocked={effectiveLocked}
          isPaused={isPaused}
          mazeData={currentMaze}
          playerStateRef={playerStateRef}
          exploredGridRef={exploredGridRef}
          mapVisible={mapVisible}
          onPauseToggle={handlePauseToggle}
          onRestart={handleRestart}
          onMapToggle={handleMapToggle}
          isTouch={platform.isTouch}
        />
      )}

      {/* 觸控輸入元件：只在 playing + 觸控裝置上渲染 */}
      {gameState === "playing" && platform.isTouch && (
        <>
          <Joystick onChange={handleJoystick} />
          <TouchLook onDelta={handleLook} leftReservedPx={200} />
          {showTutorial && <TouchHint />}
        </>
      )}

      {gameState === "start" && (
        <StartScreen
          onStart={handleStart}
          leaderboard={leaderboardRef.current}
        />
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
