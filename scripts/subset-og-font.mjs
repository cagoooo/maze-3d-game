/**
 * 把 Noto Sans TC variable font 精簡成只含 OG 圖 / favicon / share card 用到的字。
 *
 * 流程：
 *   1. 一次性下載完整 VF（11.6 MB）到 scripts/fonts/NotoSansTC-VF.ttf（.gitignore 排除）
 *   2. 跑 npm run subset-og-font 產出兩個 ~100-150 KB 的 subset TTF
 *   3. commit subset TTF
 *   4. build-og.mjs / build-icons.mjs / 個人成績卡片運行時優先用 subset，fallback Windows/Linux/Mac
 *
 * 設計參考：skill og-social-preview-zh §Step 1.2
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import subsetFont from "subset-font";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "fonts", "NotoSansTC-VF.ttf");
const OUT_BOLD = path.join(__dirname, "fonts", "NotoSansTC-Bold-Subset.ttf");
const OUT_REG = path.join(__dirname, "fonts", "NotoSansTC-Regular-Subset.ttf");

if (!existsSync(SRC)) {
  console.error(`❌ 找不到 ${SRC}`);
  console.error("    先跑：curl -sL -o scripts/fonts/NotoSansTC-VF.ttf \\");
  console.error("           'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanstc/NotoSansTC%5Bwght%5D.ttf'");
  process.exit(1);
}

// ─── 列出所有會用到的中文字 ────────────────────────────────────
// 來源：build-og.mjs（OG 圖文案）+ build-icons.mjs（icon「3D」字）+
//      share card runtime（暱稱、班級、得分、時間、難度、排名、署名等）+
//      WinScreen / GameOverScreen 大標題
//
// 範圍寬鬆，預留未來新增字型不用再 subset。
const USED_TEXT = [
  // OG 圖主標 + 副標 + chip
  "3D迷宮冒險",
  "收集藍色光球避開紅巡守者越快通關得分高",
  "桌機觸控搖桿全班排行榜",
  "準備進入",
  // 角標 + 系統訊息
  "通關成功失敗時間到本局已收集生命",
  // 署名
  "桃園市龍潭區石門國民小學阿凱老師制作",
  // 難度名
  "簡單普通困難噩夢",
  // 個人成績卡片
  "玩家分數秒名次第無記錄",
  "我在拿到分了你呢來挑戰",
  // 預留常用日期 / 月份字
  "年月日週一二三四五六日上下午",
  // 數字字（雖然 ASCII 已含，但中文版字形不同會 fallback）
  "零一二三四五六七八九十百千萬",
].join("");

const ASCII =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,:;!?-_/+()|@→❤️🎮📱🏆✓✨↵★●▲◆□" +
  "·\"'\\#$%&*<>=~`^[]{}";

const chars = Array.from(new Set([...USED_TEXT, ...ASCII])).join("");
console.log(`字元數: ${chars.length}`);

const buf = readFileSync(SRC);
console.log(`原始 VF: ${(buf.length / 1024 / 1024).toFixed(2)} MB`);

// VF axis: wght 100-900；取 700 (Bold) 與 400 (Regular)
try {
  const bold = await subsetFont(buf, chars, {
    targetFormat: "truetype",
    variationAxes: { wght: 700 },
  });
  writeFileSync(OUT_BOLD, bold);
  console.log(`✅ NotoSansTC-Bold-Subset.ttf  (${(bold.length / 1024).toFixed(1)} KB)`);

  const reg = await subsetFont(buf, chars, {
    targetFormat: "truetype",
    variationAxes: { wght: 400 },
  });
  writeFileSync(OUT_REG, reg);
  console.log(`✅ NotoSansTC-Regular-Subset.ttf (${(reg.length / 1024).toFixed(1)} KB)`);
} catch (e) {
  // 部分 subset-font 版本不支援 VF axes → 退回不指定軸（會用 default weight）
  console.warn(`⚠️  VF axes subset 失敗，退回不指定軸：${e.message}`);
  const both = await subsetFont(buf, chars, { targetFormat: "truetype" });
  writeFileSync(OUT_BOLD, both);
  writeFileSync(OUT_REG, both);
  console.log(`✅ 兩個檔案都用 default weight (${(both.length / 1024).toFixed(1)} KB each)`);
}

console.log(
  "\n下一步：把 subset TTF commit；build-og.mjs / build-icons.mjs 已寫好 fallback chain，會自動用 subset。",
);
