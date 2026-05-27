export interface LeaderboardEntry {
  score: number;
  timeLeft: number;
  date: string;
}

const STORAGE_KEY = "maze3d_leaderboard_v1";
const MAX_ENTRIES = 3;

export function loadLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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
  const current = loadLeaderboard();
  const combined = [...current, entry].sort((a, b) => b.score - a.score);
  const trimmed = combined.slice(0, MAX_ENTRIES);
  const rankIdx = trimmed.indexOf(entry);
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
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
