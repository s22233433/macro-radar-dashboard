# MEMORY.md

## Project Facts
- 專案用途是維護 Daily《宏觀投資雷達報告》與可讀取歷史報告的靜態 Dashboard。
- 目前報告檔名格式為 `macro-radar-daily-YYYY-MM-DD.md`。
- Dashboard 會從 markdown 報告抽取市場快照、事件、投資決策與全文內容。

## Report Conventions
- 報告固定包含 10 個部分與開頭 7 個核心問題。
- 市場快照表固定追蹤：`DXY`、`USDJPY`、`EURJPY`、`US10Y`、`US2Y`、`JP10Y`、`Gold`、`Silver`、`Nikkei225`、`TOPIX`、`S&P500`、`Nasdaq100`、`VIX`、`WTI`。
- 立場輸出固定使用：`強烈看多 / 看多 / 中性 / 看空 / 強烈看空`。
- 最後一句固定使用：`如果只能持有一種資產未來90天，我會選擇 ______，因為 ______。`
- 投資建議不得只靠消息面；五大資產都必須檢查消息面、價格結構、量能/替代量能、觸發條件、失效條件與信心。

## Operational Notes
- 生成新報告後，如需讓 Dashboard 反映最新內容，執行 `node scripts/build-data.js`。
- 若同日已有報告，先比對是否要覆寫同日期檔案，再更新資料集。
- `2026-07-01`: 同日雙報告改為不覆蓋模式：早報使用 `macro-radar-daily-YYYY-MM-DD.md`，晚間短版使用 `macro-radar-decision-YYYY-MM-DD.md`；若目標檔已存在，改用 `YYYY-MM-DD-HHMM` 後綴。
- `2026-07-01`: Dashboard 支援 `Decision` 類型；同日期排序為 `Decision` 優先於 `Daily`，篩選器包含 `全部 / 日報 / 決策短報 / 週報`，價格視圖仍只使用正式 Daily。
- `2026-07-01`: 晚間 `Decision Update` 自動化固定用台北時間 `20:45`（美國夏令時間約等於紐約 `08:45`），用於美國 08:30 ET 主要數據後、美股開盤前更新投資決策；短報仍必須包含 `市場快照`、`前一交易日日K`、`第十部分：投資決策` 以匹配 Dashboard。不要用 `DTSTART;TZID=America/New_York`，App 曾顯示成台北凌晨排程。
- `2026-07-01`: 週六新增 `Weekly Decision Review`，重點復盤本週 Daily/Decision/Weekly 的投資決策品質；評分維度為方向判斷、關鍵價位/利率、事件解讀、風險控制、信心校準，少於 3 筆明確決策不硬算命中率。
- `2026-07-01`: Daily 與 Decision Update 改為 `reasoning_effort=medium` 加增量式提示；速度優化只能省略重複背景與低影響重查，重大數據日、央行訊息、資料矛盾、價格突破失效條件、五大資產立場可能改變時，仍必須完整核查。
- `2026-07-01`: Daily、Decision Update、Weekly 都加入 B 方案量價門檻：消息面和量價面不一致時，投資建議必須降級為中性/觀望/等待突破；外匯、利率等無集中成交量市場用 CFTC 部位、期貨/ETF 成交量、波動率、收益率曲線斜率、價格區間突破作替代量能。

