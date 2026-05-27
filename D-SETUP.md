# Phase D 雲端排行榜啟用 SOP

> v0.5.0 已將 Firebase + Cloudflare Turnstile 全套程式碼鋪好。本 SOP 帶您從零到啟用雲端，全程約 **2-3 小時**（含 Firebase 啟用、Cloudflare 註冊、GitHub Secrets、Functions deploy）。
>
> **重要：在執行本 SOP 之前，v0.5.0 已可正常運作（純 localStorage 模式）。本 SOP 完成後雲端排行榜會自動啟用，無需改動程式碼。**

---

## 0. 你需要準備什麼

| 項目 | 來源 | 預估時間 |
| --- | --- | --- |
| Firebase 專案 | https://console.firebase.google.com | 5 分鐘 |
| Cloudflare 帳號 + Turnstile widget | https://dash.cloudflare.com | 10 分鐘 |
| ipad@mail2.smes.tyc.edu.tw 帳號 | 學校 Gmail，已登入 firebase CLI | ✓ |
| cagoooo GitHub 帳號 | 已登入 gh CLI | ✓ |
| PowerShell + Node 22 | 本機已安裝 | ✓ |

---

## 1. 建立 Firebase 專案（5 分鐘）

### 1.1 進 Console 建立

1. 進 https://console.firebase.google.com，左上「新增專案」
2. 專案名稱：`maze-3d-game-prod`（或 `maze-3d-game`，若 ID 重複會自動加亂數）
3. 不啟用 Google Analytics（教學用，省事）
4. 等專案建立完成

### 1.2 本地連結

```powershell
cd H:\Maze\maze-3d-game
firebase use --add --account=ipad@mail2.smes.tyc.edu.tw
# 選 maze-3d-game-prod，alias 設 default
```

> 若 OAuth 卡關報「Cannot run "firebase" in non-interactive mode」：照 skill `firebase-stack-automation` 用 `Start-Process cmd.exe -ArgumentList '/k','firebase login:add'` 開新視窗。

### 1.3 啟用 Firestore

1. Firebase Console → Build → **Firestore Database** → 「建立資料庫」
2. **Production mode**（不是 test mode）
3. Location：**asia-east1**（與 Functions 同 region 省 cross-region 費用）

### 1.4 啟用 Cloud Functions

1. Firebase Console → Build → **Functions** → 「升級專案」
2. Functions 需要 **Blaze 方案**（按量計費），但有免費額度：
   - 200 萬次叫用 / 月
   - 5 萬 read / 5 萬 write per day (Firestore)
   - 學校全年都不會超過

> **保險措施**：進 Google Cloud Console → Billing → **Budgets & alerts** → 設一個 NT$30/月警報 email，超過就通知。實際上學校用量不可能達標。

---

## 2. 拿 Firebase Web app config（3 分鐘）

1. Firebase Console → Project Overview → 齒輪 → **專案設定**
2. 「您的應用程式」→ 點 **Web (</>)** 圖示
3. 應用程式暱稱：`Maze 3D Web`
4. **不要勾** Firebase Hosting（我們用 GitHub Pages）
5. 「註冊應用程式」後會看到 `firebaseConfig` 物件，記下：
   - `apiKey` (AIzaSy...) — 公開可外洩，但建議加 HTTP referrer 限制
   - `projectId` (maze-3d-game-prod)
   - `appId` (1:xxx:web:xxx)

### 2.1 加 API Key 限制（重要！）

依 skill `gcp-api-key-secure-create`：

```powershell
gcloud config set project maze-3d-game-prod --account=ipad@mail2.smes.tyc.edu.tw
# 找到 Browser key（剛建立的）
gcloud services api-keys list --account=ipad@mail2.smes.tyc.edu.tw

# 加 HTTP referrer 限制（只允許從這些網域使用）
gcloud services api-keys update <KEY_ID> `
  --account=ipad@mail2.smes.tyc.edu.tw `
  --allowed-referrers="https://cagoooo.github.io/*","http://localhost:*"
```

---

## 3. 註冊 Cloudflare Turnstile（10 分鐘）

### 3.1 註冊 Cloudflare 帳號

1. 進 https://dash.cloudflare.com → Sign up（免費）
2. Email 驗證

### 3.2 開 Turnstile widget

