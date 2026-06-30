const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OUT_FILE = path.join(ROOT, "data", "market-daily-k.json");
const SOURCE = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=1mo&interval=1d&includePrePost=false&events=history";
const SERIES = {
  usd: ["DXY", "DX-Y.NYB"],
  jpy: ["USDJPY", "JPY=X"],
  gold: ["Gold", "GC=F"],
  japanEquities: ["Nikkei225", "^N225"],
  usEquities: ["S&P500", "^GSPC"],
};

async function fetchCandles(symbol) {
  const url = SOURCE.replace("{symbol}", encodeURIComponent(symbol));
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`${symbol}: ${response.status}`);
  const result = (await response.json()).chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];
  const timestamps = result?.timestamp || [];
  if (!quote || !timestamps.length) return [];
  return timestamps
    .map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      open: quote.open[index],
      high: quote.high[index],
      low: quote.low[index],
      close: quote.close[index],
    }))
    .filter((row) => ["open", "high", "low", "close"].every((key) => Number.isFinite(row[key])))
    .slice(-15);
}

async function updateMarketDailyK() {
  const series = {};
  for (const [key, [indicator, symbol]] of Object.entries(SERIES)) {
    series[key] = { indicator, symbol, candles: await fetchCandles(symbol) };
  }
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, `${JSON.stringify({ generatedAt: new Date().toISOString(), source: SOURCE, series }, null, 2)}\n`);
  console.log(`Updated ${path.relative(ROOT, OUT_FILE)}.`);
}

if (require.main === module) {
  updateMarketDailyK().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { updateMarketDailyK };
