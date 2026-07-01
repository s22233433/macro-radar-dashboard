const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { buildDataset, renderDataScript, reportSortKey } = require("../scripts/report-data.js");

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "macro-radar-data-"));
fs.writeFileSync(
  path.join(tempRoot, "macro-radar-daily-2026-06-15.md"),
  [
    "# Daily《宏觀投資雷達報告》",
    "",
    "日期：2026-06-15",
    "",
    "## 先回答七個核心問題",
    "",
    "1. 現在市場最主要交易的敘事是什麼？",
    "   first narrative",
    "",
    "## 第一部分：市場快照",
    "",
    "| 指標 | 最新 | 日變化 | 週變化 | 月變化 |",
    "|---|---:|---:|---:|---:|",
    "| DXY | 99.0 | -1% | -2% | -3% |",
  ].join("\n"),
  "utf8"
);
fs.writeFileSync(
  path.join(tempRoot, "macro-radar-daily-2026-06-16.md"),
  [
    "# Daily《宏觀投資雷達報告》",
    "",
    "日期：2026-06-16",
    "",
    "- 本報告截稿時間為 `2026-06-16 08:02 CST`。",
    "",
    "## 先回答七個核心問題",
    "",
    "1. 現在市場最主要交易的敘事是什麼？",
    "   second narrative",
    "",
    "## 第一部分：市場快照",
    "",
    "| 指標 | 最新 | 日變化 | 週變化 | 月變化 |",
    "|---|---:|---:|---:|---:|",
    "| DXY | 100.0 | +1% | +2% | +3% |",
  ].join("\n"),
  "utf8"
);
fs.writeFileSync(
  path.join(tempRoot, "macro-radar-decision-2026-06-16.md"),
  [
    "# Decision Update《宏觀投資雷達》",
    "",
    "日期：2026-06-16",
    "",
    "- 本報告截稿時間為 `2026-06-16 20:45 CST`。",
    "",
    "## 先回答七個核心問題",
    "",
    "1. 現在市場最主要交易的敘事是什麼？",
    "   evening decision update",
    "",
    "## 第一部分：市場快照",
    "",
    "| 指標 | 最新 | 日變化 | 週變化 | 月變化 |",
    "|---|---:|---:|---:|---:|",
    "| DXY | 100.5 | +1.5% | +2.5% | +3.5% |",
    "",
    "## 第十部分：投資決策",
    "",
    "- 美元：`看多`",
  ].join("\n"),
  "utf8"
);
fs.writeFileSync(
  path.join(tempRoot, "macro-radar-decision-2026-06-17.md"),
  [
    "# Decision Update《宏觀投資雷達》",
    "",
    "日期：2026-06-16",
    "",
    "- 本報告截稿時間為 `2026-06-17 20:45 CST`。",
    "",
    "## 先回答七個核心問題",
    "",
    "1. 現在市場最主要交易的敘事是什麼？",
    "   cross date decision",
    "",
    "## 第一部分：市場快照",
    "",
    "| 指標 | 最新 | 日變化 | 週變化 | 月變化 |",
    "|---|---:|---:|---:|---:|",
    "| DXY | 100.8 | +1.5% | +2.5% | +3.5% |",
  ].join("\n"),
  "utf8"
);
fs.writeFileSync(
  path.join(tempRoot, "fresh-note-2026-06-17.md"),
  [
    "# Daily《宏觀投資雷達報告》",
    "",
    "日期：2026-06-17",
    "",
    "## 先回答七個核心問題",
    "",
    "1. 現在市場最主要交易的敘事是什麼？",
    "   third narrative",
    "",
    "## 第一部分：市場快照",
    "",
    "| 指標 | 最新 | 日變化 | 週變化 | 月變化 |",
    "|---|---:|---:|---:|---:|",
    "| DXY | 101.0 | +1% | +2% | +3% |",
  ].join("\n"),
  "utf8"
);
fs.writeFileSync(
  path.join(tempRoot, "macro-radar-daily-2026-06-20.md"),
  [
    "# Daily《宏觀投資雷達報告》",
    "",
    "日期：2026-06-20",
    "",
    "## 先回答七個核心問題",
    "",
    "1. 現在市場最主要交易的敘事是什麼？",
    "   weekend daily",
    "",
    "## 第一部分：市場快照",
    "",
    "| 指標 | 最新 | 日變化 | 週變化 | 月變化 |",
    "|---|---:|---:|---:|---:|",
    "| DXY | 102.0 | +1% | +2% | +3% |",
  ].join("\n"),
  "utf8"
);
fs.writeFileSync(
  path.join(tempRoot, "macro-radar-weekly-2026-06-20.md"),
  [
    "# Weekly《宏觀投資雷達報告》",
    "",
    "日期：2026-06-20",
    "",
    "## 先回答七個核心問題",
    "",
    "1. 現在市場最主要交易的敘事是什麼？",
    "   weekend weekly",
    "",
    "## 第一部分：市場快照",
    "",
    "| 指標 | 最新 | 日變化 | 週變化 | 月變化 |",
    "|---|---:|---:|---:|---:|",
    "| DXY | 103.0 | +1% | +2% | +3% |",
  ].join("\n"),
  "utf8"
);
fs.writeFileSync(
  path.join(tempRoot, "AGENTS.md"),
  "# AGENTS.md\n\n这里提到 Daily《宏觀投資雷達報告》、先回答七個核心問題、日期：2026-06-18、市场快照，但它不是报告。\n",
  "utf8"
);
fs.writeFileSync(
  path.join(tempRoot, "MEMORY.md"),
  "# MEMORY.md\n\n这里也提到宏觀投資雷達報告、日期：2026-06-19、第一部分：市場快照，但它不是报告。\n",
  "utf8"
);
fs.mkdirSync(path.join(tempRoot, "data"));
fs.writeFileSync(path.join(tempRoot, "data", "macro-radar-daily-2026-06-17.md"), "# ignored\n", "utf8");

const dataset = buildDataset(tempRoot);

assert.equal(dataset.reportCount, 6);
assert.equal(dataset.latest.date, "2026-06-20");
assert.equal(dataset.previous.date, "2026-06-17");
assert.equal(dataset.timeSeries.DXY.length, 6);
assert.deepEqual(
  dataset.timeSeries.DXY.map((point) => point.date),
  ["2026-06-15", "2026-06-16", "2026-06-16", "2026-06-16", "2026-06-17", "2026-06-20"]
);
assert.ok(
  dataset.reports.findIndex((report) => report.filename === "macro-radar-decision-2026-06-16.md") <
    dataset.reports.findIndex((report) => report.filename === "macro-radar-daily-2026-06-16.md"),
  "same-date later cutoff should sort before earlier report"
);
assert.equal(reportSortKey(dataset.reports.find((report) => report.filename === "macro-radar-decision-2026-06-16.md")), 202606162045);
assert.equal(reportSortKey(dataset.reports.find((report) => report.filename === "macro-radar-decision-2026-06-17.md")), 202606162045);
assert.ok(
  dataset.reports.findIndex((report) => report.filename === "fresh-note-2026-06-17.md") <
    dataset.reports.findIndex((report) => report.filename === "macro-radar-decision-2026-06-17.md"),
  "report date should sort before cutoff date when a decision update is archived under a prior date"
);

const script = renderDataScript(dataset);
assert.ok(script.startsWith("window.MACRO_RADAR_DATA = "));
assert.ok(script.includes('"reportCount": 6'));

console.log("report data tests passed");
