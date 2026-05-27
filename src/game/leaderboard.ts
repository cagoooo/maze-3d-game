export interface LeaderboardEntry {
  score: number;
  timeLeft: number;
  date: string;
  nickname?: string;
  classCode?: string;
  difficulty?: string;
}

// v2：依難度分流；v1（舊）合存當時所有紀錄，遷移到 normal
const STORAGE_KEY = (diff: string) => `maze3d_leaderboard_v2_${diff}`;
const LEGACY_KEY = "maze3d_leaderboard_v1";
const MAX_ENTRIES = 3;

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
    // 舊紀錄都來自 normal 難度（9×9 / 150s）
    const normalKey = STORAGE_KEY("normal");
    const existing = window.localStorage.getItem(normalKey);
    if (!existing) {
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

export function loadLeaderboard(difficulty = "normal"): LeaderboardEntry[] {
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
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export interface SaveResult {
  entries: LeaderboardEntry[];
  rank: number | null;
}

export function saveScore(entry: LeaderboardEntry): SaveResult {
  const difficulty = entry.difficulty ?? "normal";
  const current = loadLeaderboard(difficulty);
  const combined = [...current, entry].sort((a, b) => b.score - a.score);
  const trimmed = combined.slice(0, MAX_ENTRIES);
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

// 玩家識別（nickname / classCode）— 與排行榜 entry 解耦，便於未來雲端化
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
