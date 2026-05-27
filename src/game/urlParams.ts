/**
 * URL 共享機制：老師大螢幕投影 `?class=601&seed=2547&d=hard` 給全班，
 * 學生 iPad 掃 QR Code 進來，自動套用班級代碼 + 固定迷宮 + 難度。
 */

import { getDifficulty, type Difficulty } from "./difficulty";
import { saveDifficulty } from "./difficulty";
import { saveProfile, loadProfile } from "./leaderboard";

export interface ShareParams {
  /** 班級代碼，例如 "601" */
  classCode?: string;
  /** 迷宮種子，相同 seed = 相同迷宮 */
  seed?: string;
  /** 難度 id */
  difficulty?: Difficulty;
  /** 是否開啟管理員模式 */
  admin?: boolean;
}

export function parseUrlParams(): ShareParams {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const classCode = p.get("class") ?? p.get("c") ?? undefined;
  const seed = p.get("seed") ?? p.get("s") ?? undefined;
  const diffId = p.get("d") ?? p.get("difficulty") ?? undefined;
  const admin = p.get("admin") === "true";
  return {
    classCode: classCode || undefined,
    seed: seed || undefined,
    difficulty: diffId ? getDifficulty(diffId) : undefined,
    admin,
  };
}

/**
 * 把 URL params 套用到 localStorage（班級代碼）/ difficulty store。
 * 在 MazeGame mount 時呼叫一次。
 */
export function applyUrlParams(params: ShareParams) {
  if (typeof window === "undefined") return;
  if (params.classCode) {
    const existing = loadProfile();
    saveProfile({
      nickname: existing.nickname,
      classCode: params.classCode,
    });
  }
  if (params.difficulty) {
    saveDifficulty(params.difficulty.id);
  }
}

/**
 * 產生分享 URL（給 QR Code / 複製連結用）
 */
export function buildShareUrl(opts: {
  classCode?: string;
  seed?: string;
  difficultyId?: string;
}): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  // 砍掉舊 params
  url.searchParams.delete("class");
  url.searchParams.delete("c");
  url.searchParams.delete("seed");
  url.searchParams.delete("s");
  url.searchParams.delete("d");
  url.searchParams.delete("difficulty");
  url.searchParams.delete("admin");
  if (opts.classCode) url.searchParams.set("class", opts.classCode);
  if (opts.seed) url.searchParams.set("seed", opts.seed);
  if (opts.difficultyId) url.searchParams.set("d", opts.difficultyId);
  return url.toString();
}

/**
 * 產 4-6 位數 seed（給老師「重新抽一張班級迷宮」用）
 */
export function randomSeed(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
