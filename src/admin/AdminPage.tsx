/**
 * 老師後台（URL ?admin=true 顯示）
 *
 * - Firebase Authentication Google Sign-In，限學校 hd=mail2.smes.tyc.edu.tw
 * - 列出所有 score 紀錄、可刪除可疑紀錄、可匯出 CSV
 * - 沒設 Firebase secrets 時顯示 fallback「雲端尚未啟用」訊息
 */

import { useEffect, useState, useCallback } from "react";
import {
  cloudEnabled,
  callGetLeaderboard,
  callPurgeScore,
  loginAdmin,
  logoutAdmin,
  watchAuthState,
  type CloudLeaderboardEntry,
} from "../game/firebaseClient";
import { Footer } from "../game/ui/Footer";
import { DIFFICULTIES } from "../game/difficulty";

type AdminUser = { uid: string; email: string | null } | null;

const HOME_URL = (import.meta.env.BASE_URL ?? "/") + "";

function BackToHomeLink({ variant = "light" }: { variant?: "light" | "subtle" }) {
  const isSubtle = variant === "subtle";
  return (
    <a
      href={HOME_URL}
      data-testid="link-back-home"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        marginTop: isSubtle ? 0 : "1.5rem",
        padding: "8px 16px",
        borderRadius: "20px",
        background: isSubtle ? "transparent" : "rgba(0,229,255,0.1)",
        border: `1px solid rgba(0,229,255,${isSubtle ? "0.25" : "0.4"})`,
        color: "#00e5ff",
        textDecoration: "none",
        fontSize: "0.85rem",
        fontFamily: "inherit",
      }}
    >
      ← 回遊戲主畫面
    </a>
  );
}

