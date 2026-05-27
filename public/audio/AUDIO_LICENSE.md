# 音檔來源與授權

全部音檔來自 **Pixabay**，採 **Pixabay Content License**（CC0 等價、商用免費、無需 attribution，但建議感謝原作者）。

| 檔名 | 用途 | 來源頁面 | 作者 |
| --- | --- | --- | --- |
| `orb-pickup.mp3` | 收集光球音效 | https://pixabay.com/sound-effects/film-special-effects-item-pickup-37089/ | freesound_community |
| `damage.mp3` | 受傷音效 | https://pixabay.com/sound-effects/film-special-effects-damage-40114/ | freesound_community |
| `win.mp3` | 過關音效 | https://pixabay.com/sound-effects/gaming-victory-464016/ | eaglaxle |
| `gameover.mp3` | 失敗音效 | https://pixabay.com/sound-effects/musical-game-over-417465/ | alphix |
| `bgm.mp3` | 背景音樂（黑暗奇幻地下城合成器氛圍）| https://pixabay.com/music/ambient-dark-fantasy-ambient-dungeon-synth-248213/ | deuslower |

[Pixabay Content License](https://pixabay.com/service/license-summary/)：
- ✅ 商用 / 非商用皆可
- ✅ 無需 attribution
- ❌ 不可單獨重新發佈這些音檔（必須是 derivative work 的一部分）
- ❌ 不可用於違反當地法律的內容

替換音檔請依 skill `pixabay-audio-asset-pipeline` 流程：用 Chrome MCP 進 Pixabay 詳細頁 → regex 抓 `cdn.pixabay.com/download/audio/...mp3` → PowerShell `Invoke-WebRequest` 下載。
