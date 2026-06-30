# AGENTS.md

## Project
- Name: `daily-weekly-prompt-1-2-3`
- Purpose: 產出並維護 Daily《宏觀投資雷達報告》與對應靜態 Dashboard。
- Updated: `2026-06-17`
- Stack: `Node.js`, `vanilla JavaScript`, `HTML`, `CSS`, `Markdown`

## Output Contract
- Daily 報告預設使用中文。
- 晚間短版使用 `Decision Update《宏觀投資雷達》`，重點只更新「每日投資決策」是否改變。
- 角色固定為「頂級宏觀基金研究員」。
- 證據視窗預設為最近 7 天，除非官方資料可得性要求更長回看。
- 結尾必須保留：`如果只能持有一種資產未來90天，我會選擇 ______，因為 ______。`
- 觀點輸出需直接回答美元、日圓、黃金、日股、美股的方向與強弱。
- 投資建議不得只靠消息面；必須同時檢查價格結構與量能/替代量能，不確認時要降級為中性、觀望或等待突破。

## Working Rules
- 先更新或新增當日 markdown 報告，再視需要刷新 `data/reports-data.js`。
- 同日期已有報告時，除非使用者明確要求覆寫，改用 `YYYY-MM-DD-HHMM` 檔名後綴，不覆蓋既有報告。
- 週六、週日不產出 Daily 報告；週末只保留 Weekly，Dashboard ingest 也會跳過週末 Daily。
- Daily 報告需在市場快照後附 `前一交易日日K` 表，至少包含 `美元=DXY`、`日圓=USDJPY`、`黃金=Gold`、`日股=Nikkei225`、`美股=S&P500` 的 `日期 / 開盤 / 最高 / 最低 / 收盤`。
- Decision Update 也需包含 `市場快照`、`前一交易日日K`、`投資決策` bullet，讓 Dashboard 可解析。
- 投資決策需對五大資產逐一輸出：消息面、價格結構、量能/替代量能、觸發條件、失效條件、信心。
- 外部宏觀與央行資訊優先使用一手來源：Fed、BLS、BEA、BOJ、日本官方統計、公司 IR。
- 若當下事件尚未發生，不可寫成既成事實，必須在報告中標明截稿時間與事件狀態。

## Useful Commands
- `node scripts/build-data.js`
- `node scripts/serve-dashboard.js`
- `node --test tests/*.test.js`

## File Map
- Daily reports: `macro-radar-daily-YYYY-MM-DD.md`
- Decision updates: `macro-radar-decision-YYYY-MM-DD.md`
- Weekly decision reviews: `macro-radar-decision-review-YYYY-MM-DD.md`
- Dashboard data: `data/reports-data.js`
- Parsing/build scripts: `scripts/`
