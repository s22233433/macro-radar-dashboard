# 宏觀投資雷達 Dashboard

## 線上網址

https://zhenguocool.com/macro-radar-dashboard/

## 開啟方式

可以直接打開 `index.html`。這是靜態模式，會讀取已生成的 `data/reports-data.js`。

若想自動偵測新增報告，建議用本機 Dashboard server：

```bash
node scripts/serve-dashboard.js
```

然後打開 `http://127.0.0.1:8765`。這個模式會在載入頁面與每 30 秒重新掃描 markdown 報告。

也可以用一般靜態伺服器開啟：

```bash
python3 -m http.server 8000
```

然後打開 `http://localhost:8000`。

## 更新資料

在 `file://` 或一般靜態伺服器模式下，新增 `macro-radar-*.md`、`*daily*.md`、`*weekly*.md` 或 `*report*.md` 後，重新執行：

```bash
node scripts/build-data.js
```

Dashboard 會更新 `data/reports-data.js`，並自動納入報告列表、快照圖表、事件雷達與時間序列資料。
