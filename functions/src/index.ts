/**
 * Cloud Functions for 3D 迷宮冒險（v0.5.0）
 *
 * Endpoints:
 *  - submitScore  : 玩家過關 / 失敗時送上來成績，驗證後寫進 Firestore
 *  - getLeaderboard : 讀取排行榜（可依 classCode / difficulty / seed filter）
 *  - dailySnapshot  : 每日晚間 18:00 (Asia/Taipei) 備份 top10
 *  - purgeScore   : admin 才能呼叫，刪除可疑紀錄
 *
 * 安全設計：
 *  - Firestore Rules 禁止任何 client 直寫 scores
 *  - Cloud Function 用 admin SDK 寫，先做：
 *    a) Cloudflare Turnstile 驗證（防腳本灌分；secret 未設則 fail-open）
 *    b) IP 速率限制（記憶體層，每分鐘 5 次）
 *    c) 分數合理性檢查（不可超過理論最高）
 *    d) 欄位 schema 驗證
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

// Turnstile secret 從 Firebase Secrets Manager 讀；未設時 fail-open（跳過驗證）
const turnstileSecret = defineSecret("TURNSTILE_SECRET");

// ── 共用：難度理論最高分檢查表 ────────────────────────────
const DIFFICULTY_MAX_BASE: Record<string, { orb: number; time: number }> = {
  easy: { orb: 8, time: 180 },
  normal: { orb: 12, time: 150 },
  hard: { orb: 18, time: 180 },
  nightmare: { orb: 24, time: 200 },
};

function maxPossibleScore(difficultyId: string): number {
  const def = DIFFICULTY_MAX_BASE[difficultyId] ?? DIFFICULTY_MAX_BASE.normal;
  // 每球 100 + 剩餘秒 × 10（再加少許 buffer 給道具時間獎勵）
  return def.orb * 100 + (def.time + 60) * 10;
}

// ── 共用：IP rate limit（記憶體層；單 instance 內有效） ─────
const rateLimits = new Map<string, number[]>();
function checkRate(ip: string): boolean {
  const now = Date.now();
  const arr = (rateLimits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (arr.length >= 5) return false;
  arr.push(now);
  rateLimits.set(ip, arr);
  return true;
}

// ── 共用：Turnstile 驗證 ──────────────────────────────────
async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = turnstileSecret.value();
  if (!secret || secret === "PLACEHOLDER_NOT_CONFIGURED") {
    // fail-open：本地 dev / 尚未啟用 Turnstile 時跳過驗證
    return true;
  }
  if (!token) return false;
  try {
    const r = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
      },
    );
    const j = (await r.json()) as { success: boolean };
    return j.success === true;
  } catch (err) {
    console.error("[Turnstile] verify failed:", err);
    // fail-closed：Cloudflare 故障時擋下，避免 bot 趁機灌分
    return false;
  }
}

// ── submitScore ──────────────────────────────────────────
export const submitScore = onCall(
  {
    secrets: [turnstileSecret],
    region: "asia-east1",
    maxInstances: 10,
    cors: true,
  },
  async (request) => {
    const ip =
      (request.rawRequest.headers["x-forwarded-for"] as string)?.split(",")[0] ??
      request.rawRequest.ip ??
      "unknown";

    if (!checkRate(ip)) {
      throw new HttpsError(
        "resource-exhausted",
        "Too many requests, please wait a moment.",
      );
    }

    const data = request.data ?? {};
    const {
      nickname,
      score,
      timeLeft,
      classCode,
      difficulty,
      seed,
      turnstileToken,
    } = data;

    // 1. Schema 驗證
    if (typeof nickname !== "string" || nickname.length < 1 || nickname.length > 4) {
      throw new HttpsError(
        "invalid-argument",
        "nickname must be 1-4 chars",
      );
    }
    if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 999999) {
      throw new HttpsError("invalid-argument", "invalid score");
    }
    if (typeof timeLeft !== "number" || !Number.isFinite(timeLeft) || timeLeft < 0 || timeLeft > 300) {
      throw new HttpsError("invalid-argument", "invalid timeLeft");
    }
    const validDifficulties = ["easy", "normal", "hard", "nightmare"];
    if (typeof difficulty !== "string" || !validDifficulties.includes(difficulty)) {
      throw new HttpsError("invalid-argument", "invalid difficulty");
    }
    if (classCode !== undefined && classCode !== null && typeof classCode !== "string") {
      throw new HttpsError("invalid-argument", "invalid classCode");
    }
    if (seed !== undefined && seed !== null && typeof seed !== "string") {
      throw new HttpsError("invalid-argument", "invalid seed");
    }

    // 2. 分數合理性
    if (score > maxPossibleScore(difficulty)) {
      throw new HttpsError(
        "invalid-argument",
        `score ${score} exceeds theoretical max for ${difficulty}`,
      );
    }

    // 3. Turnstile 驗證
    const turnstileVerified = await verifyTurnstile(turnstileToken);
    if (!turnstileVerified) {
      throw new HttpsError(
        "permission-denied",
        "Turnstile verification failed",
      );
    }

    // 4. 寫入 Firestore
    const doc = await db.collection("scores").add({
      nickname: nickname.trim(),
      score,
      timeLeft,
      classCode: classCode ? String(classCode).trim() : null,
      difficulty,
      seed: seed ? String(seed) : null,
      date: new Date().toISOString(),
      turnstileVerified,
      ip,  // 給 admin 後台追查可疑紀錄
      ua: (request.rawRequest.headers["user-agent"] ?? "").toString().slice(0, 200),
    });

    return { id: doc.id, ok: true };
  },
);

// ── getLeaderboard ──────────────────────────────────────
export const getLeaderboard = onCall(
  {
    region: "asia-east1",
    maxInstances: 5,
    cors: true,
  },
  async (request) => {
    const data = request.data ?? {};
    const { classCode, difficulty, seed, limit = 10 } = data;
    const cappedLimit = Math.min(50, Math.max(1, Number(limit) || 10));

    let q: FirebaseFirestore.Query = db.collection("scores");
    if (typeof classCode === "string" && classCode) {
      q = q.where("classCode", "==", classCode);
    }
    if (typeof difficulty === "string" && difficulty) {
      q = q.where("difficulty", "==", difficulty);
    }
    if (typeof seed === "string" && seed) {
      q = q.where("seed", "==", seed);
    }
    q = q.orderBy("score", "desc").limit(cappedLimit);

    const snap = await q.get();
    return snap.docs.map((d) => {
      const v = d.data();
      // 不暴露 ip / ua 給前端
      return {
        id: d.id,
        nickname: v.nickname,
        score: v.score,
        timeLeft: v.timeLeft,
        classCode: v.classCode ?? undefined,
        difficulty: v.difficulty,
        seed: v.seed ?? undefined,
        date: v.date,
      };
    });
  },
);

// ── purgeScore（admin only）──────────────────────────────
export const purgeScore = onCall(
  {
    region: "asia-east1",
    maxInstances: 3,
    cors: true,
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Login required.");
    }
    const adminDoc = await db.collection("admins").doc(uid).get();
    if (!adminDoc.exists) {
      throw new HttpsError("permission-denied", "Not an admin.");
    }
    const { scoreId } = request.data ?? {};
    if (typeof scoreId !== "string" || !scoreId) {
      throw new HttpsError("invalid-argument", "scoreId required");
    }
    await db.collection("scores").doc(scoreId).delete();
    return { ok: true };
  },
);

// ── dailySnapshot（每天 18:00 Asia/Taipei）──────────────────
export const dailySnapshot = onSchedule(
  {
    schedule: "0 18 * * *",
    timeZone: "Asia/Taipei",
    region: "asia-east1",
  },
  async () => {
    const top = await db
      .collection("scores")
      .orderBy("score", "desc")
      .limit(10)
      .get();
    const dateStr = new Date().toISOString().slice(0, 10);
    await db.collection("dailySnapshots").doc(dateStr).set({
      date: new Date().toISOString(),
      top: top.docs.map((d) => {
        const v = d.data();
        return {
          id: d.id,
          nickname: v.nickname,
          score: v.score,
          difficulty: v.difficulty,
          classCode: v.classCode ?? null,
        };
      }),
    });
    console.log(`[dailySnapshot] Saved ${top.size} scores for ${dateStr}`);
  },
);
