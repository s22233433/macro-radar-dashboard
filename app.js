let data = window.MACRO_RADAR_DATA || { reports: [], trackedIndicators: [] };
let marketDailyK = null;

const state = {
  selectedIndex: 0,
  category: "All",
  selectedFilename: null,
  decisionView: "stance",
  reportType: "Daily",
  priceAsset: "usd",
};

const categoryOrder = ["All", "FX", "Rates", "Equities", "Commodities", "Volatility"];
const overviewItems = [
  ["最新報告日期", (r) => r.date || "--"],
  ["市場主敘事", (r) => r.coreQuestions.marketNarrative || r.summary || "未抽取"],
  ["美元 3M", (r) => r.coreQuestions.usd3m || "未抽取"],
  ["日圓 3M", (r) => r.coreQuestions.jpy3m || "未抽取"],
  ["黃金 3M", (r) => r.coreQuestions.gold3m || "未抽取"],
  ["日股 3M", (r) => r.coreQuestions.japanEquities3m || "未抽取"],
  ["美股 Risk", (r) => r.coreQuestions.usEquitiesRisk || "未抽取"],
  ["最可能先反轉", (r) => r.coreQuestions.firstReversal || "未抽取"],
];

const stanceLabels = [
  ["美元", "usd"],
  ["日圓", "jpy"],
  ["黃金", "gold"],
  ["日股", "japanEquities"],
  ["美股", "usEquities"],
];

const assetPriceIndicators = {
  usd: "DXY",
  jpy: "USDJPY",
  gold: "Gold",
  japanEquities: "Nikkei225",
  usEquities: "S&P500",
};

const stanceScores = {
  "強烈看多": 2,
  "看多": 1,
  "中性": 0,
  "看空": -1,
  "強烈看空": -2,
};

document.addEventListener("DOMContentLoaded", () => {
  renderChrome();
  wireManualRefresh();
  renderDashboard();
  loadMarketDailyK();
  startAutoRefresh();
});

function renderChrome() {
  text("#reportCount", `${data.reportCount || data.reports.length} report(s)`);
  text("#generatedAt", data.generatedAt ? `generated ${formatDateTime(data.generatedAt)}` : "local data");
  text("#refreshStatus", refreshLabel());
  renderCategoryFilters();
  renderDecisionViewToggle();
}

function renderDashboard() {
  const report = currentReport();
  if (!report) {
    document.querySelector(".dashboard-grid").innerHTML = `<section class="empty-state">沒有找到可讀取的報告。</section>`;
    return;
  }
  text("#latestDate", report.date || "--");
  renderOverview(report);
  renderDailyDecisions();
  renderReportList();
  renderSnapshot(report);
  renderStance(report);
  renderComparison(report, data.previous);
  renderEvents(report);
  renderReader(report);
}

