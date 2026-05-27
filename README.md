# 3D 迷宮冒險

> 從 Replit 拔出的獨立 Vite 專案。React 19 + Three.js 第一人稱迷宮探索遊戲。

![Stack](https://img.shields.io/badge/React-19.1-61dafb?logo=react)
![Stack](https://img.shields.io/badge/Three.js-0.184-000000?logo=three.js)
![Stack](https://img.shields.io/badge/Vite-7-646cff?logo=vite)
![Stack](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript)

## 快速開始

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build → dist/
npm run typecheck    # TS 型別檢查
npm run serve        # 預覽 build 結果
```

## 部署到 GitHub Pages

```bash
# 本地驗證
BASE_PATH=/maze-3d-game/ npm run build

# 推 GitHub
git init && git add . && git commit -m "Initial commit"
gh repo create maze-3d-game --public --source=. --push

# 開 Pages（workflow 模式）
gh api -X POST "repos/<USER>/maze-3d-game/pages" -f "build_type=workflow"
```

> **Windows 注意**：用 PowerShell 設 env var（`$env:BASE_PATH = "/maze-3d-game/"`），不要用 Git Bash — 會把 `/maze-3d-game/` 當成檔案路徑改寫。

完整部署 SOP（含 Firebase 雲端排行榜）見 [`../DEPLOYMENT.md`](../DEPLOYMENT.md)。

## 操作

| 動作 | 鍵盤 / 滑鼠 |
| --- | --- |
| 移動 | `W A S D` 或方向鍵 |
| 轉視角 | 滑鼠（先點畫面鎖定）|
| 暫停 / 釋放滑鼠 | `ESC` |
| 開關小地圖 | `P` 或 `` ` `` |

## 目標

- 收集所有藍色光球（每顆 +100 分）
- 在 150 秒內過關
- 過關時 **剩餘秒數 × 10** 為時間獎勵
- 避開紅怪（接觸 −1 HP，3 條心）
- 排行榜記前 3 名（目前用 localStorage）

## 結構

```
src/
├── main.tsx              React 進入點
├── App.tsx               <MazeGame />
├── index.css             全頁深底 + 中文字型
└── game/
    ├── MazeGame.tsx           狀態機 + 計時器
    ├── MazeScene.tsx          Three.js 場景 + 玩家控制 + 敵人 AI
    ├── ParticleBurst.tsx      光球收集粒子特效
    ├── WebGLCheck.tsx         WebGL fallback
    ├── leaderboard.ts         localStorage 排行榜
    ├── maze/
    │   └── MazeGenerator.ts   DFS 隨機迷宮
    └── ui/
        ├── HUD.tsx
        ├── Minimap.tsx
        ├── StartScreen.tsx
        ├── GameOverScreen.tsx
        ├── WinScreen.tsx
        ├── Leaderboard.tsx
        └── DamageOverlay.tsx
```

## 詳細文件

- [`../README.md`](../README.md) — 玩法、設計亮點、技術棧深度說明
- [`../DEPLOYMENT.md`](../DEPLOYMENT.md) — GitHub Pages + Firebase serverless 部署
- [`../IMPROVEMENTS.md`](../IMPROVEMENTS.md) — 30+ 項分級優化清單

---

<sub>Made with ❤️ by 阿凱老師（桃園市龍潭區石門國民小學）</sub>
