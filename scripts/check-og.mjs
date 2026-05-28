/**
 * 線上部署後驗證腳本（依 IMPROVEMENTS.md §12.1.4 + §12.5）。
 *
 * 跑法：
 *   npm run check-og                                 # 預設線上版
 *   npm run check-og -- --url=http://localhost:5173  # 自訂 URL（含預覽）
 *
 * 驗證項目（共 ~20 項）：
 *   - Meta：title / description / lang / viewport / theme-color / canonical / author / robots
 *   - OG：og:type / og:url / og:title / og:description / og:image / og:image:width/height/type/alt / og:locale / og:site_name
 *   - Twitter：twitter:card / twitter:image / twitter:title
 *   - PWA：manifest link / favicon SVG / apple-touch-icon
 *   - SEO：JSON-LD VideoGame / sitemap.xml / robots.txt
 *   - 實際載入：opengraph.png HEAD 200 + content-type / favicon.svg HEAD 200
 *   - cache-bust：og:image 帶 ?v=...
 */

const DEFAULT_URL = "https://cagoooo.github.io/maze-3d-game/";
const argUrl = process.argv.find((a) => a.startsWith("--url="))?.slice(6);
const BASE = (argUrl ?? DEFAULT_URL).replace(/\/$/, "") + "/";

const COLORS = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
};

let passed = 0;
let failed = 0;
let warnings = 0;

function ok(label, detail = "") {
  passed++;
  console.log(`  ${COLORS.green}✓${COLORS.reset} ${label}${detail ? COLORS.dim + " · " + detail + COLORS.reset : ""}`);
}
function fail(label, detail = "") {
  failed++;
  console.log(`  ${COLORS.red}✗ ${label}${COLORS.reset}${detail ? " — " + detail : ""}`);
}
function warn(label, detail = "") {
  warnings++;
  console.log(`  ${COLORS.yellow}⚠ ${label}${COLORS.reset}${detail ? " — " + detail : ""}`);
}

async function fetchText(url) {
  const r = await fetch(url, { redirect: "follow" });
  if (!r.ok) throw new Error(`HTTP ${r.status} — ${url}`);
  return r.text();
}

async function fetchHead(url) {
  return fetch(url, { method: "HEAD", redirect: "follow" });
}

