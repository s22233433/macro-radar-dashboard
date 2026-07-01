const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("index.html", "utf8");
const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("styles.css", "utf8");
const server = fs.readFileSync("scripts/serve-dashboard.js", "utf8");

assert.match(html, /decision-panel/, "dashboard should include a top daily investment decision panel");
assert.match(html, /dailyDecisionGrid/, "decision panel should render every report decision");
assert.match(html, /decisionViewToggle/, "decision panel should expose a trend view toggle");
assert.match(html, /manualRefreshButton/, "market snapshot should expose a manual refresh button");
assert.match(html, /marketMatrix/, "market snapshot should use one combined market matrix");
assert.ok(!html.includes("directionGrid"), "direction judgment should be merged into the market matrix");

assert.match(app, /function renderDailyDecisions/, "app should render per-report investment decisions");
assert.match(app, /function decisionReports/, "decision panel should filter all daily weekly reports");
assert.match(app, /reportType:\s*"Daily"/, "decision panel should default to daily flow");
assert.match(app, /\["Daily", "Decision"\]\.includes\(reportTypeLabel\(report\)\)/, "daily flow should include morning daily and evening decision reports");
assert.match(app, /data-report-type/, "decision panel should expose report type filter buttons");
assert.match(app, /\["Decision", "決策短報"\]/, "decision panel should expose a decision-update filter");
assert.match(app, /function reportSessionLabel/, "decision panel should label morning and evening reports");
assert.match(app, /session-evening/, "decision panel should expose evening styling hooks");
assert.match(app, /decision-change-matrix/, "daily decisions should be shown as a change matrix");
assert.match(app, /decision-change-cell/, "daily decisions should show per-asset change cells");
assert.match(app, /assetPriceIndicators/, "decision cells should map assets to market snapshot indicators");
assert.match(app, /function assetPriceMeta/, "decision cells should show latest price and prior-report move");
assert.match(app, /function assetVolumePriceMeta/, "decision cells should show volume-price confirmation status");
assert.match(app, /assetDecisionMeta/, "decision cells should read parsed investment decision metadata");
assert.match(app, /volume-price-badge/, "decision cells should render a compact volume-price badge");
assert.match(app, /key === "jpy" \? -delta : delta/, "jpy price moves should invert color tone");
assert.match(app, /assetKey === "jpy" \? -score : score/, "jpy stance dots should invert color tone");
assert.match(app, /function reportDataTime/, "decision date headers should show report data time when available");
assert.match(app, /function reportTypeLabel/, "decision headers should distinguish daily and weekly reports");
assert.match(app, /function weekdayLabel/, "decision headers should show weekdays");
assert.match(app, /function renderDecisionPriceTrends/, "decision panel should toggle to daily market price trends");
assert.match(app, /stanceLabels\s*\n\s*\.map/, "price trends should keep the five decision assets");
assert.match(app, /function assetCandles/, "price trends should read daily candles");
assert.match(app, /function candlestick/, "price trends should render daily k candles");
assert.match(app, /建議：\$\{stance \|\| "未標記"\}/, "candles should expose recommendation details on hover");
assert.match(app, /開 \$\{trimNumber\(open\)\} \/ 高 \$\{trimNumber\(high\)\} \/ 低 \$\{trimNumber\(low\)\} \/ 收 \$\{trimNumber\(close\)\}/, "candles should expose OHLC details in Chinese on hover");
assert.match(app, /function wireCandleTooltip/, "candles should use a visible dashboard tooltip");
assert.match(app, /data-price-asset/, "price trends should switch assets in one shared chart");
assert.match(app, /shared-price-card/, "price trends should use one shared chart area");
assert.match(app, /function sparkline/, "price trends should render compact inline charts");
assert.match(app, /function renderMarketMatrix/, "app should render changes and direction together");
assert.match(app, /manualRefreshButton/, "app should wire the manual refresh button");

for (const stanceClass of ["strong-bull", "bull", "neutral", "bear", "strong-bear"]) {
  assert.match(
    css,
    new RegExp(`\\.decision-change-cell\\.${stanceClass}`),
    `decision matrix should color ${stanceClass} cells`
  );
}

assert.match(css, /\.decision-price/, "decision cells should style embedded market prices");
assert.match(css, /\.volume-price-badge/, "decision cells should style volume-price badges");
assert.match(css, /\.volume-price-badge\.vp-confirmed/, "confirmed volume-price badges should have a distinct style");
assert.match(css, /\.volume-price-badge\.vp-diverged/, "diverged volume-price badges should have a distinct style");
assert.match(css, /\.decision-date-head time/, "decision date headers should style embedded data timestamps");
assert.match(css, /\.session-pill\.session-morning/, "dashboard should color morning report labels");
assert.match(css, /\.session-pill\.session-evening/, "dashboard should color evening report labels");
assert.match(css, /\.toggle-group/, "decision controls should group view and report type toggles");
assert.match(css, /\.candles/, "price trends should style candlestick charts");
assert.match(css, /\.stance-dot/, "candlestick charts should mark report stance");
assert.match(css, /\.candle-tooltip/, "candlestick charts should style visible hover tooltip");
assert.match(css, /\.candle-hitbox/, "candlestick charts should enlarge hover targets");
assert.match(css, /\.price-asset-tabs/, "price trends should style shared chart asset tabs");
assert.match(css, /\.shared-price-card/, "price trends should style one shared chart card");

assert.match(server, /function freshDataApi/, "local server should refresh parser and data modules");
assert.match(server, /delete require\.cache\[PARSER_MODULE\]/, "local server should not keep stale parser code");

console.log("dashboard structure tests passed");