function renderDailyDecisions() {
  const el = document.querySelector("#dailyDecisionGrid");
  if (!el) return;
  const reports = decisionReports();
  if (!reports.length) {
    el.innerHTML = `<div class="empty-line">尚無投資決策資料。</div>`;
    return;
  }

  if (state.decisionView === "prices") {
    renderDecisionPriceTrends(el, reports);
    return;
  }

  el.innerHTML = `
    <div class="decision-change-matrix" style="--report-count:${reports.length}">
      <div class="decision-corner">资产</div>
      ${reports.map((report) => `
        <button class="decision-date-head ${reportSessionClass(report)} ${report.filename === currentReport()?.filename ? "active" : ""}" data-filename="${escapeHtml(report.filename)}">
          <div class="report-pills">
            <span class="type-pill">${escapeHtml(reportTypeLabel(report))}</span>
            <span class="session-pill ${reportSessionClass(report)}">${escapeHtml(reportSessionLabel(report))}</span>
          </div>
          <strong>${escapeHtml(report.date || "--")}</strong>
          <small>${escapeHtml(weekdayLabel(report.date))}</small>
          <time>${escapeHtml(reportDataTime(report))}</time>
        </button>
      `).join("")}
      ${stanceLabels
        .map(([label, key]) => `
          <div class="decision-asset-label">${label}</div>
          ${reports
            .map((report, index) => {
              const stance = report.assetStance?.[key] || "未抽取";
              const previousReport = previousSameType(reports, index);
              const previous = previousReport?.assetStance?.[key] || "";
              const delta = decisionDelta(stance, previous);
              const price = assetPriceMeta(report, previousReport, key);
              const volumePrice = assetVolumePriceMeta(report, key);
              return `
                <button class="decision-change-cell ${stanceClass(stanceScores[stance] ?? 0)} ${delta.className}" data-filename="${escapeHtml(report.filename)}">
                  <strong>${escapeHtml(stance)}</strong>
                  <span>${escapeHtml(delta.label)}</span>
                  <div class="volume-price-badge ${volumePrice.className}" title="${escapeHtml(volumePrice.title)}">${escapeHtml(volumePrice.label)}</div>
                  <div class="decision-price">
                    <b>${escapeHtml(price.indicator)}</b>
                    <em>${escapeHtml(price.latest)}</em>
                    <small class="${price.tone}">${escapeHtml(price.move)}</small>
                  </div>
                </button>
              `;
            })
            .join("")}
        `)
        .join("")}
    </div>
  `;

  el.querySelectorAll("[data-filename]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedFilename = button.dataset.filename;
      const index = data.reports.findIndex((report) => report.filename === state.selectedFilename);
      if (index >= 0) state.selectedIndex = index;
      renderDashboard();
    });
  });
}

function previousSameType(reports, index) {
  const type = reportTypeLabel(reports[index]);
  return reports.slice(index + 1).find((report) => reportTypeLabel(report) === type) || null;
}

function decisionReports() {
  const reports = data.reports || [];
  if (state.reportType === "All") return reports;
  if (state.reportType === "Daily") return reports.filter((report) => ["Daily", "Decision"].includes(reportTypeLabel(report)));
  return reports.filter((report) => reportTypeLabel(report) === state.reportType);
}

function assetPriceMeta(report, previousReport, key) {
  const indicator = assetPriceIndicators[key];
  const row = snapshotRow(report, indicator);
  const previous = snapshotRow(previousReport, indicator);
  if (!row) return { indicator: indicator || "--", latest: "--", move: "無價格", tone: "tone-flat" };
  if (!previous || !Number.isFinite(row.value) || !Number.isFinite(previous.value)) {
    return { indicator, latest: row.latest || "--", move: "基準", tone: "tone-flat" };
  }
  const delta = row.value - previous.value;
  const prefix = reportTypeLabel(report) === "Weekly" ? "較前週" : reportTypeLabel(report) === "Decision" ? "較前次" : "較前日";
  const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "→";
  return {
    indicator,
    latest: row.latest || "--",
    move: `${prefix} ${arrow} ${signed(delta)}`,
    tone: toneClass(key === "jpy" ? -delta : delta),
  };
}

function assetVolumePriceMeta(report, key) {
  const meta = report?.assetDecisionMeta?.[key] || {};
  const status = ["確認", "未確認", "背離", "缺資料"].includes(meta.status) ? meta.status : "缺資料";
  const classes = {
    "確認": "vp-confirmed",
    "未確認": "vp-unconfirmed",
    "背離": "vp-diverged",
    "缺資料": "vp-missing",
  };
  const details = [
    meta.message ? `消息面：${meta.message}` : "",
    meta.priceStructure ? `價格結構：${meta.priceStructure}` : "",
    meta.volume ? `量能：${meta.volume}` : "",
    meta.confidence ? `信心：${meta.confidence}` : "",
  ].filter(Boolean);
  return {
    status,
    label: status === "缺資料" ? "量價缺資料" : `量價${status}`,
    className: classes[status],
    title: details.length ? details.join("\n") : "報告未提供足夠量價欄位",
  };
}

function snapshotRow(report, indicator) {
  return (report?.snapshot || []).find((row) => row.indicator === indicator) || null;
}

