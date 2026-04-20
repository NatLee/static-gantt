# Gantt Chart

視覺化專案排程工具：階層式 phase / sub-phase / task、依賴箭頭、雙軸拖曳、拉線建立依賴，雙向同步 Mermaid 文字模式。純前端，靜態部署到 GitHub Pages。

## 功能

- **視覺與文字雙模式**：Visual 模式直接拖曳編輯；Mermaid 模式可用 Gantt 語法貼上／匯出，兩邊即時同步
- **階層結構**：Master phase → sub-phase → task，可折疊
- **任務條互動**：
  - 左右拖曳改變起始日期
  - 上下拖曳跨 sub-phase 搬移（一次操作同時改日期＋ phase）
  - 右邊緣拉伸改變工期
  - hover 右端圓點拉線至別條任務，建立 `after` 依賴
- **依賴管理**：箭頭自動繪製，新增依賴時 DFS 檢查循環、有循環會拒絕
- **關鍵路徑**：Critical tasks 以紅色描邊與實線箭頭突顯
- **里程碑**：時間軸上標注垂直線與標籤
- **列表重排**：左側 task list 可拖曳整個 phase / sub-phase / task
- **時間軸**：縮放、自動延伸、date tooltip 跟隨游標
- **匯出**：PNG（html2canvas）與 Excel（xlsx）
- **虛擬化**：> 50 列時啟用 `@tanstack/react-virtual`，大型專案也不卡
- **主題**：深淺色切換

## 技術堆疊

- Next.js 16（App Router，Turbopack，`output: 'export'`）
- React 19
- TypeScript 5
- Tailwind CSS 4
- Mermaid（圖解語法解析）、CodeMirror（文字編輯器）
- `@tanstack/react-virtual`、`html2canvas-pro`、`xlsx`、`lucide-react`

## 開始使用

```bash
npm install
npm run dev
# → http://localhost:3000
```

其他指令：

```bash
npm run build   # 產生靜態檔到 ./out
npm run lint
```

## 操作速查

| 動作 | 操作方式 |
|------|---------|
| 移動任務日期 | 拖曳任務條左右 |
| 跨 sub-phase 搬移 | 拖曳任務條上下（會自動改 phase） |
| 調整工期 | 拖曳任務條右邊緣 |
| 建立依賴 | hover 任務條 → 拉右端圓點到另一條任務 |
| 編輯任務 | 點擊任務條打開側邊面板 |
| 新增任務 | hover 任務條出現的 `+` 按鈕（前 / 後） |
| 重排列順序 | 左側列表拖曳 handle |
| 折疊階段 | 點 phase / sub-phase 前的三角形 |
| 切換模式 | 頂部 Visual / Mermaid 切換 |

## 專案結構

```
src/
├── app/             # Next.js App Router、globals.css
├── components/
│   ├── Gantt/       # 主要視覺化元件（GanttPanel, TaskBarContainer, DependencyLines, …）
│   ├── Dialogs/     # 新增 phase / task dialog
│   ├── Editor/      # 任務編輯側面板
│   ├── Header/      # 頂部 toolbar
│   └── Mermaid/     # Mermaid 編輯器面板
├── data/            # 預設範例專案
├── hooks/           # useGanttState（reducer）、useDragReorder、useDragToConnect、useVirtualRows…
├── lib/             # scheduler、dateUtils、mermaid 解析器、匯出、cycleCheck、depPath…
└── types/           # 共用型別
```

## 部署到 GitHub Pages

Repo 已附帶 `.github/workflows/deploy.yml`：push 到 `main` 會自動 build 並部署。

1. GitHub Repo → **Settings → Pages → Source**：選 **GitHub Actions**
2. `main` 推送一次，觀察 Actions 執行
3. 完成後 `https://<user>.github.io/<repo-name>/` 即可開啟

`NEXT_PUBLIC_BASE_PATH` 會自動帶入 repo 名稱（workflow 已設定），本地開發不需要設定。

## License

MIT
