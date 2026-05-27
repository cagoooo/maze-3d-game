/**
 * 音效 + BGM 管理。
 *
 * 音檔來源：Pixabay CC0（無需 attribution，商用免費）— 詳見 public/audio/AUDIO_LICENSE.md
 * 設計重點：
 * - SFX 用 HTMLAudioElement pool（同種音可連續觸發不互相打斷）
 * - BGM 用單一 element + loop
 * - iOS Safari 必須由使用者互動（按開始遊戲）後才能呼叫 play()
 * - 整體 mute 開關透過 localStorage 持久化
 */

type SfxName = "orb-pickup" | "damage" | "win" | "gameover";

const POOL_SIZE: Record<SfxName, number> = {
  "orb-pickup": 4,
  damage: 2,
  win: 1,
  gameover: 1,
};

const VOLUMES: Record<SfxName, number> = {
  "orb-pickup": 0.45,
  damage: 0.6,
  win: 0.7,
  gameover: 0.6,
};

const POOL: Partial<Record<SfxName, HTMLAudioElement[]>> = {};
let bgm: HTMLAudioElement | null = null;
let initialized = false;

const MUTE_KEY = "maze_muted_v1";

function audioPath(name: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  return `${base}audio/${name}.mp3`;
}

function loadMute(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function saveMute(muted: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function initAudio() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  for (const [name, size] of Object.entries(POOL_SIZE) as [SfxName, number][]) {
    POOL[name] = Array.from({ length: size }, () => {
      const a = new Audio(audioPath(name));
      a.preload = "auto";
      a.volume = VOLUMES[name];
      a.muted = loadMute();
      return a;
    });
  }
  bgm = new Audio(audioPath("bgm"));
  bgm.loop = true;
  bgm.volume = 0.22;
  bgm.preload = "auto";
  bgm.muted = loadMute();
}

export function playSfx(name: SfxName) {
  const pool = POOL[name];
  if (!pool) return;
  const free = pool.find((a) => a.paused || a.ended) ?? pool[0];
  free.currentTime = 0;
  free.play().catch(() => {
    /* iOS 在使用者首次互動前無法 play，忽略 */
  });
}

export function playBgm() {
  bgm?.play().catch(() => {});
}

export function stopBgm() {
  if (!bgm) return;
  bgm.pause();
  bgm.currentTime = 0;
}

export function setBgmVolume(v: number) {
  if (bgm) bgm.volume = Math.max(0, Math.min(1, v));
}

export function isMuted(): boolean {
  return loadMute();
}

export function setMuted(muted: boolean) {
  saveMute(muted);
  Object.values(POOL).forEach((arr) => {
    arr?.forEach((a) => (a.muted = muted));
  });
  if (bgm) bgm.muted = muted;
}

export function toggleMute(): boolean {
  const next = !loadMute();
  setMuted(next);
  return next;
}