## Session Notes
- `2026-06-17`: 工作區原本缺少 `AGENTS.md` 與 `MEMORY.md`；因 `~/.codex/templates/` 不存在，改以最小可用內容手動建立。
- `2026-06-17`: Daily 報告可直接覆寫同日期 `macro-radar-daily-YYYY-MM-DD.md`，之後執行 `node scripts/build-data.js` 即可讓 dashboard 納入最新內容。
- `2026-06-17`: 本專案的 Daily 報告應明確標注 Fed 主席交接日期；截至 `2026-05-22` 現任主席為 `Kevin Warsh`，`Powell` 已非主席。
- `2026-06-17`: 市場快照若跨資產缺乏完全同步免費資料，可用 5 交易日與 4 週近似值並以 `~` 標示，parser 可正常解析。
- `2026-06-18`: `2026-06-17` FOMC 已落地，後續 Daily 報告不應再沿用 `等待 FOMC` 敘事；基準狀態改為 `Warsh 鷹派重定價 + BOJ 已升至 1.0%`。
- `2026-06-18`: 用 Yahoo Finance chart 資料做市場快照時，`chartPreviousClose` 對黃金、原油與部分日本資產可能失真；日變化應優先用最新序列點對前一個有效 close 重新計算。
- `2026-06-19`: 若 Daily 在日本 `08:30 JST` 前執行，而當日是日本全國 CPI 發布日，必須明確寫出 `尚未公布`，並以最新已公布的全國 CPI 作背景，不可預先假設結果。
- `2026-06-19`: Carry trade 監控優先使用 `CFTC Traders in Financial Futures` 的 `Leveraged Funds` 日圓部位，不要只看籠統的 `non-commercial`；截至 `2026-06-09` 的更新，槓桿資金仍為明顯日圓淨空。
- `2026-06-19`: 若同日 rerun 已經跨過日本 `08:30 JST` 全國 CPI 發布時間，應直接覆寫同日期報告，把 `尚未公布` 敘事改成官方數值與盤面反應，不另開新檔。
- `2026-06-19`: 日本股指同日即時 rerun 可優先用 `JPX` 的分鐘更新來源 `https://www.jpx.co.jp/market/indices/e_indices_stock_price3.txt`；其中 `TOPIX` 可取即時值，週/月變化仍可用 `1348.T` proxy 並以 `~` 標示。
- `2026-06-20`: 若 Daily 落在美國 `Juneteenth` 等假日之後、而日本與外匯/商品市場仍有更新，報告可混用 `美股上一個現貨收盤 + 日本最新現貨收盤 + 截稿前外匯/商品電子盤`，但必須在註記中明確寫出各市場日期口徑。
- `2026-06-20`: BOJ 近 7 天若沒有新的 `Ueda` 發言，可改用 `6/16` 決議與 `6/19` `Himino` 的國會半年度報告更新 hawkishness 判讀，並明說 `Ueda` 近 7 天無新口徑。
- `2026-06-20`: 若同日清晨版已先產出、之後又跨過外匯與商品的完整周五收盤，應直接覆寫同日期報告；即使美股仍停留在假日前一日收盤，`DXY` 與金銀油的日變化也可能明顯改變。
- `2026-06-20`: `scripts/report-data.js` 會自動 ingest `*weekly*.md`；Weekly 報告可直接命名為 `macro-radar-weekly-YYYY-MM-DD.md`，之後執行 `node scripts/build-data.js` 即可讓 dashboard 收到。
- `2026-06-20`: Weekly《宏觀投資雷達報告》若覆蓋 `2026-06-15` 到 `2026-06-20` 這種事件密集週，應明確寫出敘事切換順序：`油價/和平交易 -> BOJ 升息落地 -> FOMC 鷹派重定價 -> 強美元下的集中式 AI risk-on`，不要只複製最後一天立場。
- `2026-06-21`: 週末 Daily 可直接新建當日檔案；若美股因假日停留在 `2026-06-18`、日本股市停在 `2026-06-19`、外匯則更新到 `2026-06-20`，要在註記中明確寫出混合日期口徑，並維持 `Warsh higher-for-longer + BOJ gradual normalization + USD/JPY intervention watch` 的主線。
- `2026-06-22`: 日本財務省英文站的 `jgbcme.csv` 可直接作為 `JP2Y/JP10Y` 官方 CSV 來源；若當月資料筆數不足以回推 4 週，月變化可沿用最接近的跨月近似並以 `~` 標示。
- `2026-06-22`: 週一亞洲早盤的 Daily 可出現 `美股/美債停在上一個美國交易日、日股停在上一個日本收盤、FX/金銀油已更新到週一電子盤` 的混合口徑；這不是例外，必須在註記中直接寫明。
- `2026-06-23`: 日本財務省 JGB 當月 current CSV 的正確英文路徑是 `https://www.mof.go.jp/english/policy/jgbs/reference/interest_rate/jgbcme.csv`；若要算 4 週近似，需與 `historical/jgbcme_all.csv` 併用。
- `2026-06-23`: `CFTC Traders in Financial Futures` 截至 `2026-06-16` 的 `Leveraged Funds` 日圓部位為 `93,889` 口多單、`190,661` 口空單，淨空約 `96,772` 口；這代表 only modest short reduction，不足以定義成 carry unwind。
- `2026-06-24`: 若 Daily 截稿時點已在日本收盤後、但美股尚未開盤，可採 `美股/美債前一日美國收盤 + 日本當日收盤 + 截稿前 FX/金銀油電子盤` 的混合口徑；`2026-06-24` 就是此案例。
- `2026-06-24`: `BOJ` 在 `2026-06-24` 發布的 `Summary of Opinions at the Monetary Policy Meeting on June 15 and 16, 2026` 應納入當日 hawkishness 判讀；其重點是 underlying CPI 上行風險、持續升息傾向，以及 `2027-04` 起 JGB 月購買量約 `2 兆日圓`。
- `2026-06-25`: 若 Daily 截稿在美國 `Personal Income and Outlays / PCE` 發布前（例如 `2026-06-25 08:30 EDT` 前），PCE 必須列入風險雷達與 `尚未公布` 狀態，不可寫成既成事實。
- `2026-06-25`: `JPX` 的 `e_indices_stock_price3.txt` 可能不是 `utf-8`，自動抓取時要對 `cp932 / Shift_JIS` 做 fallback；若 `Nikkei225` 盤中可靠來源不足，可維持前一日完整收盤、同時把 `TOPIX` 更新到 JPX 即時值並在註記說明口徑。
- `2026-06-26`: 若 Daily 截稿已跨過美國 `PCE` 與日本 `東京 CPI` 公布時點，兩者都應從 `風險雷達待公布` 轉成 `主敘事輸入`；未來 30 天事件表不再重列已落地事件。
- `2026-06-26`: 若 `Yahoo Finance` 的同日 `Nikkei225` 盤中報價與 `JPX` 官方 `TOPIX` 即時走勢明顯衝突，應優先保守採用 `Nikkei225` 前一日完整收盤與 `JPX` 官方 `TOPIX` 即時值，不把可疑的盤中 Nikkei 數字硬寫進報告。
- `2026-06-27`: 若 Daily 落在台北周六早晨、已跨過紐約周五收盤，可把 `DXY`、`FX`、`金銀油`、`美股` 統一寫成 `周五完整收盤`；但 `JP10Y/JP2Y` 仍可能只到 `前一個日本工作日`，要在註記寫清楚。
- `2026-06-27`: 若 `Yahoo Finance` 的 `Nikkei225` 日線與 `JPX` 官方 `TOPIX` 收盤方向明顯衝突，`Nikkei225` 可改用 `FRED NIKKEI225` 日收盤作保守 fallback，避免沿用可疑的 Yahoo close。
- `2026-06-27`: 本週 Weekly（`macro-radar-weekly-2026-06-27.md`）的主線應從上週的 `強美元下的集中式 AI risk-on` 切換成 `PCE 確認 higher-for-longer + 美債防守買盤 + 股市去擁擠`；結論是 `美元看多、日圓看空、黃金看空、日股中性、美股中性`。
- `2026-06-27`: Weekly carry trade 判讀若最新 `CFTC Leveraged Funds` 日圓仍接近 `9.7 萬口` 淨空、且 `USD/JPY` 未出現急跌，應維持 `Carry Trade 風險：高`，不能只因官方干預警戒升高就寫成已經 unwind。
- `2026-06-27`: Dashboard 的 `每日投資決策` 區塊會在日期欄標示 `Daily/Weekly` 與星期；建議變化需同類型比較（Daily 對前一份 Daily，Weekly 對前一份 Weekly），並提供 `建議走勢 / 市場價格` 切換。
- `2026-06-27`: Dashboard 的看多/看空格子會同步顯示對應市場價格與較前一份同類型報告的漲跌；映射為 `美元=DXY`、`日圓=USDJPY`、`黃金=Gold`、`日股=Nikkei225`、`美股=S&P500`。
- `2026-06-27`: Dashboard 中 `日圓=USDJPY` 的價格漲跌顏色需反轉：`USDJPY` 上漲代表日圓走弱，標紅；`USDJPY` 下跌代表日圓走強，標綠。價格格子若報告有 `本報告截稿時間`，需顯示截稿時間。
- `2026-06-27`: Dashboard 的報告截稿時間應顯示在決策矩陣日期欄下方，不要在每個看多/看空格子重複；決策矩陣需提供 `全部 / 日報 / 週報` 篩選。
- `2026-06-28`: 週六、週日不產出 Daily 報告；Dashboard build 會跳過週末 Daily，週末只保留 Weekly。已刪除既有週末 Daily：`2026-06-20`、`2026-06-21`、`2026-06-27`。
- `2026-06-28`: Dashboard 的 `市場價格` 走勢只保留五個投資建議資產：`美元/DXY`、`日圓/USDJPY`、`黃金/Gold`、`日股/Nikkei225`、`美股/S&P500`；優先使用 `data/market-daily-k.json` 的日 K，並在 K 線上用小圓點標記當天資產建議。
- `2026-06-28`: 未來 Daily 報告需在市場快照後附 `前一交易日日K` 表，欄位至少包含 `資產 / 指標 / 日期 / 開盤 / 最高 / 最低 / 收盤`，讓 dashboard 之後可直接從報告解析日 K。
- `2026-06-28`: Dashboard 的 `市場價格` 不再分成五層 row；改用一個共用大 K 線圖，透過五個資產 chip 切換 `美元/DXY`、`日圓/USDJPY`、`黃金/Gold`、`日股/Nikkei225`、`美股/S&P500`。
- `2026-06-28`: Dashboard 共用 K 線圖中，`日圓/USDJPY` 的建議小圓點顏色也必須反向；因圖表標的是 `USDJPY`，`日圓看空` 應顯示為 USDJPY 多頭色，`日圓看多` 應顯示為 USDJPY 空頭色。
- `2026-06-28`: Dashboard 共用 K 線圖的每根 K 棒與建議小圓點都應提供可見 hover tooltip，不依賴瀏覽器原生 SVG title；內容包含日期、星期、當天建議與中文 `開/高/低/收`。
- `2026-06-28`: `daily` automation 若落在週六或週日，應直接 skip 新建 `macro-radar-daily-YYYY-MM-DD.md`；除非使用者明確要求覆寫週末規則，否則以最近一份 Weekly 與前一交易日收盤作為週末基準，不落檔也不 rebuild dashboard。
- `2026-06-29`: 週一亞洲早盤的 Daily 可直接沿用 `前一個美國周五收盤 + 前一個日本周五收盤 + 週一早盤 FX/金銀油電子盤` 的混合口徑；若 30 天事件窗已涵蓋 `2026-07-28` 到 `2026-07-29` 的 FOMC，應納入風險雷達，而 `2026-07-30` 到 `2026-07-31` 的 BOJ 仍可因超窗而排除。
- `2026-06-29`: Dashboard server 不應再依賴 Codex 前景 session 或單次 background/nohup；已建立 macOS LaunchAgent `/Users/weiting/Library/LaunchAgents/com.weiting.macro-radar-dashboard.plist`，常駐 `/opt/homebrew/bin/node scripts/serve-dashboard.js` 並 KeepAlive `127.0.0.1:8765`。
- `2026-06-30`: 週二亞洲早盤的 Daily 可採 `美股=前一個美國交易日盤中最新 / Treasury=同日官網最新 / 日本現貨=前一個日本交易日完整收盤 / TOPIX=JPX 當日早盤即時 / JGB=最近一個官方可得日` 的混合口徑，但必須在註記中逐一寫清日期與來源。
- `2026-06-30`: 若 `Yahoo ^N225` 日線對日本最新完整收盤 lag 一天，可用 `FRED NIKKEI225` 補最新 close；若還需要同日 `Nikkei225` 的日 K，則用 `Yahoo ^N225` 的 `5m` 圖重建當日 `open/high/low/close`。
- `2026-07-01`: `daily` 自動化改為週一到週五 `08:00`；新增 `decision-update` 自動化（紐約 `08:45`，週一到週五）與 `weekly-decision-review` 自動化（週六 `10:00`）。
- `2026-07-01`: Dashboard 報告排序改用 `本報告截稿時間`，同日報告時間晚者在前；`每日投資決策` 預設為「日報」流，包含早版 Daily 與晚間 Decision Update，並用早版/晚間版不同標籤顏色區分。
- `2026-07-01`: `node scripts/build-data.js` 會先刷新 `data/market-daily-k.json`，再重建 `data/reports-data.js`；若 Yahoo 日K暫時抓取失敗，只跳過 K 線更新並保留舊 dashboard data build。
- `2026-07-01`: Dashboard 的 `每日投資決策` 會從 `第十部分：投資決策` 解析 `assetDecisionMeta`，並在五大資產格子顯示 `量價確認 / 量價未確認 / 量價背離 / 量價缺資料`；舊報告缺少消息面、價格結構、量能欄位時一律顯示 `量價缺資料`。
- `2026-07-01`: Dashboard 已上傳到獨立 private repo `s22233433/macro-radar-dashboard`；不得推到官網 repo `s22233433/s22233433.github.io`，除非使用者明確要求。
- `2026-07-01`: 為了讓其他裝置可直接瀏覽，`s22233433/macro-radar-dashboard` 已改為 public 並啟用 GitHub Pages；線上網址為 `https://zhenguocool.com/macro-radar-dashboard/`。這是獨立 repo，不覆蓋官網首頁。
- `2026-07-01`: Dashboard 排序必須以報告 `日期` 優先，同日期才用 `本報告截稿時間` 排序；不要讓歸檔在前一日的 Decision Update 因截稿時間日期較晚而插到新日期 Daily 前面。
- `2026-07-01`: 本機 `scripts/serve-dashboard.js` 的 API 需每次刷新 `report-parser.js` / `report-data.js` require cache，否則 parser 修正後 `127.0.0.1:8765` 會繼續回舊資料，造成畫面看似沒更新。