1. Dashboard 左側 → **Turnstile**
2. 「Add a site」
3. Site name：`Maze 3D Game`
4. Domain：`cagoooo.github.io`（不要加路徑）
5. Widget Mode：**Invisible**（無感）
6. 「Create」
7. 拿到兩個 keys：
   - **Site Key**（公開）— 0x4xxxxxx
   - **Secret Key**（私密）— 0xAxxxxxxxxx

---

## 4. 設定 Firebase secrets + GitHub secrets（10 分鐘）

### 4.1 Firebase Secret Manager（Turnstile secret）

**鐵則：用 pipe 不複製貼上**（依 skill `gcp-api-key-secure-create`）

```powershell
# 設定 Turnstile secret 到 Firebase Functions Secrets Manager
"YOUR_TURNSTILE_SECRET_KEY" | firebase functions:secrets:set TURNSTILE_SECRET `
  --account=ipad@mail2.smes.tyc.edu.tw
# 系統會問版本確認、按 Enter
```

> 若不想啟用 Turnstile（先測試雲端），可跳過此步驟。後端會 fail-open（跳過驗證直接寫入），但任何人都可灌分。**生產環境一定要設**。

### 4.2 GitHub Secrets（給 build 注入前端）

```powershell
cd H:\Maze\maze-3d-game

gh secret set VITE_FIREBASE_API_KEY -b "AIzaSy..."
gh secret set VITE_FIREBASE_PROJECT_ID -b "maze-3d-game-prod"
gh secret set VITE_FIREBASE_APP_ID -b "1:xxx:web:xxx"
gh secret set VITE_FIREBASE_REGION -b "asia-east1"
gh secret set VITE_TURNSTILE_SITE_KEY -b "0x4xxxxxx"
```

確認：
```powershell
gh secret list
```

---

## 5. 更新 GitHub Actions workflow

把 secrets 帶進 build。編輯 `.github/workflows/deploy.yml` 的 `Build` step：

```yaml
      - name: Build
        run: npm run build
        env:
          BASE_PATH: /maze-3d-game/
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_FIREBASE_REGION: ${{ secrets.VITE_FIREBASE_REGION }}
          VITE_TURNSTILE_SITE_KEY: ${{ secrets.VITE_TURNSTILE_SITE_KEY }}
```

---

## 6. 部署 Firestore Rules + Indexes（1 分鐘）

```powershell
cd H:\Maze\maze-3d-game
firebase deploy --only firestore:rules,firestore:indexes `
  --account=ipad@mail2.smes.tyc.edu.tw
```

> Indexes 第一次部署需要 5-10 分鐘建立（Firebase Console → Firestore → Indexes 看進度）。在那之前，含 classCode / difficulty filter 的查詢會 fail。

---

## 7. 部署 Cloud Functions（5-10 分鐘）

```powershell
cd H:\Maze\maze-3d-game\functions
npm install
cd ..

firebase deploy --only functions --account=ipad@mail2.smes.tyc.edu.tw
```

第一次部署常見錯誤：

| 錯誤 | 解法 |
| --- | --- |
| `Repository gcf-artifacts not found` | 第一次 region 啟用，**第二次 `firebase deploy --force` 通常成功** |
| `Cloud Functions requires Blaze` | 進 Console 升級到 Blaze（有免費額度，不會收費） |
| `IAM_PERMISSION_DENIED` | 確認 ipad 帳號是 Owner 或 Editor |
| 部署過後立刻 call 報 500 | 第一次冷啟動較慢，等 30 秒重試 |

