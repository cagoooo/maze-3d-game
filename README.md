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

---

<!-- BEGIN:PROJECT_GUIDE -->
## 專案導覽

3D 迷宮冒險 — 第一人稱迷宮探索遊戲（React 19 + Three.js）。阿凱老師 / 石門國小

- 專案定位：互動遊戲／遊戲化學習專案
- Repository：`cagoooo/maze-3d-game`
- 可見性：公開
- 主要技術：TypeScript、React、Vite、Three.js、Firebase、Tailwind CSS
- 線上入口：未在 GitHub repository metadata 設定

### 可以怎麼應用

- 課堂暖身、複習活動或學習站任務
- 校慶、闖關或社團活動中的互動挑戰
- 替換題庫、美術、音效與規則後，延伸成其他學科或主題遊戲

這些是依目前專案定位整理的延伸方向，不代表所有情境都已內建完成；實作前請先確認現有功能與資料格式。

### 技術與專案結構

- `README.md`
- `firebase.json`
- `functions`
- `index.html`
- `package.json`
- `public`
- `scripts`
- `src`
- `vite.config.ts`

檔案結構會隨版本演進；若本節與程式碼不一致，以目前預設分支的原始碼為準。

### 本機執行

```bash
npm install
# dev
npm run dev
# build
npm run build
# lint
npm run lint
```
請以 `package.json` 的 `scripts` 為準；若專案需要雲端服務，請先建立自己的環境變數與測試專案。

### 給 AI Agent 的接手指南

1. 先閱讀本 README、`AGENTS.md`（若有）、套件腳本與部署設定。
2. 先找出遊戲狀態、關卡／題庫資料與輸入控制的來源，再調整規則。
3. 更換素材時同步檢查授權、載入路徑、碰撞區域與不同螢幕比例。
4. 修改後至少驗證開始、遊玩、計分／勝負、重新開始，以及手機與桌面版面。
5. 不要捏造尚未存在的功能；README 與實作有落差時，應同時更新文件。
6. 提交前只納入本次任務檔案，並記錄實際執行過的驗證。

### 安全與資料注意事項

- 不要提交 `.env`、服務帳號、API 金鑰、token、學生個資或正式環境匯出資料。
- 使用 Firebase、Supabase、Google API 或其他雲端服務時，請建立自己的測試專案並套用最小權限。
- 若要公開衍生作品，請先確認程式碼、圖片、音訊、字型與教材內容的授權。

### 貢獻與客製化

歡迎依教學現場、活動或工作流程需求進行 fork／客製化。建議在變更說明中交代使用情境、主要修改、測試方式，以及是否影響資料格式或部署設定。
<!-- END:PROJECT_GUIDE -->
