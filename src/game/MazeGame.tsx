import { useState, useCallback, useEffect, useRef } from "react";
import { generateMaze } from "./maze/MazeGenerator";
import type { ItemType } from "./maze/MazeGenerator";
import type { PlayerState } from "./ui/Minimap";
import {
  loadLeaderboard,
  loadLeaderboardSync,
  saveScore,
  submitToCloud,
  loadProfile,
  type LeaderboardEntry,
} from "./leaderboard";
import {
  DIFFICULTIES,
  loadDifficulty,
  saveDifficulty,
  type Difficulty,
} from "./difficulty";
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
import {
  initAudio,
  playSfx,
  playBgm,
  setBgmVolume,
  isMuted,
  toggleMute,
} from "./audio";
import { parseUrlParams, applyUrlParams } from "./urlParams";
import { getTurnstileToken, turnstileEnabled } from "./turnstile";
import { cloudEnabled } from "./firebaseClient";

type GameState = "start" | "playing" | "gameover" | "win";
type GameOverReason = "timeout" | "enemy" | null;

const POINTS_PER_ORB = 100;
const TIME_BONUS_PER_SEC = 10;
const TUTORIAL_KEY = "maze_tutorialDone_v1";
const STEALTH_MS = 8000;
const SPEED_MS = 10000;
const MAP_REVEAL_MS = 5000;
const TIME_BONUS_ITEM_SEC = 20;

function makeMaze(d: Difficulty, seed?: string) {
  return generateMaze(d.cols, d.rows, {
    orbCount: d.orbCount,
    enemyCount: d.enemyCount,
    itemCount: 3,
    seed,
  });
}

