export interface Difficulty {
  id: string;
  label: string;
  emoji: string;
  cols: number;
  rows: number;
  orbCount: number;
  time: number;
  enemyCount: number;
  playerSpeed: number;
  /** 敵人是否啟用視線追蹤（v0.4.0 加入）*/
  enemyChase: boolean;
  description: string;
}

export const DIFFICULTIES: Difficulty[] = [
  {
    id: "easy",
    label: "簡單",
    emoji: "🌱",
    cols: 7,
    rows: 7,
    orbCount: 8,
    time: 180,
    enemyCount: 2,
    playerSpeed: 7,
    enemyChase: false,
    description: "適合第一次玩 / 低年級",
  },
  {
    id: "normal",
    label: "普通",
    emoji: "🔥",
    cols: 9,
    rows: 9,
    orbCount: 12,
    time: 150,
    enemyCount: 4,
    playerSpeed: 6,
    enemyChase: false,
    description: "預設難度",
  },
  {
    id: "hard",
    label: "困難",
    emoji: "💀",
    cols: 13,
    rows: 13,
    orbCount: 18,
    time: 180,
    enemyCount: 6,
    playerSpeed: 5.5,
    enemyChase: true,
    description: "高年級挑戰（敵人會視線追蹤！）",
  },
  {
    id: "nightmare",
    label: "噩夢",
    emoji: "☠️",
    cols: 17,
    rows: 17,
    orbCount: 24,
    time: 200,
    enemyCount: 8,
    playerSpeed: 5,
    enemyChase: true,
    description: "敵人狂追擊",
  },
];

export function getDifficulty(id: string): Difficulty {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[1];
}

const STORAGE_KEY = "maze_difficulty_v1";

export function loadDifficulty(): Difficulty {
  if (typeof window === "undefined") return DIFFICULTIES[1];
  try {
    const id = window.localStorage.getItem(STORAGE_KEY);
    return id ? getDifficulty(id) : DIFFICULTIES[1];
  } catch {
    return DIFFICULTIES[1];
  }
}

export function saveDifficulty(id: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