詳見 skill [`firebase-ci-troubleshooter`](file:///C:/Users/smes/.claude/skills/firebase-ci-troubleshooter)。

---

## 8. Authorized Domains（給 Google Sign-In 用）

老師後台用 Google Sign-In，要把 GitHub Pages 網域加白名單：

1. Firebase Console → Authentication → Sign-in method
2. 啟用 **Google** sign-in provider
3. 同頁面下方「Authorized domains」加：
   - `cagoooo.github.io`
   - `localhost`（dev）

---

## 9. 第一個管理員 UID

老師後台需要 `admins/{uid}` collection 有對應 doc 才能執行刪除。流程：

1. 進 https://cagoooo.github.io/maze-3d-game/?admin=true
2. 用學校 Google 登入（會跳出 popup）
3. 登入成功後**先把自己的 UID 抄下來**（瀏覽器 DevTools → Application → IndexedDB → firebaseLocalStorage 找 uid，或進 Firebase Console → Authentication → Users 找）
4. 進 Firebase Console → Firestore Database → 「Start collection」`admins`
5. Document ID: 你的 uid
6. Field: `email` = 你的學校 email（隨意，純參考）
7. 儲存

完成後重新整理 `?admin=true` 頁面，刪除按鈕就能用。

---

## 10. 觸發 redeploy 啟用雲端

回到 repo 根：

```powershell
cd H:\Maze\maze-3d-game
git commit --allow-empty -m "ci: trigger redeploy with Firebase secrets"
git push
gh run watch
```

部署完成後，開**無痕視窗**到 https://cagoooo.github.io/maze-3d-game/：

- StartScreen 排行榜會異步從雲端拉資料（首次空的，玩一場後出現）
- 玩家過關 → console 看到 callable function 成功
- 兩台不同裝置玩同一個 `?class=601` → 看到對方紀錄

---

## 11. 驗收清單

- [ ] Firebase 專案 `maze-3d-game-prod` 已建立
- [ ] Firestore Database 已啟用（asia-east1）
- [ ] Cloud Functions 已啟用（Blaze plan）
- [ ] Firestore Rules deployed
- [ ] Firestore Indexes deployed（Console 看是「Enabled」狀態）
- [ ] Cloud Functions deployed（`submitScore` / `getLeaderboard` / `purgeScore` / `dailySnapshot` 都看得到）
- [ ] GitHub Secrets 5 個都設好
- [ ] Workflow yml 已加 env 區段
- [ ] Authorized Domains 加 `cagoooo.github.io`
- [ ] Cloudflare Turnstile site key + secret key 設好
- [ ] 至少一個 admin uid 寫進 `admins` collection
- [ ] 線上 redeploy 跑成功
- [ ] 無痕視窗測試一輪：玩過關 → 雲端寫入 → 排行榜更新
- [ ] 兩台裝置測試班級共享：相同 `?class=601` 看到對方

---

## 12. 月成本預估

| 服務 | 免費額度 | 預估用量（單班 30 人/週 5 次）| 是否超額 |
| --- | --- | --- | --- |
| Firebase Functions | 200 萬叫用/月 | ~3,000 | ❌ |
| Firestore | 5 萬寫/天 + 5 萬讀/天 | ~1,000 寫 + 3,000 讀 | ❌ |
| Cloudflare Turnstile | 1,000,000 次/月 | ~3,000 | ❌ |
| GitHub Pages | 100 GB 流量/月 | < 100 MB | ❌ |

**結論：永遠不會收到帳單**。Blaze 是「按量計費」但免費額度遠超教學用量。

---

## 13. 常見問題

### Q1：我不想用 Cloudflare Turnstile 可以嗎？
A：可以。跳過 §3 + §4.1，後端會 fail-open（跳過驗證直接寫入）。但任何人都可灌分，僅適合內部測試。

### Q2：忘記設 GitHub secret，網站還能跑嗎？
A：可以。前端會 fallback 到 localStorage 模式（與 v0.4.0 行為相同），無 functional regression。

### Q3：要怎麼把學生紀錄清空（學期結束）？
A：兩種方式：
- 進老師後台一筆一筆刪
- Firebase Console → Firestore → scores collection → 全選刪除（要小心）

### Q4：可以做「每週重置排行榜」嗎？
A：可以加一個 Scheduled Function（每週日 23:59 把 scores 搬到 `archived_<week>`）。未來 Phase D 升級時可做。

### Q5：班級代碼會被別班看到嗎？
A：會。`scores` 是全公開讀。若不想看到別班，老師後台用 `filterClass` 篩選，或玩家自己只看自己班的排行榜（前端目前用 classCode 帶進 getLeaderboard）。

### Q6：怎麼換新 admin？
A：Firebase Console → Firestore → admins collection → 加新 doc id = 新 admin uid。或刪除舊的 doc 取消權限。

---

## 14. 啟用後可關閉的東西

完成 §1-§11 後，這些可以**反過來關閉**：

- 不再需要打開 `?admin=true` 頁面（純玩家用）
- 不再需要每次 push 重新跑 deploy（除非改程式碼）
- Pendingscores localStorage queue 會自動清空（玩家上線時 flush）

---

<sub>Made with ❤️ by 阿凱老師（桃園市龍潭區石門國民小學） — D-SETUP v1.0 / 2026-05-27</sub>