export function MazeGame() {
  const webglSupported = useWebGLSupport();
  const platform = usePlatform();
  // URL params 在最一開始解析（before state init）並套用到 storage，確保 difficulty 等 state 拿到正確值
  const urlParamsRef = useRef(parseUrlParams());
  useEffect(() => {
    applyUrlParams(urlParamsRef.current);
  }, []);
  const [sharedSeed, setSharedSeed] = useState<string | undefined>(
    urlParamsRef.current.seed,
  );
  const [difficulty, setDifficultyState] = useState<Difficulty>(
    () => urlParamsRef.current.difficulty ?? loadDifficulty(),
  );
  const [gameState, setGameState] = useState<GameState>("start");
  const [currentMaze, setCurrentMaze] = useState(() =>
    makeMaze(difficulty, urlParamsRef.current.seed),
  );
  const [mazeId, setMazeId] = useState(0);
  const totalOrbs = currentMaze.orbPositions.length;
  const collectedRef = useRef<boolean[]>(new Array(totalOrbs).fill(false));
  const itemsCollectedRef = useRef<boolean[]>(
    new Array(currentMaze.items.length).fill(false),
  );
  const [collectedCount, setCollectedCount] = useState(0);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(3);
  const [timeLeft, setTimeLeft] = useState(difficulty.time);
  const timeLeftRef = useRef(difficulty.time);
  const finalElapsedRef = useRef(0);
  const finalBonusRef = useRef(0);
  const [isLocked, setIsLocked] = useState(false);
  // 道具計時 ref（Date.now() millisecond）
  const stealthUntilRef = useRef(0);
  const speedUntilRef = useRef(0);
  const mapRevealUntilRef = useRef(0);
  // 道具狀態 ticker（每 200ms 觸發 HUD 重渲染）
  const [, setActiveTick] = useState(0);
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() =>
    loadLeaderboardSync(difficulty.id),
  );
  const [lastRank, setLastRank] = useState<number | null>(null);
  const [mapVisible, setMapVisible] = useState(true);
  // 觸控輸入累積區（搖桿 + 視角拖曳寫入，MazeScene useFrame 消費）
  const touchInputRef = useRef<TouchInput>({
    moveX: 0,
    moveZ: 0,
    lookYaw: 0,
    lookPitch: 0,
  });
  const [showTutorial, setShowTutorial] = useState(false);
  const [muted, setMutedState] = useState(() => isMuted());

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

  // 切換難度時重載對應排行榜（先顯示本機立即可見，再 async 拉雲端）
  useEffect(() => {
    setLeaderboard(loadLeaderboardSync(difficulty.id));
    setLastRank(null);
    const profile = loadProfile();
    loadLeaderboard(difficulty.id, {
      classCode: profile.classCode || undefined,
      seed: sharedSeed,
    })
      .then((entries) => {
        if (entries.length > 0) setLeaderboard(entries);
      })
      .catch(() => {});
  }, [difficulty.id, sharedSeed]);

  useEffect(() => {
    if (gameState !== "playing" || !effectiveLocked) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      timeLeftRef.current = Math.max(0, timeLeftRef.current - 1);
      setTimeLeft(timeLeftRef.current);
      // 每秒順便觸發一次 active effects 重渲染（讓 HUD 倒數顯示更新）
      setActiveTick((t) => t + 1);
      if (timeLeftRef.current <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        finalElapsedRef.current = difficulty.time;
        finalBonusRef.current = 0;
        playSfx("gameover");
        setBgmVolume(0.08);
        setGameOverReason("timeout");
        setGameState("gameover");
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, effectiveLocked, difficulty.time]);

  const handleStart = useCallback(() => {
    // 初次按開始：iOS Safari 需要使用者互動後才可載音檔
    initAudio();
    playBgm();
    setBgmVolume(0.22);
    // 按當前難度重建一張新迷宮（讓使用者在 start 畫面切難度後直接套用）
    // 帶 sharedSeed 可在班級共享模式下保持同一張迷宮
    const fresh = makeMaze(difficulty, sharedSeed);
    collectedRef.current = new Array(fresh.orbPositions.length).fill(false);
    itemsCollectedRef.current = new Array(fresh.items.length).fill(false);
    timeLeftRef.current = difficulty.time;
    finalElapsedRef.current = 0;
    finalBonusRef.current = 0;
    stealthUntilRef.current = 0;
    speedUntilRef.current = 0;
    mapRevealUntilRef.current = 0;
    setCurrentMaze(fresh);
    setMazeId((n) => n + 1);
    setCollectedCount(0);
    setScore(0);
    setHealth(3);
    setTimeLeft(difficulty.time);
    setIsLocked(false);
    setTouchPaused(false);
    setGameOverReason(null);
    setGameState("playing");
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
  }, [platform.isTouch, difficulty, sharedSeed]);

  const handleOrbCollect = useCallback(
    (idx: number) => {
      if (collectedRef.current[idx]) return;
      collectedRef.current[idx] = true;
      const newCollected = collectedRef.current.filter(Boolean).length;
      setCollectedCount(newCollected);
      setScore((s) => s + POINTS_PER_ORB);
      playSfx("orb-pickup");
      if (newCollected === totalOrbs) {
        const remaining = timeLeftRef.current;
        const bonus = remaining * TIME_BONUS_PER_SEC;
        finalElapsedRef.current = difficulty.time - remaining;
        finalBonusRef.current = bonus;
        const finalScore = totalOrbs * POINTS_PER_ORB + bonus;
        setScore((s) => s + bonus);
        if (timerRef.current) clearInterval(timerRef.current);
        const profile = loadProfile();
        const entryBase = {
          score: finalScore,
          timeLeft: remaining,
          date: new Date().toISOString(),
          nickname: profile.nickname || undefined,
          classCode: profile.classCode || undefined,
          difficulty: difficulty.id,
          seed: sharedSeed,
        };
        // 1. 先寫本機 + 顯示
        const result = saveScore(entryBase);
        setLeaderboard(result.entries);
        setLastRank(result.rank);
        // 2. 非同步取 Turnstile token 後寫雲端（失敗則入 offline queue）
        if (cloudEnabled) {
          (async () => {
            let token = "";
            if (turnstileEnabled) {
              try {
                token = await getTurnstileToken();
              } catch (err) {
                console.warn("[Turnstile] token fetch failed:", err);
              }
            }
            await submitToCloud(entryBase, { turnstileToken: token });
            // 3. refresh leaderboard 含其他玩家紀錄
            try {
              const entries = await loadLeaderboard(difficulty.id, {
                classCode: profile.classCode || undefined,
                seed: sharedSeed,
              });
              if (entries.length > 0) setLeaderboard(entries);
            } catch {
              /* ignore */
            }
          })();
        }
        playSfx("win");
        setBgmVolume(0.08);
        setTimeout(() => setGameState("win"), 500);
      }
    },
    [totalOrbs, difficulty.id, difficulty.time, sharedSeed],
  );

  const handleDamage = useCallback(() => {
    playSfx("damage");
    setHealth((h) => {
      const next = h - 1;
      if (next <= 0) {
        finalElapsedRef.current = difficulty.time - timeLeftRef.current;
        finalBonusRef.current = 0;
        playSfx("gameover");
        setBgmVolume(0.08);
        setGameOverReason("enemy");
        setTimeout(() => setGameState("gameover"), 400);
        return 0;
      }
      return next;
    });
  }, [difficulty.time]);

  const handleItem = useCallback(
    (type: ItemType) => {
      playSfx("orb-pickup");
      switch (type) {
        case "heart":
          setHealth((h) => Math.min(3, h + 1));
          break;
        case "time": {
          const newTime = Math.min(
            difficulty.time + 30,
            timeLeftRef.current + TIME_BONUS_ITEM_SEC,
          );
          timeLeftRef.current = newTime;
          setTimeLeft(newTime);
          break;
        }
        case "stealth":
          stealthUntilRef.current = Date.now() + STEALTH_MS;
          break;
        case "map":
          mapRevealUntilRef.current = Date.now() + MAP_REVEAL_MS;
          break;
        case "speed":
          speedUntilRef.current = Date.now() + SPEED_MS;
          break;
      }
      setActiveTick((t) => t + 1);
    },
    [difficulty.time],
  );

  const handleRestart = useCallback(() => {
    setBgmVolume(0.22);
    const fresh = makeMaze(difficulty, sharedSeed);
    collectedRef.current = new Array(fresh.orbPositions.length).fill(false);
    itemsCollectedRef.current = new Array(fresh.items.length).fill(false);
    timeLeftRef.current = difficulty.time;
    finalElapsedRef.current = 0;
    finalBonusRef.current = 0;
    stealthUntilRef.current = 0;
    speedUntilRef.current = 0;
    mapRevealUntilRef.current = 0;
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
    setTimeLeft(difficulty.time);
    setIsLocked(false);
    setTouchPaused(false);
    setGameOverReason(null);
    setGameState("playing");
  }, [difficulty, sharedSeed]);

  const handleDifficultyChange = useCallback((d: Difficulty) => {
    setDifficultyState(d);
    saveDifficulty(d.id);
  }, []);

  const handleClearShareSeed = useCallback(() => {
    setSharedSeed(undefined);
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

  const handleMuteToggle = useCallback(() => {
    setMutedState(toggleMute());
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
        onItem={handleItem}
        onDamage={handleDamage}
        collectedRef={collectedRef}
        itemsCollectedRef={itemsCollectedRef}
        onLockChange={setIsLocked}
        playerStateRef={playerStateRef}
        exploredGridRef={exploredGridRef}
        touchInputRef={touchInputRef}
        isTouchDevice={platform.isTouch}
        playerSpeedMultiplier={Date.now() < speedUntilRef.current ? 1.5 : 1}
        stealthActive={Date.now() < stealthUntilRef.current}
        enemyChase={difficulty.enemyChase}
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
          onMuteToggle={handleMuteToggle}
          muted={muted}
          isTouch={platform.isTouch}
          showFullMap={Date.now() < mapRevealUntilRef.current}
          stealthRemaining={Math.max(0, stealthUntilRef.current - Date.now())}
          speedRemaining={Math.max(0, speedUntilRef.current - Date.now())}
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
          leaderboard={leaderboard}
          difficulty={difficulty}
          allDifficulties={DIFFICULTIES}
          onDifficultyChange={handleDifficultyChange}
          sharedSeed={sharedSeed}
          onClearShareSeed={handleClearShareSeed}
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
          leaderboard={leaderboard}
          rank={lastRank}
          difficulty={difficulty}
          totalOrbs={totalOrbs}
        />
      )}
    </div>
  );
}