function reportDataTime(report) {
  const match = String(report?.markdown || "").match(/本報告截稿時間為\s*`([^`]+)`/);
  if (match) {
    const time = match[1].match(/\d{2}:\d{2}\s*[A-Z]+/);
    return time ? `截稿 ${time[0]}` : `截稿 ${match[1]}`;
  }
  return data.generatedAt ? `生成 ${formatDateTime(data.generatedAt)}` : "時間未標記";
}

function reportSessionLabel(report) {
  if (reportTypeLabel(report) === "Weekly") return "週報";
  if (reportTypeLabel(report) === "Decision") return "晚間版";
  const hour = reportCutoffHour(report);
  if (hour === null) return "日報";
  return hour >= 12 ? "晚間版" : "早版";
}

function reportSessionClass(report) {
  const label = reportSessionLabel(report);
  if (label === "晚間版") return "session-evening";
  if (label === "早版") return "session-morning";
  return "session-weekly";
}

function reportCutoffHour(report) {
  const match = String(report?.markdown || "").match(/本報告截稿時間為\s*`\d{4}-\d{2}-\d{2}\s+(\d{2}):\d{2}/);
  return match ? Number(match[1]) : null;
}

function renderDecisionViewToggle() {
  const el = document.querySelector("#decisionViewToggle");
  if (!el) return;
  const views = [
    ["stance", "建議走勢"],
    ["prices", "市場價格"],
  ];
  const types = [
    ["All", "全部"],
    ["Daily", "日報"],
    ["Decision", "決策短報"],
    ["Weekly", "週報"],
  ];
  el.innerHTML = `
    <div class="toggle-group">
      ${views
        .map(([value, label]) => `<button class="view-toggle-button ${state.decisionView === value ? "active" : ""}" data-view="${value}" type="button">${label}</button>`)
        .join("")}
    </div>
    <div class="toggle-group">
      ${types
        .map(([value, label]) => `<button class="view-toggle-button ${state.reportType === value ? "active" : ""}" data-report-type="${value}" type="button">${label}</button>`)
        .join("")}
    </div>
  `;
  el.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.decisionView = button.dataset.view;
      renderDecisionViewToggle();
      renderDailyDecisions();
    });
  });
  el.querySelectorAll("[data-report-type]").forEach((button) => {
    button.addEventListener("click", () => {
      state.reportType = button.dataset.reportType;
      renderDecisionViewToggle();
      renderDailyDecisions();
    });
  });
}

function renderDecisionPriceTrends(el, reports) {
  const dailyReports = reports.filter((report) => reportTypeLabel(report) === "Daily").reverse();
  const selected = stanceLabels.some(([, key]) => key === state.priceAsset) ? state.priceAsset : "usd";
  const selectedLabel = stanceLabels.find(([, key]) => key === selected)?.[0] || "美元";
  const indicator = assetPriceIndicators[selected];
  const candles = assetCandles(selected, dailyReports);
  const latest = candles.at(-1);
  const latestReport = dailyReports.find((report) => report.date === latest?.date);
  const stance = latestReport?.assetStance?.[selected] || "未標記";
  el.innerHTML = `
    <div class="price-trend-board price-trend-shared">
      <div class="price-trend-head">
        <span>Daily only</span>
        <strong>${dailyReports.length ? `${escapeHtml(formatDateShort(dailyReports[0].date))} - ${escapeHtml(formatDateShort(dailyReports.at(-1).date))}` : "--"}</strong>
      </div>
      <div class="price-asset-tabs">
        ${stanceLabels
          .map(([label, key]) => `
            <button class="price-asset-button ${key === selected ? "active" : ""}" data-price-asset="${key}" type="button">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(assetPriceIndicators[key])}</strong>
            </button>
          `)
          .join("")}
      </div>
      <div class="shared-price-card">
        <div class="shared-chart-meta">
          <div>
            <span>${escapeHtml(selectedLabel)} / ${escapeHtml(indicator)}</span>
            <strong>${escapeHtml(latest ? trimNumber(latest.close) : "--")}</strong>
          </div>
          <div>
            <span>${escapeHtml(latest ? `${latest.date} ${weekdayLabel(latest.date)}` : "--")}</span>
            <b class="${stanceClass(stanceScores[stance] ?? 0)}">${escapeHtml(stance)}</b>
          </div>
        </div>
        ${candlestick(candles, dailyReports, selected)}
        <div class="candle-tooltip" hidden></div>
        <div class="price-ohlc">
          <span>開 ${escapeHtml(latest ? trimNumber(latest.open) : "--")}</span>
          <span>高 ${escapeHtml(latest ? trimNumber(latest.high) : "--")}</span>
          <span>低 ${escapeHtml(latest ? trimNumber(latest.low) : "--")}</span>
          <span>收 ${escapeHtml(latest ? trimNumber(latest.close) : "--")}</span>
        </div>
      </div>
    </div>
  `;

  wireCandleTooltip(el);
  el.querySelectorAll("[data-price-asset]").forEach((button) => {
    button.addEventListener("click", () => {
      state.priceAsset = button.dataset.priceAsset;
      renderDecisionPriceTrends(el, reports);
    });
  });
}

