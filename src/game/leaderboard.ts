/**
 * 排行榜：dual-write 架構。
 *
 * - 永遠先寫本機 localStorage（同步、不會失敗、玩家立刻看到名次）
 * - 雲端可用時 fire-and-forget 寫雲端；失敗則進 offline queue，下次有網路自動補送
 * - 讀取時優先雲端；雲端失敗回退本機
 *
 * 雲端啟用：環境變數 VITE_FIREBASE_PROJECT_ID 與 VITE_FIREBASE_API_KEY 都有設時才生效。
 */

import {
  cloudEnabled,
  callSubmitScore,
  callGetLeaderboard,
} from "./firebaseClient";

export interface LeaderboardEntry {
  score: number;
  timeLeft: number;
  date: string;
  nickname?: string;
  classCode?: string;
  difficulty?: string;
  seed?: string;
  /** 雲端 doc id（dual-write 後填入）*/
  cloudId?: string;
}

// v2：依難度分流；v1（舊）合存當時所有紀錄，遷移到 normal
const STORAGE_KEY = (diff: string) => `maze3d_leaderboard_v2_${diff}`;
const LEGACY_KEY = "maze3d_leaderboard_v1";
const PENDING_KEY = "maze3d_pending_v1";
const MAX_LOCAL = 3;
const MAX_CLOUD_FETCH = 10;

function migrateLegacy() {
  if (typeof window === "undefined") return;
  try {
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (!legacy) return;
    const parsed = JSON.parse(legacy);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      window.localStorage.removeItem(LEGACY_KEY);
      return;
    }
    const normalKey = STORAGE_KEY("normal");
    if (!window.localStorage.getItem(normalKey)) {
      window.localStorage.setItem(
        normalKey,
        JSON.stringify(parsed.map((e) => ({ ...e, difficulty: "normal" }))),
      );
    }
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}

// ─── 本機 storage ───────────────────────────────
export function loadLocalLeaderboard(difficulty = "normal"): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  migrateLegacy();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY(difficulty));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is LeaderboardEntry =>
          e &&
          typeof e.score === "number" &&
          typeof e.timeLeft === "number" &&
          typeof e.date === "string",
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_LOCAL);
  } catch {
    return [];
  }
}

export interface SaveResult {
  entries: LeaderboardEntry[];
  rank: number | null;
}

function saveLocalScore(entry: LeaderboardEntry): SaveResult {
  const difficulty = entry.difficulty ?? "normal";
  const current = loadLocalLeaderboard(difficulty);
  const combined = [...current, entry].sort((a, b) => b.score - a.score);
  const trimmed = combined.slice(0, MAX_LOCAL);
  const rankIdx = trimmed.indexOf(entry);
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        STORAGE_KEY(difficulty),
        JSON.stringify(trimmed),
      );
    }
  } catch {
    /* ignore quota errors */
  }
  return { entries: trimmed, rank: rankIdx >= 0 ? rankIdx + 1 : null };
}

// ─── 離線 queue（雲端寫失敗時暫存）───────────────
interface PendingItem {
  entry: LeaderboardEntry;
  turnstileToken?: string;
}

function loadPending(): PendingItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingItem[]) : [];
  } catch {
    return [];
  }
}

function savePending(items: PendingItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

function enqueuePending(item: PendingItem) {
  const list = loadPending();
  list.push(item);
  savePending(list.slice(-50)); // 最多保留 50 筆
}

export async function flushPending(): Promise<{ sent: number; failed: number }> {
  if (!cloudEnabled || typeof navigator === "undefined" || !navigator.onLine) {
    return { sent: 0, failed: 0 };
  }
  const list = loadPending();
  if (list.length === 0) return { sent: 0, failed: 0 };
  const remain: PendingItem[] = [];
  let sent = 0;
  for (const item of list) {
    try {
      await callSubmitScore({
        nickname: item.entry.nickname ?? "玩家",
        score: item.entry.score,
        timeLeft: item.entry.timeLeft,
        classCode: item.entry.classCode,
        difficulty: item.entry.difficulty ?? "normal",
        seed: item.entry.seed,
        turnstileToken: item.turnstileToken,
      });
      sent++;
    } catch {
      remain.push(item);
    }
  }
  savePending(remain);
  return { sent, failed: remain.length };
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    flushPending().catch(() => {});
  });
}

// ─── 主 API：saveScore（只寫本機，立刻返回排名）───
export function saveScore(entry: LeaderboardEntry): SaveResult {
  return saveLocalScore(entry);
}

// ─── 雲端寫入（與本機解耦；獨立呼叫）───
export function submitToCloud(
  entry: LeaderboardEntry,
  opts: { turnstileToken?: string } = {},
): Promise<{ id: string } | null> {
  if (!cloudEnabled) return Promise.resolve(null);
  return callSubmitScore({
    nickname: entry.nickname ?? "玩家",
    score: entry.score,
    timeLeft: entry.timeLeft,
    classCode: entry.classCode,
    difficulty: entry.difficulty ?? "normal",
    seed: entry.seed,
    turnstileToken: opts.turnstileToken,
  }).catch((err) => {
    console.warn("[leaderboard] cloud submit failed, queued:", err?.message ?? err);
    enqueuePending({ entry, turnstileToken: opts.turnstileToken });
    return null;
  });
}

// ─── 主 API：loadLeaderboard（cloud first，fallback local）───
export async function loadLeaderboard(
  difficulty = "normal",
  opts: { classCode?: string; seed?: string } = {},
): Promise<LeaderboardEntry[]> {
  if (cloudEnabled) {
    try {
      const cloud = await callGetLeaderboard({
        difficulty,
        classCode: opts.classCode,
        seed: opts.seed,
        limit: MAX_CLOUD_FETCH,
      });
      if (cloud.length > 0) {
        return cloud.map((c) => ({
          score: c.score,
          timeLeft: c.timeLeft,
          date: c.date,
          nickname: c.nickname,
          classCode: c.classCode,
          difficulty: c.difficulty,
          seed: c.seed,
          cloudId: c.id,
        }));
      }
    } catch (err) {
      console.warn("[leaderboard] cloud fetch failed, fallback local:", err);
    }
  }
  return loadLocalLeaderboard(difficulty);
}

// ─── 同步版（首屏用，避免 await flash）───
export function loadLeaderboardSync(difficulty = "normal"): LeaderboardEntry[] {
  return loadLocalLeaderboard(difficulty);
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}/${m}/${day} ${hh}:${mm}`;
  } catch {
    return iso;
  }
}

// ─── 玩家識別 ──────────────────────────────────
const NICKNAME_KEY = "maze_nickname";
const CLASSCODE_KEY = "maze_classCode";

export function loadProfile(): { nickname: string; classCode: string } {
  if (typeof window === "undefined") return { nickname: "", classCode: "" };
  try {
    return {
      nickname: window.localStorage.getItem(NICKNAME_KEY) ?? "",
      classCode: window.localStorage.getItem(CLASSCODE_KEY) ?? "",
    };
  } catch {
    return { nickname: "", classCode: "" };
  }
}

export function saveProfile(profile: { nickname: string; classCode: string }) {
  if (typeof window === "undefined") return;
  try {
    if (profile.nickname) window.localStorage.setItem(NICKNAME_KEY, profile.nickname);
    if (profile.classCode) window.localStorage.setItem(CLASSCODE_KEY, profile.classCode);
  } catch {
    /* ignore */
  }
}
