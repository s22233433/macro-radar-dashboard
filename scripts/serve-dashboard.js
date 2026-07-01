const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DATA_MODULE = path.resolve(__dirname, "report-data.js");
const PARSER_MODULE = path.resolve(__dirname, "report-parser.js");
const PORT = Number(process.env.PORT || 8765);
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/api/reports-data") {
    sendJson(res, buildFreshDataset());
    return;
  }

  if (url.pathname === "/data/reports-data.js") {
    const { renderDataScript } = freshDataApi();
    send(res, 200, renderDataScript(buildFreshDataset()), "application/javascript; charset=utf-8");
    return;
  }

  serveStatic(url.pathname, res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Macro Radar Dashboard: http://127.0.0.1:${PORT}`);
});

function freshDataApi() {
  delete require.cache[DATA_MODULE];
  delete require.cache[PARSER_MODULE];
  return require(DATA_MODULE);
}

function buildFreshDataset() {
  return freshDataApi().buildDataset(ROOT);
}

function serveStatic(pathname, res) {
  const cleanPath = decodeURIComponent(pathname === "/" ? "/index.html" : pathname);
  const filePath = path.normalize(path.join(ROOT, cleanPath));
  if (!filePath.startsWith(ROOT)) {
    send(res, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      send(res, 404, "Not found", "text/plain; charset=utf-8");
      return;
    }
    send(res, 200, content, MIME[path.extname(filePath)] || "application/octet-stream");
  });
}

function sendJson(res, payload) {
  send(res, 200, JSON.stringify(payload, null, 2), "application/json; charset=utf-8");
}

function send(res, status, body, contentType) {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  res.end(body);
}