async function loadMarketDailyK() {
  if (!canUseLiveRefresh()) return;
  try {
    const response = await fetch("./data/market-daily-k.json", { cache: "no-store" });
    if (!response.ok) return;
    marketDailyK = await response.json();
    if (state.decisionView === "prices") renderDailyDecisions();
  } catch (_error) {
    marketDailyK = null;
  }
}

function currentReport() {
  if (state.selectedFilename) {
    const index = data.reports.findIndex((report) => report.filename === state.selectedFilename);
    if (index >= 0) state.selectedIndex = index;
  }
  return data.reports[state.selectedIndex] || data.latest || data.reports[0] || null;
}

function renderOverview(report) {
  const el = document.querySelector("#overviewGrid");
  el.innerHTML = overviewItems
    .map(([label, getValue], index) => {
      const value = escapeHtml(getValue(report));
      return `
        <div class="overview-card ${index === 1 ? "wide" : ""}">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `;
    })
    .join("");
}

function renderReportList() {
  const el = document.querySelector("#reportList");
  el.innerHTML = data.reports
    .map((report, index) => {
      const active = index === state.selectedIndex ? "active" : "";
      return `
        <button class="report-item ${active}" data-index="${index}">
          <span class="report-date">${escapeHtml(report.date || "--")} · ${escapeHtml(weekdayLabel(report.date))}</span>
          <span class="session-pill ${reportSessionClass(report)}">${escapeHtml(reportSessionLabel(report))}</span>
          <strong>${escapeHtml(report.title)}</strong>
          <time>${escapeHtml(reportDataTime(report))}</time>
          <small>${escapeHtml(report.summary || "尚無摘要")}</small>
        </button>
      `;
    })
    .join("");

  el.querySelectorAll(".report-item").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedIndex = Number(button.dataset.index);
      state.selectedFilename = data.reports[state.selectedIndex]?.filename || null;
      renderDashboard();
    });
  });
}

function startAutoRefresh() {
  if (!canUseLiveRefresh()) {
    text("#refreshStatus", "file mode: run build-data");
    return;
  }
  refreshFromServer();
  window.setInterval(refreshFromServer, 30000);
}

async function refreshFromServer() {
  try {
    const response = await fetch("./api/reports-data", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const nextData = await response.json();
    const current = currentReport();
    state.selectedFilename = state.selectedFilename || current?.filename || nextData.latest?.filename || null;
    data = nextData;
    await loadMarketDailyK();
    renderChrome();
    renderDashboard();
    text("#refreshStatus", `live refresh ${formatTime(new Date())}`);
    text("#marketDataStatus", `updated ${formatTime(new Date())}`);
  } catch (error) {
    text("#refreshStatus", "live refresh paused");
    text("#marketDataStatus", canUseLiveRefresh() ? "refresh paused" : "file mode");
  }
}

function wireManualRefresh() {
  const button = document.querySelector("#manualRefreshButton");
  if (!button) return;
  button.addEventListener("click", async () => {
    button.classList.add("spinning");
    text("#marketDataStatus", "refreshing");
    await refreshFromServer();
    window.setTimeout(() => button.classList.remove("spinning"), 350);
  });
}

function canUseLiveRefresh() {
  return window.location.protocol === "http:" || window.location.protocol === "https:";
}

function renderCategoryFilters() {
  const el = document.querySelector("#categoryFilters");
  el.innerHTML = categoryOrder
    .map((category) => `<button class="filter-chip ${category === state.category ? "active" : ""}" data-category="${category}">${category}</button>`)
    .join("");
  el.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      renderCategoryFilters();
      renderSnapshot(currentReport());
    });
  });
}

