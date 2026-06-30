const fs = require("node:fs");
const path = require("node:path");
const { buildDataset, renderDataScript } = require("./report-data.js");
const { updateMarketDailyK } = require("./update-market-daily-k.js");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const OUT_FILE = path.join(DATA_DIR, "reports-data.js");

async function main() {
  try {
    await updateMarketDailyK();
  } catch (error) {
    console.warn(`Skipped market daily K update: ${error.message}`);
  }
  const dataset = buildDataset(ROOT);

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, renderDataScript(dataset), "utf8");
  console.log(`Generated ${path.relative(ROOT, OUT_FILE)} from ${dataset.reportCount} report(s).`);
}

main();
