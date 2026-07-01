const fs = require("node:fs");
const path = require("node:path");
const { parseReport } = require("./report-parser.js");

const REPORT_NAME = /(^|\/)(macro-radar-.*\.md|.*daily.*\.md|.*weekly.*\.md|.*report.*\.md)$/i;
const RESERVED_MARKDOWN = /(^|\/)(AGENTS|MEMORY|README)\.md$/i;
const SKIP_DIRS = new Set([".git", "node_modules", "data", "tests", "scripts", "outputs", "work"]);
const TRACKED_INDICATORS = [
  "DXY",
  "USDJPY",
  "US10Y",
  "US2Y",
  "JP10Y",
  "Gold",
  "Silver",
  "Nikkei225",
  "TOPIX",
  "S&P500",
  "Nasdaq100",
  "VIX",
  "WTI",
];

function buildDataset(rootDir) {
  const root = path.resolve(rootDir);
  const reports = findMarkdownReports(root)
    .map((file) => {
      const markdown = fs.readFileSync(file, "utf8");
      const relative = path.relative(root, file).replace(/\\/g, "/");
      return parseReport(markdown, relative);
    })
    .filter((report) => !isWeekendDailyReport(report))
    .sort(compareReports);

  return {
    generatedAt: new Date().toISOString(),
    reportCount: reports.length,
    latest: reports[0] || null,
    previous: reports[1] || null,
    reports,
    timeSeries: buildTimeSeries(reports),
    trackedIndicators: TRACKED_INDICATORS,
  };
}

function findMarkdownReports(rootDir, dir = rootDir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".codex") continue;
    const fullPath = path.join(dir, entry.name);
    const relative = path.relative(rootDir, fullPath).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) found.push(...findMarkdownReports(rootDir, fullPath));
      continue;
    }
    if (entry.isFile() && isReportFile(relative, fullPath)) found.push(fullPath);
  }
  return found;
}

function isReportFile(relativePath, fullPath) {
  if (!/\.md$/i.test(relativePath)) return false;
  if (RESERVED_MARKDOWN.test(relativePath)) return false;
  if (REPORT_NAME.test(relativePath)) return true;
  try {
    const content = fs.readFileSync(fullPath, "utf8");
    return (
      /日期[:：]\s*\d{4}-\d{2}-\d{2}/.test(content) &&
      /先回答七個核心問題/.test(content) &&
      /市場快照/.test(content)
    );
  } catch (_error) {
    return false;
  }
}

function isWeekendDailyReport(report) {
  if (!/daily/i.test(report.filename || report.title || "")) return false;
  const date = report.date ? new Date(`${report.date}T00:00:00`) : null;
  if (!date || Number.isNaN(date.getTime())) return false;
  return date.getDay() === 0 || date.getDay() === 6;
}

function buildTimeSeries(reports) {
  const series = {};
  const chronological = [...reports].sort((a, b) => reportSortKey(a) - reportSortKey(b));
  for (const report of chronological) {
    for (const row of report.snapshot || []) {
      if (!series[row.indicator]) series[row.indicator] = [];
      series[row.indicator].push({
        date: report.date,
        value: row.value,
        latest: row.latest,
        dailyChange: row.dailyChange,
        weeklyChange: row.weeklyChange,
        monthlyChange: row.monthlyChange,
        dailyUnit: row.dailyUnit,
        weeklyUnit: row.weeklyUnit,
        monthlyUnit: row.monthlyUnit,
      });
    }
  }
  return series;
}

function compareReports(a, b) {
  return reportSortKey(b) - reportSortKey(a) || reportRank(b) - reportRank(a) || a.filename.localeCompare(b.filename);
}

function reportSortKey(report) {
  const timestamp = String(report?.markdown || "").match(/本報告截稿時間為\s*`(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
  const date = String(report?.date || "").replace(/\D/g, "");
  if (timestamp) return Number(`${date || `${timestamp[1]}${timestamp[2]}${timestamp[3]}`}${timestamp[4]}${timestamp[5]}`);
  return Number(`${date || "0"}0000`);
}

function reportRank(report) {
  const name = `${report?.filename || ""} ${report?.title || ""}`;
  if (/decision/i.test(name)) return 2;
  if (/daily/i.test(name)) return 1;
  if (/weekly/i.test(name)) return 0;
  return 0;
}

function renderDataScript(dataset) {
  return `window.MACRO_RADAR_DATA = ${JSON.stringify(dataset, null, 2)};\n`;
}

module.exports = {
  TRACKED_INDICATORS,
  buildDataset,
  buildTimeSeries,
  compareReports,
  findMarkdownReports,
  isWeekendDailyReport,
  isReportFile,
  reportRank,
  reportSortKey,
  renderDataScript,
};