function renderSnapshot(report) {
  const rows = filteredSnapshot(report);
  renderSnapshotCards(rows);
  renderMarketMatrix(rows);
}

function filteredSnapshot(report) {
  const wanted = new Set(data.trackedIndicators || []);
  return (report.snapshot || [])
    .filter((row) => !wanted.size || wanted.has(row.indicator))
    .filter((row) => state.category === "All" || row.category === state.category);
}

function renderSnapshotCards(rows) {
  const el = document.querySelector("#snapshotCards");
  el.innerHTML = rows
    .map((row) => `
      <div class="snapshot-card">
        <div>
          <span>${escapeHtml(row.category)}</span>
          <strong>${escapeHtml(row.indicator)}</strong>
        </div>
        <b>${escapeHtml(row.latest || "--")}</b>
        <small class="${indicatorToneClass(row.indicator, row.dailyChange)}">${formatChange(row.dailyChange, row.dailyUnit)} today</small>
      </div>
    `)
    .join("");
}

function renderMarketMatrix(rows) {
  const el = document.querySelector("#marketMatrix");
  if (!rows.length) {
    el.innerHTML = `<div class="empty-line">這個分類目前沒有快照資料。</div>`;
    return;
  }
  const metrics = [
    ["日", "dailyChange", "dailyUnit"],
    ["週", "weeklyChange", "weeklyUnit"],
    ["月", "monthlyChange", "monthlyUnit"],
  ];
  const max = Math.max(
    1,
    ...rows.flatMap((row) => metrics.map(([, key]) => Math.abs(Number(row[key]) || 0)))
  );

  el.innerHTML = `
    <div class="market-matrix">
      ${rows
    .map((row) => `
      <div class="market-row">
        <div class="bar-name">${escapeHtml(row.indicator)}</div>
        <div class="bar-trio">
          ${metrics
            .map(([label, key, unitKey]) => {
              const value = Number(row[key]) || 0;
              const width = Math.max(3, Math.min(100, (Math.abs(value) / max) * 100));
              const side = indicatorBarClass(row.indicator, value);
              return `
                <div class="mini-bar ${side}" title="${label}: ${formatChange(value, row[unitKey])}">
                  <span>${label}</span>
                  <i style="--bar-width:${width}%"></i>
                  <b>${formatChange(value, row[unitKey])}</b>
                </div>
              `;
            })
            .join("")}
        </div>
        <div class="direction-pill ${indicatorDirectionClass(row.indicator, row.direction)}">
          <span>方向</span>
          <b>${directionLabel(indicatorDirectionClass(row.indicator, row.direction))}</b>
        </div>
      </div>
    `)
    .join("")}
    </div>
  `;
}

