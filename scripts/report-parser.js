(function attachParser(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.MacroRadarParser = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function createParser() {
  const CORE_KEYS = [
    "marketNarrative",
    "usd3m",
    "jpy3m",
    "gold3m",
    "japanEquities3m",
    "usEquitiesRisk",
    "firstReversal",
  ];

  const CATEGORY_MAP = {
    DXY: "FX",
    USDJPY: "FX",
    EURJPY: "FX",
    US10Y: "Rates",
    US2Y: "Rates",
    JP10Y: "Rates",
    Gold: "Commodities",
    Silver: "Commodities",
    WTI: "Commodities",
    "Nikkei 225": "Equities",
    Nikkei225: "Equities",
    TOPIX: "Equities",
    "S&P 500": "Equities",
    "S&P500": "Equities",
    "Nasdaq 100": "Equities",
    Nasdaq100: "Equities",
    VIX: "Volatility",
  };

  const STANCE_KEYS = {
    "美元": "usd",
    "日圓": "jpy",
    "日元": "jpy",
    "黃金": "gold",
    "黄金": "gold",
    "日股": "japanEquities",
    "日本股": "japanEquities",
    "美股": "usEquities",
  };
  const ASSET_KEYS = ["usd", "jpy", "gold", "japanEquities", "usEquities"];
  const DECISION_FIELD_LABELS = ["量價狀態", "量價", "消息面", "價格結構", "量能/替代量能", "替代量能", "量能", "觸發條件", "失效條件", "信心"];

  function parseReport(markdown, filename) {
    const text = markdown || "";
    const title = extractTitle(text, filename);
    const date = extractDate(text, filename);
    const coreQuestions = extractCoreQuestions(text);
    const snapshot = extractSnapshot(text);
    const dailyK = extractDailyK(text);
    const events = extractEvents(text);
    const assetStance = extractAssetStance(text);
    const assetDecisionMeta = extractAssetDecisionMeta(text);
    const investmentDecision = extractSection(text, "投資決策");
    const summary = coreQuestions.marketNarrative || firstParagraph(text);

    return {
      filename: filename || "",
      title,
      date,
      summary,
      coreQuestions,
      snapshot,
      dailyK,
      events,
      assetStance,
      assetDecisionMeta,
      investmentDecision,
      markdown: text,
    };
  }

  function extractTitle(text, filename) {
    const match = text.match(/^#\s+(.+)$/m);
    if (match) return cleanInline(match[1]);
    return filename ? filename.replace(/\.md$/i, "") : "Untitled Report";
  }

  function extractDate(text, filename) {
    const direct = text.match(/日期[:：]\s*(\d{4}-\d{2}-\d{2})/);
    if (direct) return direct[1];
    const fromName = String(filename || "").match(/(\d{4}-\d{2}-\d{2})/);
    return fromName ? fromName[1] : "";
  }

  function extractCoreQuestions(text) {
    const section = extractSection(text, "核心問題");
    const answers = {};
    if (!section) return defaultCoreQuestions();

    const regex = /(?:^|\n)\s*(\d+)\.\s+([^\n]+)\n([\s\S]*?)(?=\n\s*\d+\.\s+[^\n]+\n|$)/g;
    let match;
    while ((match = regex.exec(section))) {
      const index = Number(match[1]) - 1;
      const key = CORE_KEYS[index];
      if (!key) continue;
      answers[key] = cleanAnswer(match[3]);
    }

    return Object.assign(defaultCoreQuestions(), answers);
  }

  function defaultCoreQuestions() {
    return CORE_KEYS.reduce((acc, key) => {
      acc[key] = "";
      return acc;
    }, {});
  }

  function extractSnapshot(text) {
    const section = extractSection(text, "市場快照");
    const rows = parseFirstTable(section);
    return rows
      .map((row) => {
        const indicator = normalizeIndicator(row["指標"] || row.indicator || "");
        if (!indicator) return null;
        const daily = row["日變化"] || "";
        const weekly = row["週變化"] || "";
        const monthly = row["月變化"] || "";
        const dailyParsed = parseChange(daily);
        const weeklyParsed = parseChange(weekly);
        const monthlyParsed = parseChange(monthly);

        return {
          indicator,
          latest: cleanInline(row["最新"] || ""),
          daily,
          weekly,
          monthly,
          value: parseNumber(row["最新"] || ""),
          dailyChange: dailyParsed.value,
          weeklyChange: weeklyParsed.value,
          monthlyChange: monthlyParsed.value,
          dailyUnit: dailyParsed.unit,
          weeklyUnit: weeklyParsed.unit,
          monthlyUnit: monthlyParsed.unit,
          direction: directionFromChange(dailyParsed.value),
          category: CATEGORY_MAP[indicator] || inferCategory(indicator),
        };
      })
      .filter(Boolean);
  }

  function extractDailyK(text) {
    const section = extractSection(text, "日K");
    return parseFirstTable(section)
      .map((row) => {
        const indicator = normalizeIndicator(row["指標"] || row["资产"] || row["資產"] || "");
        const asset = cleanInline(row["資產"] || row["资产"] || "");
        return {
          key: STANCE_KEYS[asset] || "",
          indicator,
          date: cleanInline(row["日期"] || ""),
          open: parseNumber(row["開盤"] || row["开盘"] || row.open || ""),
          high: parseNumber(row["最高"] || row.high || ""),
          low: parseNumber(row["最低"] || row.low || ""),
          close: parseNumber(row["收盤"] || row["收盘"] || row.close || ""),
        };
      })
      .filter((row) => row.indicator && row.date && [row.open, row.high, row.low, row.close].every((value) => Number.isFinite(value)));
  }

  function extractEvents(text) {
    const section = extractSection(text, "風險雷達");
    return parseFirstTable(section)
      .map((row) => ({
        date: cleanInline(row["日期"] || ""),
        event: cleanInline(row["事件"] || ""),
        importanceLabel: cleanInline(row["重要度"] || ""),
        importance: parseImportance(row["重要度"] || ""),
      }))
      .filter((event) => event.date || event.event);
  }

  function extractAssetStance(text) {
    const section = extractSection(text, "投資決策");
    const result = {};
    if (!section) return result;

    const regex = /[-*]\s*([^:：\n]+)[:：]\s*`?([^`\n]+)`?/g;
    let match;
    while ((match = regex.exec(section))) {
      const key = STANCE_KEYS[match[1].trim()];
      if (!key) continue;
      result[key] = cleanInline(match[2]);
    }
    return result;
  }

  function extractAssetDecisionMeta(text) {
    const section = extractSection(text, "投資決策");
    const result = defaultAssetDecisionMeta();
    if (!section) return result;

    for (const block of assetDecisionBlocks(section)) {
      const key = STANCE_KEYS[block.asset];
      if (!key) continue;
      const meta = {
        message: extractLabeledValue(block.text, ["消息面"]),
        priceStructure: extractLabeledValue(block.text, ["價格結構"]),
        volume: extractLabeledValue(block.text, ["量能/替代量能", "替代量能", "量能"]),
        trigger: extractLabeledValue(block.text, ["觸發條件"]),
        invalidation: extractLabeledValue(block.text, ["失效條件"]),
        confidence: extractLabeledValue(block.text, ["信心"]),
      };
      meta.status = normalizeVolumePriceStatus(extractLabeledValue(block.text, ["量價狀態", "量價"])) || inferVolumePriceStatus(meta);
      result[key] = meta;
    }
    return result;
  }

  function defaultAssetDecisionMeta() {
    return ASSET_KEYS.reduce((acc, key) => {
      acc[key] = {
        message: "",
        priceStructure: "",
        volume: "",
        trigger: "",
        invalidation: "",
        confidence: "",
        status: "缺資料",
      };
      return acc;
    }, {});
  }

  function assetDecisionBlocks(section) {
    const assetNames = Object.keys(STANCE_KEYS).sort((a, b) => b.length - a.length).map(escapeRegExp).join("|");
    const regex = new RegExp(`^[-*]\\s*(${assetNames})[:：][^\\n]*`, "gm");
    const matches = [...String(section || "").matchAll(regex)];
    return matches.map((match, index) => {
      const start = match.index;
      const end = matches[index + 1]?.index ?? section.length;
      return {
        asset: match[1],
        text: section.slice(start, end).trim(),
      };
    });
  }

  function extractLabeledValue(block, labels) {
    const targets = labels.map(escapeRegExp).join("|");
    const lineRegex = new RegExp(`^(?:[-*]\\s*)?(?:${targets})[:：]\\s*([\\s\\S]*)$`);
    for (const rawLine of String(block || "").split(/\r?\n/)) {
      const match = lineRegex.exec(rawLine.trim());
      if (match) return cleanAnswer(match[1]);
    }
    const allLabels = DECISION_FIELD_LABELS.map(escapeRegExp).join("|");
    const regex = new RegExp(`(?:^|[\\n；;。])\\s*(?:[-*]\\s*)?(?:${targets})[:：]\\s*([\\s\\S]*?)(?=(?:[\\n；;。]\\s*(?:[-*]\\s*)?(?:${allLabels})[:：])|$)`);
    const match = regex.exec(block || "");
    return match ? cleanAnswer(match[1]) : "";
  }

  function normalizeVolumePriceStatus(value) {
    const text = cleanInline(value);
    if (!text) return "";
    if (/缺資料|缺资料|不足以判斷/.test(text)) return "缺資料";
    if (/背離|背离/.test(text)) return "背離";
    if (/未確認|未确认|不確認|不确认/.test(text)) return "未確認";
    if (/確認|确认/.test(text)) return "確認";
    return "";
  }

  function inferVolumePriceStatus(meta) {
    if (!meta.message || !meta.priceStructure || !meta.volume) return "缺資料";
    const text = `${meta.message} ${meta.priceStructure} ${meta.volume}`;
    if (/背離|背离|相反|反向|不配合|反而/.test(text)) return "背離";
    if (/未確認|未确认|不足|不明|等待|尚未|缺乏|未放大|未跟上/.test(text)) return "未確認";
    if (/確認|确认|同向|配合|放量|站上|突破|跌破|延續|延续/.test(text)) return "確認";
    return "未確認";
  }

  function extractSection(text, headingNeedle) {
    const heading = new RegExp("^##\\s+.*" + escapeRegExp(headingNeedle) + ".*$", "m");
    const match = heading.exec(text);
    if (!match) return "";
    const start = match.index + match[0].length;
    const rest = text.slice(start);
    const next = rest.search(/\n##\s+/);
    return (next >= 0 ? rest.slice(0, next) : rest).trim();
  }

  function parseFirstTable(section) {
    if (!section) return [];
    const lines = section
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith("|") && line.endsWith("|"));
    if (lines.length < 2) return [];

    const headerIndex = lines.findIndex((line, index) => {
      const next = lines[index + 1] || "";
      return /\|/.test(line) && /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(next);
    });
    if (headerIndex < 0) return [];

    const headers = splitTableLine(lines[headerIndex]);
    const body = [];
    for (let i = headerIndex + 2; i < lines.length; i += 1) {
      if (!lines[i].includes("|")) break;
      const cells = splitTableLine(lines[i]);
      if (!cells.length) continue;
      const row = {};
      headers.forEach((header, index) => {
        row[header] = cleanInline(cells[index] || "");
      });
      body.push(row);
    }
    return body;
  }

  function splitTableLine(line) {
    return line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cleanInline(cell));
  }

  function parseNumber(value) {
    const normalized = String(value || "").replace(/,/g, "");
    const match = normalized.match(/[-+]?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  }

  function parseChange(value) {
    const raw = String(value || "").trim();
    const lower = raw.toLowerCase();
    if (!raw) return { value: null, unit: "" };
    if (/flat|持平|不變|不变/.test(lower)) return { value: 0, unit: "%" };

    const number = parseNumber(raw);
    let unit = "";
    if (/bps/i.test(raw)) unit = "bps";
    else if (/%/.test(raw)) unit = "%";

    return { value: number, unit };
  }

  function parseImportance(value) {
    const stars = String(value || "").match(/⭐/g);
    if (stars) return stars.length;
    const number = parseNumber(value);
    return number || 0;
  }

  function normalizeIndicator(indicator) {
    const value = cleanInline(indicator);
    const aliases = {
      "Nikkei 225": "Nikkei225",
      "S&P 500": "S&P500",
      "Nasdaq 100": "Nasdaq100",
    };
    return aliases[value] || value;
  }

  function inferCategory(indicator) {
    if (/JPY|DXY|EUR|USD/.test(indicator)) return "FX";
    if (/Y$|10Y|2Y/.test(indicator)) return "Rates";
    if (/Gold|Silver|WTI|Brent/i.test(indicator)) return "Commodities";
    if (/VIX/i.test(indicator)) return "Volatility";
    return "Equities";
  }

  function directionFromChange(change) {
    if (change === null || Number.isNaN(change)) return "flat";
    if (change > 0) return "up";
    if (change < 0) return "down";
    return "flat";
  }

  function cleanAnswer(answer) {
    return cleanInline(
      String(answer || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join(" ")
    );
  }

  function cleanInline(value) {
    return String(value || "")
      .replace(/`/g, "")
      .replace(/\*\*/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function firstParagraph(text) {
    const match = String(text || "")
      .replace(/^#.+$/m, "")
      .match(/\n\n([^#|\n][\s\S]*?)(?=\n\n|$)/);
    return match ? cleanAnswer(match[1]) : "";
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  return {
    parseReport,
    parseFirstTable,
    parseChange,
  };
});
