const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("app.js", "utf8");

const sandbox = {
  window: {
    MACRO_RADAR_DATA: { reports: [], trackedIndicators: [] },
    location: { protocol: "file:" },
    setInterval() {},
    setTimeout() {},
  },
  document: {
    addEventListener() {},
    querySelector() {
      return null;
    },
  },
  console,
};
sandbox.globalThis = sandbox;

vm.runInNewContext(
  `${source}
globalThis.__test__ = {
  toneClass,
  indicatorToneClass,
  indicatorBarClass,
  indicatorDirectionClass,
  sparkline,
  snapshotStatusLabel,
};`,
  sandbox
);

const {
  indicatorToneClass,
  indicatorBarClass,
  indicatorDirectionClass,
  sparkline,
  snapshotStatusLabel,
} = sandbox.__test__;

assert.equal(indicatorToneClass("DXY", 0.5), "tone-up");
assert.equal(indicatorToneClass("USDJPY", 0.5), "tone-down");
assert.equal(indicatorToneClass("USDJPY", -0.5), "tone-up");
assert.equal(indicatorBarClass("USDJPY", 0.5), "negative");
assert.equal(indicatorDirectionClass("USDJPY", "up"), "down");
assert.match(sparkline([160, 161], "USDJPY"), /sparkline down/);
assert.equal(
  snapshotStatusLabel({
    markdown: "- 本報告截稿時間為 `2026-06-27 08:35 CST`，對應 `2026-06-27 00:35 UTC`。",
  }),
  "資料時點 2026-06-27 08:35 CST"
);
assert.equal(snapshotStatusLabel({ markdown: "沒有截稿資訊" }), "report snapshot");

console.log("app behavior tests passed");