function renderStance(report) {
  const el = document.querySelector("#stanceGrid");
  el.innerHTML = stanceLabels
    .map(([label, key]) => {
      const stance = report.assetStance[key] || "未抽取";
      const score = stanceScores[stance] ?? 0;
      const position = ((score + 2) / 4) * 100;
      return `
        <div class="stance-card ${stanceClass(score)}">
          <div class="stance-top">
            <span>${label}</span>
            <strong>${escapeHtml(stance)}</strong>
          </div>
          <div class="stance-meter">
            <i style="left:${position}%"></i>
          </div>
          <div class="stance-scale">
            <span>強空</span><span>中性</span><span>強多</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderComparison(report, previous) {
  const el = document.querySelector("#comparisonCards");
  if (!previous) {
    el.innerHTML = `
      <div class="comparison-card muted">
        <span>等待下一期</span>
        <strong>目前只有一份報告</strong>
        <p>新增第二份報告並重新生成資料後，這裡會顯示敘事、立場與指標變化。</p>
      </div>
    `;
    return;
  }

  const latestSnapshot = new Map((report.snapshot || []).map((row) => [row.indicator, row]));
  const previousSnapshot = new Map((previous.snapshot || []).map((row) => [row.indicator, row]));
  const changed = [...latestSnapshot.keys()].filter((key) => previousSnapshot.has(key)).slice(0, 6);
  el.innerHTML = changed
    .map((key) => {
      const latest = latestSnapshot.get(key);
      const before = previousSnapshot.get(key);
      const delta = latest.value !== null && before.value !== null ? latest.value - before.value : null;
      return `
        <div class="comparison-card">
          <span>${escapeHtml(key)}</span>
          <strong>${escapeHtml(before.latest)} → ${escapeHtml(latest.latest)}</strong>
          <p class="${toneClass(delta)}">${delta === null ? "n/a" : signed(delta)}</p>
        </div>
      `;
    })
    .join("");
}

function renderEvents(report) {
  const el = document.querySelector("#eventTimeline");
  const baseDate = report.date ? new Date(`${report.date}T00:00:00`) : new Date();
  const maxDate = new Date(baseDate);
  maxDate.setDate(maxDate.getDate() + 30);

  const events = (report.events || []).filter((event) => {
    const parsed = parseDate(event.date);
    if (!parsed) return true;
    return parsed >= baseDate && parsed <= maxDate;
  });

  el.innerHTML = events.length
    ? events
        .map((event) => `
          <div class="event-item importance-${Math.min(3, event.importance || 1)}">
            <time>${escapeHtml(event.date || "Rolling")}</time>
            <strong>${escapeHtml(event.event || "未命名事件")}</strong>
            <span>${"●".repeat(event.importance || 1)}</span>
          </div>
        `)
        .join("")
    : `<div class="empty-line">未抽取到未來 30 天事件。</div>`;
}

function renderReader(report) {
  text("#readerTitle", report.title || "報告閱讀");
  const source = document.querySelector("#sourceLink");
  source.href = report.filename || "#";
  document.querySelector("#reportReader").innerHTML = markdownToHtml(report.markdown || "");
}

function markdownToHtml(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);
  const html = [];
  let paragraph = [];
  let list = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${inline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      html.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`);
      list = [];
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }
    if (trimmed.startsWith("|") && lines[i + 1] && lines[i + 1].trim().startsWith("|")) {
      flushParagraph();
      flushList();
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i += 1;
      }
      i -= 1;
      html.push(tableToHtml(tableLines));
      continue;
    }
    if (/^###\s+/.test(trimmed)) {
      flushParagraph();
      flushList();
      html.push(`<h3>${inline(trimmed.replace(/^###\s+/, ""))}</h3>`);
      continue;
    }
    if (/^##\s+/.test(trimmed)) {
      flushParagraph();
      flushList();
      html.push(`<h2>${inline(trimmed.replace(/^##\s+/, ""))}</h2>`);
      continue;
    }
    if (/^#\s+/.test(trimmed)) {
      flushParagraph();
      flushList();
      html.push(`<h1>${inline(trimmed.replace(/^#\s+/, ""))}</h1>`);
      continue;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      list.push(trimmed.replace(/^[-*]\s+/, ""));
      continue;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      flushList();
      html.push(`<div class="numbered-callout">${inline(trimmed)}</div>`);
      continue;
    }
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return html.join("");
}