export function AdminPage() {
  const [user, setUser] = useState<AdminUser>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [scores, setScores] = useState<CloudLeaderboardEntry[]>([]);
  const [filterDiff, setFilterDiff] = useState<string>("");
  const [filterClass, setFilterClass] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub = () => {};
    watchAuthState((u) => {
      setUser(u);
      setLoadingAuth(false);
    }).then((fn) => {
      unsub = fn;
    });
    return () => unsub();
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const list = await callGetLeaderboard({
        difficulty: filterDiff || undefined,
        classCode: filterClass || undefined,
        limit: 50,
      });
      setScores(list);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user, filterDiff, filterClass]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  const handleLogin = async () => {
    try {
      await loginAdmin();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`登入失敗：${msg}`);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setScores([]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除這筆紀錄嗎？")) return;
    try {
      await callPurgeScore(id);
      setScores((s) => s.filter((x) => x.id !== id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`刪除失敗：${msg}`);
    }
  };

  const handleExport = () => {
    const header = ["排名", "暱稱", "班級", "難度", "分數", "剩餘秒", "日期", "seed"];
    const rows = scores.map((s, i) => [
      i + 1,
      s.nickname,
      s.classCode ?? "",
      s.difficulty,
      s.score,
      s.timeLeft,
      s.date,
      s.seed ?? "",
    ]);
    const csv =
      [header, ...rows]
        .map((r) =>
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
        )
        .join("\r\n");
    // 加 BOM 讓 Excel 開啟中文不亂碼
    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maze-scores-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 雲端未啟用
  if (!cloudEnabled) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #0a0a1a 0%, #0d1a2e 50%, #0a0a1a 100%)",
          color: "#fff",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "0.6rem" }}>☁️</div>
        <h2 style={{ color: "#ffaa00", marginBottom: "0.6rem" }}>
          雲端排行榜尚未啟用
        </h2>
        <p
          style={{
            color: "rgba(200,220,255,0.7)",
            textAlign: "center",
            maxWidth: "480px",
            lineHeight: 1.7,
          }}
        >
          老師後台需要 Firebase 雲端排行榜。請依 D-SETUP.md 完成設定後，
          線上版才會顯示這個頁面。本地端可重新整理一次驗證。
        </p>
        <BackToHomeLink />
        <Footer />
      </div>
    );
  }

  // 未登入
  if (loadingAuth) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a1a",
          color: "#00e5ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        驗證身分中…
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #0a0a1a 0%, #0d1a2e 50%, #0a0a1a 100%)",
          color: "#fff",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1
          style={{
            color: "#00e5ff",
            fontSize: "1.8rem",
            marginBottom: "0.5rem",
            letterSpacing: "0.1em",
          }}
        >
          老師後台
        </h1>
        <p
          style={{
            color: "rgba(200,220,255,0.65)",
            marginBottom: "1.5rem",
            textAlign: "center",
            maxWidth: "420px",
          }}
        >
          請使用學校 Gmail（@mail2.smes.tyc.edu.tw）登入。
          僅核可的管理員 UID 可以執行刪除操作。
        </p>
        <p
          style={{
            color: "rgba(200,220,255,0.45)",
            marginBottom: "1.5rem",
            textAlign: "center",
            fontSize: "0.8rem",
          }}
        >
          只是學生不小心跑來這頁？沒事，回主畫面繼續玩 ↓
        </p>
        <BackToHomeLink variant="subtle" />
        <div style={{ height: "1.5rem" }} />
        <button
          onClick={handleLogin}
          style={{
            padding: "0.85rem 2.2rem",
            background: "linear-gradient(135deg, #00e5ff, #0066ff)",
            border: "none",
            borderRadius: "50px",
            color: "#0a0a1a",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          以學校 Google 帳號登入
        </button>
        {error && (
          <div
            style={{
              marginTop: "1rem",
              color: "#ff6699",
              fontSize: "0.85rem",
              maxWidth: "420px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}
        <Footer />
      </div>
    );
  }

  // 已登入：列表
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0e1a",
        color: "#fff",
        padding: "1.5rem",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.2rem",
          flexWrap: "wrap",
          gap: "0.8rem",
        }}
      >
        <div>
          <h1
            style={{
              color: "#00e5ff",
              fontSize: "1.6rem",
              letterSpacing: "0.08em",
            }}
          >
            🛠 老師後台
          </h1>
          <div style={{ fontSize: "0.78rem", color: "rgba(200,220,255,0.55)" }}>
            登入：{user.email ?? user.uid}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <BackToHomeLink variant="subtle" />
          <button
            onClick={handleExport}
            disabled={scores.length === 0}
            style={btnStyle("#ffd700", "#aa8800")}
          >
            📥 匯出 CSV
          </button>
          <button onClick={refresh} disabled={loading} style={btnStyle("#00e5ff", "#0066aa")}>
            ↻ 重新整理
          </button>
          <button onClick={handleLogout} style={btnStyle("#ff6699", "#cc3366")}>
            登出
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.8rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.85rem", color: "rgba(200,220,255,0.7)" }}>
            難度
          </span>
          <select
            value={filterDiff}
            onChange={(e) => setFilterDiff(e.target.value)}
            style={selectStyle}
          >
            <option value="">全部</option>
            {DIFFICULTIES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.emoji} {d.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.85rem", color: "rgba(200,220,255,0.7)" }}>
            班級
          </span>
          <input
            type="text"
            placeholder="例：601"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value.trim())}
            style={{ ...selectStyle, width: "120px" }}
          />
        </label>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(255,102,153,0.12)",
            border: "1px solid rgba(255,102,153,0.35)",
            borderRadius: "8px",
            padding: "0.6rem 1rem",
            color: "#ff99bb",
            marginBottom: "1rem",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          background: "rgba(0,12,28,0.7)",
          border: "1px solid rgba(0,229,255,0.18)",
          borderRadius: "12px",
          overflow: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,229,255,0.18)" }}>
              {["#", "暱稱", "班級", "難度", "分數", "剩餘", "日期", "seed", ""].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: "8px 12px",
                      textAlign: "left",
                      color: "rgba(0,229,255,0.75)",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} style={{ padding: "1.5rem", textAlign: "center", color: "rgba(200,220,255,0.5)" }}>
                  載入中…
                </td>
              </tr>
            )}
            {!loading && scores.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: "1.5rem", textAlign: "center", color: "rgba(200,220,255,0.4)" }}>
                  目前無紀錄
                </td>
              </tr>
            )}
            {scores.map((s, i) => (
              <tr
                key={s.id}
                style={{
                  borderBottom: "1px solid rgba(0,229,255,0.08)",
                  background: i % 2 ? "rgba(0,0,0,0.15)" : "transparent",
                }}
              >
                <td style={tdStyle}>{i + 1}</td>
                <td style={tdStyle}>{s.nickname}</td>
                <td style={tdStyle}>{s.classCode ?? "—"}</td>
                <td style={tdStyle}>{s.difficulty}</td>
                <td style={{ ...tdStyle, color: "#ffd700", fontWeight: 800 }}>{s.score}</td>
                <td style={tdStyle}>{s.timeLeft}s</td>
                <td style={{ ...tdStyle, fontSize: "0.76rem", color: "rgba(200,220,255,0.6)" }}>{s.date.slice(0, 16).replace("T", " ")}</td>
                <td style={{ ...tdStyle, fontSize: "0.76rem", color: "rgba(200,220,255,0.45)" }}>{s.seed ?? "—"}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleDelete(s.id)}
                    style={{
                      background: "rgba(255,51,102,0.18)",
                      border: "1px solid rgba(255,51,102,0.4)",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      color: "#ff6699",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontFamily: "inherit",
                    }}
                  >
                    刪除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "1rem", fontSize: "0.78rem", color: "rgba(200,220,255,0.5)" }}>
        共 {scores.length} 筆。若需新增管理員，請在 Firestore Console
        的 <code>admins</code> collection 加一個 doc id = 該老師 Firebase UID。
      </div>

      <Footer />
    </div>
  );
}

const btnStyle = (color: string, shadow: string): React.CSSProperties => ({
  padding: "0.55rem 1.1rem",
  background: `rgba(${hexToRgb(color)},0.12)`,
  border: `1px solid rgba(${hexToRgb(color)},0.4)`,
  borderRadius: "8px",
  color,
  cursor: "pointer",
  fontSize: "0.85rem",
  fontFamily: "inherit",
  fontWeight: 600,
  boxShadow: `0 0 8px ${shadow}33`,
});

const selectStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.5)",
  border: "1px solid rgba(0,229,255,0.25)",
  borderRadius: "6px",
  padding: "6px 10px",
  color: "#fff",
  fontSize: "0.85rem",
  fontFamily: "inherit",
  outline: "none",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 12px",
  whiteSpace: "nowrap",
};

function hexToRgb(hex: string): string {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return "255,255,255";
  return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}
