const assert = require("node:assert/strict");
const fs = require("node:fs");

const css = fs.readFileSync("styles.css", "utf8");
const panelRule = extractRule(".report-list-panel");
const eventsRule = extractRule(".events-panel");
const readerRule = extractRule(".reader-panel");

assert.ok(panelRule, "report list panel rule should exist");
assert.ok(!/position\s*:\s*sticky/.test(panelRule), "report list panel should not stick while scrolling");
assert.ok(!/top\s*:/.test(panelRule), "report list panel should not reserve sticky top offset");
assert.match(eventsRule, /grid-column\s*:\s*2\s*\/\s*4/, "events panel should align with right-side content");
assert.match(readerRule, /grid-column\s*:\s*2\s*\/\s*4/, "reader panel should align with right-side content");

console.log("layout css tests passed");

function extractRule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [...css.matchAll(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\n\\}`, "g"))];
  assert.ok(matches.length, `${selector} rule should exist`);
  return matches.map((match) => match[1]).join("\n");
}