function tableToHtml(lines) {
  const rows = lines
    .filter((line) => !/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line))
    .map(splitTable);
  if (!rows.length) return "";
  const [headers, ...body] = rows;
  return `
    <div class="reader-table-wrap">
      <table>
        <thead><tr>${headers.map((cell) => `<th>${inline(cell)}</th>`).join("")}</tr></thead>
        <tbody>${body
          .map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join("")}</tr>`)
          .join("")}</tbody>
      </table>
    </div>
  `;
}

function splitTable(line) {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function inline(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function text(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}

function formatChange(value, unit) {
  if (value === null || Number.isNaN(value)) return "--";
  return `${signed(value)}${unit || ""}`;
}

function signed(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return "--";
  return number > 0 ? `+${trimNumber(number)}` : trimNumber(number);
}

function trimNumber(value) {
  return Number(value.toFixed(2)).toString();
}

function toneClass(value) {
  const number = Number(value);
  if (Number.isNaN(number) || number === 0) return "tone-flat";
  return number > 0 ? "tone-up" : "tone-down";
}

function indicatorToneClass(indicator, value) {
  const number = indicator === "USDJPY" ? -Number(value) : Number(value);
  return toneClass(number);
}

function indicatorBarClass(indicator, value) {
  const number = indicator === "USDJPY" ? -Number(value) : Number(value);
  if (Number.isNaN(number) || number === 0) return "neutral";
  return number > 0 ? "positive" : "negative";
}

function indicatorDirectionClass(indicator, direction) {
  if (indicator !== "USDJPY") return direction || "flat";
  if (direction === "up") return "down";
  if (direction === "down") return "up";
  return direction || "flat";
}

function stanceClass(score) {
  if (score >= 2) return "strong-bull";
  if (score === 1) return "bull";
  if (score === -1) return "bear";
  if (score <= -2) return "strong-bear";
  return "neutral";
}

function decisionDelta(current, previous) {
  if (!previous) return { className: "delta-base", label: "基準" };
  const currentScore = stanceScores[current];
  const previousScore = stanceScores[previous];
  if (currentScore === undefined || previousScore === undefined) return { className: "delta-flat", label: "未比對" };
  const delta = currentScore - previousScore;
  if (delta > 0) return { className: "delta-up", label: `升級 +${delta}` };
  if (delta < 0) return { className: "delta-down", label: `降級 ${delta}` };
  return { className: "delta-flat", label: "不變" };
}

function directionLabel(direction) {
  if (direction === "up") return "上行";
  if (direction === "down") return "下行";
  return "持平";
}

function reportTypeLabel(report) {
  const name = report?.filename || report?.title || "";
  if (/weekly/i.test(name)) return "Weekly";
  if (/decision/i.test(name)) return "Decision";
  return "Daily";
}

function weekdayLabel(value) {
  const date = parseDate(value);
  if (!date) return "--";
  return ["週日", "週一", "週二", "週三", "週四", "週五", "週六"][date.getDay()];
}

function formatDateShort(value) {
  return String(value || "--").replace(/^\d{4}-/, "");
}

function assetCandles(key, dailyReports) {
  const fromFeed = marketDailyK?.series?.[key]?.candles || [];
  if (fromFeed.length) return fromFeed.filter(validCandle).slice(-15);
  const indicator = assetPriceIndicators[key];
  const fromReports = dailyReports
    .map((report) => {
      const embedded = (report.dailyK || []).find((row) => row.key === key || row.indicator === indicator);
      if (embedded && validCandle(embedded)) return embedded;
      const row = snapshotRow(report, indicator);
      return row && Number.isFinite(row.value) ? { date: report.date, open: row.value, high: row.value, low: row.value, close: row.value } : null;
    })
    .filter(validCandle);
  return fromReports.slice(-15);
}

function validCandle(candle) {
  return candle && candle.date && ["open", "high", "low", "close"].every((key) => Number.isFinite(Number(candle[key])));
}

function candlestick(candles, reports, assetKey) {
  const clean = candles.filter(validCandle);
  if (clean.length < 2) return sparkline(clean.map((candle) => Number(candle.close)));
  const values = clean.flatMap((candle) => [Number(candle.high), Number(candle.low)]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const xStep = 112 / Math.max(1, clean.length - 1);
  const reportByDate = new Map(reports.map((report) => [report.date, report]));
  const marks = clean
    .map((candle, index) => {
      const x = 4 + index * xStep;
      const open = Number(candle.open);
      const high = Number(candle.high);
      const low = Number(candle.low);
      const close = Number(candle.close);
      const yHigh = 30 - ((high - min) / range) * 26;
      const yLow = 30 - ((low - min) / range) * 26;
      const yOpen = 30 - ((open - min) / range) * 26;
      const yClose = 30 - ((close - min) / range) * 26;
      const yTop = Math.min(yOpen, yClose);
      const height = Math.max(2, Math.abs(yClose - yOpen));
      const tone = close >= open ? "up" : "down";
      const stance = reportByDate.get(candle.date)?.assetStance?.[assetKey] || "";
      const score = stanceScores[stance];
      const markerScore = assetKey === "jpy" ? -score : score;
      const tooltip = `${candle.date} ${weekdayLabel(candle.date)}
