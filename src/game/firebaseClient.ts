/**
 * Firebase client（fail-open）：
 *
 * - 環境變數 VITE_FIREBASE_PROJECT_ID 沒設時 → 完全不載入 Firebase（回 null）
 * - 設了 → 初始化 + 暴露 callable Functions（submitScore / getLeaderboard / purgeScore）
 *
 * 這樣 GitHub Pages 部署即使沒設 Firebase secrets，前端仍可運作（純 localStorage 模式）。
 */

import type { FirebaseApp } from "firebase/app";
import type { Functions } from "firebase/functions";
import type { Auth } from "firebase/auth";

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "";
const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY ?? "";
const APP_ID = import.meta.env.VITE_FIREBASE_APP_ID ?? "";
const REGION = import.meta.env.VITE_FIREBASE_REGION ?? "asia-east1";

export const cloudEnabled = Boolean(PROJECT_ID && API_KEY);

let _app: FirebaseApp | null = null;
let _functions: Functions | null = null;
let _auth: Auth | null = null;

async function ensureInit(): Promise<void> {
  if (_app || !cloudEnabled) return;
  const { initializeApp } = await import("firebase/app");
  const { getFunctions, connectFunctionsEmulator } = await import(
    "firebase/functions"
  );
  _app = initializeApp({
    apiKey: API_KEY,
    authDomain: `${PROJECT_ID}.firebaseapp.com`,
    projectId: PROJECT_ID,
    appId: APP_ID || undefined,
  });
  _functions = getFunctions(_app, REGION);
  // 本地 dev：可選用 emulator
  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_USE_EMULATOR === "true"
  ) {
    connectFunctionsEmulator(_functions, "127.0.0.1", 5001);
  }
}

async function ensureAuth(): Promise<Auth | null> {
  if (!cloudEnabled) return null;
  await ensureInit();
  if (_auth) return _auth;
  const { getAuth } = await import("firebase/auth");
  _auth = getAuth(_app!);
  return _auth;
}

// ── submitScore ────────────────────────────────
export interface SubmitScorePayload {
  nickname: string;
  score: number;
  timeLeft: number;
  classCode?: string;
  difficulty: string;
  seed?: string;
  turnstileToken?: string;
}

export async function callSubmitScore(payload: SubmitScorePayload): Promise<{ id: string }> {
  if (!cloudEnabled) throw new Error("cloud not enabled");
  await ensureInit();
  const { httpsCallable } = await import("firebase/functions");
  const fn = httpsCallable<SubmitScorePayload, { id: string; ok: boolean }>(
    _functions!,
    "submitScore",
  );
  const res = await fn(payload);
  return { id: res.data.id };
}

// ── getLeaderboard ─────────────────────────────
export interface CloudLeaderboardEntry {
  id: string;
  nickname: string;
  score: number;
  timeLeft: number;
  classCode?: string;
  difficulty: string;
  seed?: string;
  date: string;
}

export async function callGetLeaderboard(opts: {
  classCode?: string;
  difficulty?: string;
  seed?: string;
  limit?: number;
}): Promise<CloudLeaderboardEntry[]> {
  if (!cloudEnabled) return [];
  await ensureInit();
  const { httpsCallable } = await import("firebase/functions");
  const fn = httpsCallable<typeof opts, CloudLeaderboardEntry[]>(
    _functions!,
    "getLeaderboard",
  );
  const res = await fn(opts);
  return res.data;
}

// ── admin ────────────────────────────────────
export async function callPurgeScore(scoreId: string): Promise<{ ok: boolean }> {
  if (!cloudEnabled) throw new Error("cloud not enabled");
  await ensureInit();
  const { httpsCallable } = await import("firebase/functions");
  const fn = httpsCallable<{ scoreId: string }, { ok: boolean }>(
    _functions!,
    "purgeScore",
  );
  const res = await fn({ scoreId });
  return res.data;
}

export async function loginAdmin(): Promise<{ uid: string; email: string | null } | null> {
  const auth = await ensureAuth();
  if (!auth) return null;
  const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
  const provider = new GoogleAuthProvider();
  // 限定學校網域（教師帳號）
  provider.setCustomParameters({ hd: "mail2.smes.tyc.edu.tw" });
  const cred = await signInWithPopup(auth, provider);
  return { uid: cred.user.uid, email: cred.user.email };
}

export async function logoutAdmin(): Promise<void> {
  const auth = await ensureAuth();
  if (!auth) return;
  const { signOut } = await import("firebase/auth");
  await signOut(auth);
}

export async function watchAuthState(
  cb: (user: { uid: string; email: string | null } | null) => void,
): Promise<() => void> {
  const auth = await ensureAuth();
  if (!auth) {
    cb(null);
    return () => {};
  }
  const { onAuthStateChanged } = await import("firebase/auth");
  return onAuthStateChanged(auth, (u) => {
    cb(u ? { uid: u.uid, email: u.email } : null);
  });
}