async function main() {
  console.log(`\n${COLORS.bold}🔍 驗證 OG / SEO meta:${COLORS.reset} ${BASE}\n`);

  // ─── 1. 抓 index.html ─────────────────────────────────────
  let html;
  try {
    html = await fetchText(BASE);
    ok("index.html 載入", `${html.length} bytes`);
  } catch (e) {
    fail("index.html 載入失敗", e.message);
    process.exit(1);
  }

  // ─── 2. Meta 基本 ──────────────────────────────────────────
  console.log(`\n${COLORS.dim}--- Meta 基本 ---${COLORS.reset}`);
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  if (titleMatch && titleMatch[1].trim()) {
    ok("title", `"${titleMatch[1]}"`);
  } else fail("title 缺失或空");

  const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
  if (descMatch && descMatch[1].length >= 50 && descMatch[1].length <= 200) {
    ok("meta description", `${descMatch[1].length} 字元`);
  } else if (descMatch) {
    warn("meta description 長度不理想", `${descMatch[1].length} 字（建議 50-200）`);
  } else fail("meta description 缺失");

  if (html.match(/<html[^>]*lang="zh-TW"/)) ok("html lang=zh-TW");
  else fail("html 缺 lang=zh-TW");

  if (html.match(/<meta name="viewport"[^>]*width=device-width/))
    ok("viewport 含 width=device-width");
  else fail("viewport 缺 width=device-width");

  if (html.match(/<meta name="theme-color"/)) ok("theme-color");
  else warn("theme-color 缺");

  if (html.match(/<link rel="canonical"/)) ok("canonical link");
  else fail("canonical link 缺");

  if (html.match(/<meta name="author"/)) ok("author meta");
  else warn("author meta 缺");

  if (html.match(/<meta name="robots"[^>]*content="index/)) ok("robots index, follow");
  else warn("robots meta 缺或未顯式 index");

  // ─── 3. Open Graph ────────────────────────────────────────
  console.log(`\n${COLORS.dim}--- Open Graph ---${COLORS.reset}`);
  const ogChecks = [
    ["og:type", /<meta property="og:type" content="website"/],
    ["og:site_name", /<meta property="og:site_name" content="[^"]+"/],
    ["og:url", /<meta property="og:url" content="https:\/\/[^"]+"/],
    ["og:title", /<meta property="og:title" content="[^"]+"/],
    ["og:description", /<meta property="og:description" content="[^"]+"/],
    ["og:image (絕對 URL)", /<meta property="og:image" content="https:\/\/[^"]+\.(png|jpg|jpeg|webp)/],
    ["og:image:secure_url", /<meta property="og:image:secure_url"/],
    ["og:image:type", /<meta property="og:image:type" content="image\/(png|jpeg|webp)"/],
    ["og:image:width=1200", /<meta property="og:image:width" content="1200"/],
    ["og:image:height=630", /<meta property="og:image:height" content="630"/],
    ["og:image:alt", /<meta property="og:image:alt" content="[^"]+"/],
    ["og:locale=zh_TW", /<meta property="og:locale" content="zh_TW"/],
  ];
  for (const [name, re] of ogChecks) {
    if (re.test(html)) ok(name);
    else fail(name, "未匹配");
  }

  // cache-bust 檢查
  const ogImg = html.match(/<meta property="og:image" content="(https:\/\/[^"]+)"/);
  if (ogImg) {
    if (/\?v=/.test(ogImg[1])) {
      ok("og:image cache-bust", ogImg[1].split("?v=")[1].slice(0, 40));
    } else {
      warn("og:image 沒 ?v=cache-bust（FB / LINE 換圖會卡舊版）");
    }
  }

  // ─── 4. Twitter Card ──────────────────────────────────────
  console.log(`\n${COLORS.dim}--- Twitter Card ---${COLORS.reset}`);
  if (html.match(/<meta name="twitter:card" content="summary_large_image"/))
    ok("twitter:card = summary_large_image");
  else fail("twitter:card 缺或非 summary_large_image");

  if (html.match(/<meta name="twitter:image" content="https/)) ok("twitter:image");
  else fail("twitter:image 缺");

  if (html.match(/<meta name="twitter:title"/)) ok("twitter:title");
  else warn("twitter:title 缺");

  if (html.match(/<meta name="twitter:description"/)) ok("twitter:description");
  else warn("twitter:description 缺");

  // ─── 5. PWA / icons ───────────────────────────────────────
  console.log(`\n${COLORS.dim}--- PWA / icons ---${COLORS.reset}`);
  if (html.match(/<link rel="icon" type="image\/svg\+xml"/)) ok("favicon.svg");
  else fail("favicon.svg 缺");

  if (html.match(/<link rel="apple-touch-icon"/)) ok("apple-touch-icon");
  else fail("apple-touch-icon 缺");

  if (html.match(/<link rel="manifest"/)) ok("manifest link");
  else fail("manifest link 缺");

  if (html.match(/<link rel="alternate icon"[^>]*png/)) ok("PNG fallback icon (alternate)");
  else warn("PNG fallback icon 缺");

  // ─── 6. SEO 結構化資料 ────────────────────────────────────
  console.log(`\n${COLORS.dim}--- SEO 結構化資料 ---${COLORS.reset}`);
  const ldMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  if (ldMatch) {
    try {
      const ld = JSON.parse(ldMatch[1]);
      if (ld["@type"] === "VideoGame") ok("JSON-LD Schema.org VideoGame");
      else warn(`JSON-LD @type=${ld["@type"]}（預期 VideoGame）`);
      if (ld.author?.affiliation?.name?.includes("石門")) ok("JSON-LD 含石門國小");
      else warn("JSON-LD 未含學校名");
    } catch (e) {
      fail("JSON-LD 解析失敗", e.message);
    }
  } else fail("JSON-LD 缺");

  if (html.match(/<link rel="alternate" hreflang="zh-TW"/)) ok("hreflang=zh-TW");
  else warn("hreflang 缺");

  // ─── 7. 實際載入測試 ──────────────────────────────────────
  console.log(`\n${COLORS.dim}--- 實際檔案載入 ---${COLORS.reset}`);
  const filesToCheck = [
    { name: "opengraph.png", url: BASE + "opengraph.png", ct: /image\/png/ },
    { name: "favicon.svg", url: BASE + "favicon.svg", ct: /image\/svg/ },
    { name: "apple-touch-icon.png", url: BASE + "apple-touch-icon.png", ct: /image\/png/ },
    { name: "icon-192.png", url: BASE + "icon-192.png", ct: /image\/png/ },
    { name: "icon-512.png", url: BASE + "icon-512.png", ct: /image\/png/ },
    { name: "manifest.webmanifest", url: BASE + "manifest.webmanifest", ct: /(json|manifest)/ },
    { name: "robots.txt", url: BASE + "robots.txt", ct: /text\/plain/ },
    { name: "sitemap.xml", url: BASE + "sitemap.xml", ct: /(xml|text)/ },
  ];
  for (const f of filesToCheck) {
    try {
      const r = await fetchHead(f.url);
      if (!r.ok) {
        fail(`${f.name} HTTP ${r.status}`);
        continue;
      }
      const ct = r.headers.get("content-type") ?? "";
      const size = r.headers.get("content-length") ?? "?";
      if (f.ct.test(ct)) {
        ok(`${f.name}`, `${size} bytes · ${ct.split(";")[0]}`);
      } else {
        warn(`${f.name} content-type 不符`, `${ct} (期望 ${f.ct})`);
      }
    } catch (e) {
      fail(`${f.name} fetch 失敗`, e.message);
    }
  }

  // ─── 8. robots.txt 內容驗證 ───────────────────────────────
  console.log(`\n${COLORS.dim}--- robots.txt / sitemap.xml 內容 ---${COLORS.reset}`);
  try {
    const robots = await fetchText(BASE + "robots.txt");
    if (/Sitemap:\s*https?:\/\/.+sitemap\.xml/i.test(robots)) ok("robots.txt 含 Sitemap reference");
    else warn("robots.txt 沒寫 Sitemap reference");
    if (/User-agent:\s*\*/i.test(robots)) ok("robots.txt User-agent: *");
    else warn("robots.txt 無 User-agent: *");
  } catch {
    fail("robots.txt 載入失敗");
  }

  try {
    const sitemap = await fetchText(BASE + "sitemap.xml");
    if (/<urlset/.test(sitemap)) ok("sitemap.xml 有效 XML");
    else fail("sitemap.xml 格式錯誤");
    if (/<loc>https:\/\/[^<]+<\/loc>/.test(sitemap)) ok("sitemap.xml 含至少一個 <loc>");
    else fail("sitemap.xml 無 <loc>");
  } catch {
    fail("sitemap.xml 載入失敗");
  }

  // ─── 總結 ────────────────────────────────────────────────
  console.log(`\n${COLORS.bold}──── 總結 ────${COLORS.reset}`);
  console.log(`  ${COLORS.green}✓ 通過 ${passed}${COLORS.reset}`);
  if (warnings > 0) console.log(`  ${COLORS.yellow}⚠ 警告 ${warnings}${COLORS.reset}`);
  if (failed > 0) console.log(`  ${COLORS.red}✗ 失敗 ${failed}${COLORS.reset}`);

  if (failed > 0) {
    console.log(`\n${COLORS.red}❌ 有 ${failed} 項失敗，請修正後重新部署${COLORS.reset}\n`);
    process.exit(1);
  }
  if (warnings > 0) {
    console.log(`\n${COLORS.yellow}⚠️  有 ${warnings} 項警告，但不影響主流程${COLORS.reset}\n`);
  } else {
    console.log(`\n${COLORS.green}✨ 全部通過！可以放心分享連結${COLORS.reset}\n`);
  }

  // 額外提示
  console.log(`${COLORS.dim}延伸驗證（手動）：${COLORS.reset}`);
  console.log(`  · opengraph.xyz: https://www.opengraph.xyz/url/${encodeURIComponent(BASE)}`);
  console.log(`  · FB Debugger:   https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(BASE)}`);
  console.log(`  · Rich Results:  https://search.google.com/test/rich-results?url=${encodeURIComponent(BASE)}`);
  console.log("");
}

main().catch((e) => {
  console.error(`\n${COLORS.red}腳本錯誤：${COLORS.reset}`, e);
  process.exit(2);
});