建議：${stance || "未標記"}
開 ${trimNumber(open)} / 高 ${trimNumber(high)} / 低 ${trimNumber(low)} / 收 ${trimNumber(close)}`;
      const badge = score === undefined ? "" : `<circle class="stance-dot ${stanceClass(markerScore)}" cx="${trimNumber(x)}" cy="3" r="2.3"><title>${escapeHtml(tooltip)}</title></circle>`;
      return `
        <g class="candle ${tone}" data-tooltip="${escapeHtml(tooltip)}">
          <title>${escapeHtml(tooltip)}</title>
          <line x1="${trimNumber(x)}" x2="${trimNumber(x)}" y1="${trimNumber(yHigh)}" y2="${trimNumber(yLow)}"></line>
          <rect x="${trimNumber(x - 2.5)}" y="${trimNumber(yTop)}" width="5" height="${trimNumber(height)}"></rect>
          <rect class="candle-hitbox" x="${trimNumber(x - 4)}" y="0" width="8" height="34"></rect>
          ${badge}
        </g>
      `;
    })
    .join("");
  return `<svg class="candles" viewBox="0 0 120 34" role="img" aria-label="日K與建議標記">${marks}</svg>`;
}

function wireCandleTooltip(root) {
  const card = root.querySelector(".shared-price-card");
  const tooltip = root.querySelector(".candle-tooltip");
  if (!card || !tooltip) return;
  card.querySelectorAll("[data-tooltip]").forEach((node) => {
    node.addEventListener("mousemove", (event) => {
      tooltip.hidden = false;
      tooltip.textContent = node.dataset.tooltip;
      const rect = card.getBoundingClientRect();
      tooltip.style.left = `${event.clientX - rect.left + 14}px`;
      tooltip.style.top = `${event.clientY - rect.top + 14}px`;
    });
    node.addEventListener("mouseleave", () => {
      tooltip.hidden = true;
    });
  });
}

function sparkline(values, indicator) {
  const clean = values.filter((value) => Number.isFinite(Number(value))).map(Number);
  if (clean.length < 2) return `<svg class="sparkline" viewBox="0 0 120 34" role="img" aria-label="資料不足"><path d="M4 17 H116" /></svg>`;
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max - min || 1;
  const points = clean
    .map((value, index) => {
      const x = 4 + (index / (clean.length - 1)) * 112;
      const y = 30 - ((value - min) / range) * 26;
      return `${trimNumber(x)},${trimNumber(y)}`;
    })
    .join(" ");
  const delta = clean.at(-1) - clean[0];
  const tone = indicatorDirectionClass(indicator, delta >= 0 ? "up" : "down");
  return `<svg class="sparkline ${tone}" viewBox="0 0 120 34" role="img" aria-label="價格走勢"><polyline points="${points}" /></svg>`;
}

function snapshotStatusLabel(report) {
  const match = String(report?.markdown || "").match(/本報告截稿時間為\s*`([^`]+)`/);
  return match ? `資料時點 ${match[1]}` : "report snapshot";
}

function parseDate(value) {
  const match = String(value || "").match(/\d{4}-\d{2}-\d{2}/);
  return match ? new Date(`${match[0]}T00:00:00`) : null;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function refreshLabel() {
  return canUseLiveRefresh() ? "live refresh ready" : "file mode: run build-data";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
