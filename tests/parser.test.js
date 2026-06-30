const assert = require("node:assert/strict");
const { parseReport } = require("../scripts/report-parser.js");

const sample = `# Daily《宏觀投資雷達報告》

日期：2026-06-15

## 先回答七個核心問題

1. 現在市場最主要交易的敘事是什麼？
   中東風險溢價快速回吐。

2. 美元接下來 3 個月偏強還偏弱？
   偏弱。

3. 日圓接下來 3 個月偏升還偏貶？
   偏升。

4. 黃金接下來 3 個月偏漲還偏跌？
   偏漲。

5. 日股接下來 3 個月偏漲還偏跌？
   偏漲。

6. 美股是否處於風險偏好階段？
   是，仍是風險偏好主導。

7. 哪個市場最可能率先出現趨勢反轉？
   日圓，準確說是 USD/JPY。

## 第一部分：市場快照

| 指標 | 最新 | 日變化 | 週變化 | 月變化 |
|---|---:|---:|---:|---:|
| DXY | 99.50 | -0.3% | ~-0.4% | ~+1.0% |
| US10Y | 4.45% | -3bps | ~-8bps | ~+10bps |
| Gold | 4,330/oz | +2.3% | ~flat | ~-8% |

## 前一交易日日K

| 資產 | 指標 | 日期 | 開盤 | 最高 | 最低 | 收盤 |
|---|---|---:|---:|---:|---:|---:|
| 美元 | DXY | 2026-06-14 | 99.1 | 99.8 | 98.9 | 99.5 |
| 日圓 | USDJPY | 2026-06-14 | 158.1 | 159.0 | 157.8 | 158.6 |

## 第九部分：風險雷達

| 日期 | 事件 | 重要度 |
|---|---|---|
| 2026-06-16 | BOJ 利率決議與會後溝通 | ⭐⭐⭐ |

## 第十部分：投資決策

- 美元：\`看空\`
  - 消息面：Warsh higher-for-longer 支撐美元。
  - 價格結構：DXY 跌破短線支撐，和美元看空同向。
  - 量能/替代量能：美債收益率下行，確認美元轉弱。
  - 觸發條件：DXY 重新站上 100 才取消看空。
  - 失效條件：DXY 跌破 98 後加速。
  - 信心：中高
- 日圓：\`看多\`
  - 消息面：BOJ 鷹派，方向支持日圓。
  - 價格結構：USDJPY 尚未跌破區間，價格未確認。
  - 量能/替代量能：CFTC 槓桿資金仍偏空日圓，量能不足。
  - 觸發條件：USDJPY 跌破 157。
  - 失效條件：USDJPY 站回 160。
  - 信心：中
- 黃金：\`看多\`
  - 消息面：避險需求支持黃金。
  - 價格結構：Gold 反而跌破均線，和消息面背離。
  - 量能/替代量能：ETF 流入不足，量能不配合。
  - 觸發條件：Gold 站回 4350。
  - 失效條件：Gold 跌破 4200。
  - 信心：低
- 日股：\`強烈看多\`
- 美股：\`看多\`
`;

const report = parseReport(sample, "macro-radar-daily-2026-06-15.md");

assert.equal(report.title, "Daily《宏觀投資雷達報告》");
assert.equal(report.date, "2026-06-15");
assert.equal(report.coreQuestions.marketNarrative, "中東風險溢價快速回吐。");
assert.equal(report.coreQuestions.usd3m, "偏弱。");
assert.equal(report.coreQuestions.jpy3m, "偏升。");
assert.equal(report.coreQuestions.gold3m, "偏漲。");
assert.equal(report.coreQuestions.japanEquities3m, "偏漲。");
assert.equal(report.coreQuestions.usEquitiesRisk, "是，仍是風險偏好主導。");
assert.equal(report.coreQuestions.firstReversal, "日圓，準確說是 USD/JPY。");

assert.equal(report.snapshot.length, 3);
assert.deepEqual(report.snapshot[0], {
  indicator: "DXY",
  latest: "99.50",
  daily: "-0.3%",
  weekly: "~-0.4%",
  monthly: "~+1.0%",
  value: 99.5,
  dailyChange: -0.3,
  weeklyChange: -0.4,
  monthlyChange: 1,
  dailyUnit: "%",
  weeklyUnit: "%",
  monthlyUnit: "%",
  direction: "down",
  category: "FX",
});
assert.equal(report.snapshot[1].dailyUnit, "bps");
assert.equal(report.snapshot[2].weeklyChange, 0);
assert.deepEqual(report.dailyK[0], {
  key: "usd",
  indicator: "DXY",
  date: "2026-06-14",
  open: 99.1,
  high: 99.8,
  low: 98.9,
  close: 99.5,
});
assert.equal(report.dailyK[1].key, "jpy");

assert.equal(report.events.length, 1);
assert.equal(report.events[0].date, "2026-06-16");
assert.equal(report.events[0].importance, 3);

assert.deepEqual(report.assetStance, {
  usd: "看空",
  jpy: "看多",
  gold: "看多",
  japanEquities: "強烈看多",
  usEquities: "看多",
});

assert.equal(report.assetDecisionMeta.usd.status, "確認");
assert.equal(report.assetDecisionMeta.usd.message, "Warsh higher-for-longer 支撐美元。");
assert.equal(report.assetDecisionMeta.usd.priceStructure, "DXY 跌破短線支撐，和美元看空同向。");
assert.equal(report.assetDecisionMeta.usd.volume, "美債收益率下行，確認美元轉弱。");
assert.equal(report.assetDecisionMeta.usd.trigger, "DXY 重新站上 100 才取消看空。");
assert.equal(report.assetDecisionMeta.usd.invalidation, "DXY 跌破 98 後加速。");
assert.equal(report.assetDecisionMeta.usd.confidence, "中高");
assert.equal(report.assetDecisionMeta.jpy.status, "未確認");
assert.equal(report.assetDecisionMeta.gold.status, "背離");
assert.equal(report.assetDecisionMeta.japanEquities.status, "缺資料");

for (const filename of ["macro-radar-decision-2026-06-30.md", "macro-radar-weekly-2026-06-27.md"]) {
  const typedReport = parseReport(`# Decision Update《宏觀投資雷達》

日期：2026-06-30

## 第十部分：投資決策

- 美元：\`看多\`
  - 消息面：美元敘事偏多。
  - 價格結構：DXY 站上關鍵區間，同向確認。
  - 量能/替代量能：US2Y 維持高位，替代量能配合。
  - 觸發條件：DXY 續守 101。
  - 失效條件：DXY 跌破 100。
  - 信心：中
`, filename);
  assert.equal(typedReport.assetStance.usd, "看多");
  assert.equal(typedReport.assetDecisionMeta.usd.status, "確認");
}

console.log("parser tests passed");
