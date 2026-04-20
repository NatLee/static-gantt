@AGENTS.md

# Gantt Chart — Project Conventions

純前端的 Gantt 專案，Next.js 16 `output: 'export'` 靜態產出，所有狀態都在 `useGanttState` 的 reducer 裡（約 25 個 action）。沒有後端。

## 資料模型要點

- **`task.start` 與 `task.after` 互斥**。有 `start` 就是固定日期；有 `after` 就由依賴鏈決定開始時間。寫新 reducer 時務必清掉對立欄位（例：`MOVE_TASK` 清 `after`、`ADD_TASK_DEPENDENCY` 清 `start`）。
- **`task.after` 是逗號分隔字串**（不是陣列）。新增依賴先 `split(',').map(trim).filter`，去重後再 `.join(',')`。
- **`task.phase` 單一字串**編碼 master + sub-phase，例如 `"Phase 1 Planning & Research"`。解析用 regex `/^(Phase \d+)\s+(.*)/`。改 phase 常見需求：`MOVE_REORDER_TASK` / `MOVE_TASK_WITH_REORDER` / `MOVE_SUB_PHASE`。
- **沒有 `order` 欄位**。列順序 = tasks 陣列順序；顯示順序 = filter + collapse 後由 `computeRowIndexMap` / `buildRowMap` 動態算出。

## 互動層

- 所有拖曳都用 **vanilla mousedown / document mousemove+up**，沒有 dnd-kit / react-dnd。
- 標準 pattern：`useRef` 放 `dragState`、DOM classList 做視覺狀態、`mouseup` 才 dispatch（避免每個 pixel 都重算 state）。
- Hit-test 用 `document.elementFromPoint` + `data-task-id` 屬性。
- 拖曳中若超過 `virtualWindow`，DOM 可能消失 → 不能假設指標下一定有 bar。

## 關鍵檔案

- [src/hooks/useGanttState.ts](src/hooks/useGanttState.ts) — 單一 reducer
- [src/lib/scheduler.ts](src/lib/scheduler.ts) — 依賴解析、關鍵路徑計算
- [src/lib/cycleCheck.ts](src/lib/cycleCheck.ts) — 新增依賴前的 DFS cycle 檢查
- [src/lib/depPath.ts](src/lib/depPath.ts) — 依賴線的 SVG path 路由（right-angle / bezier），`DependencyLines` 與拖曳預覽線共用
- [src/components/Gantt/TaskBarContainer.tsx](src/components/Gantt/TaskBarContainer.tsx) — 2 軸拖曳（水平改日期、垂直跨 sub-phase）
- [src/hooks/useDragToConnect.ts](src/hooks/useDragToConnect.ts) — 拖線連接依賴
- [src/hooks/useDragReorder.ts](src/hooks/useDragReorder.ts) — 左側列表內 phase / sub-phase / task 重排；`buildRowMap` / `findTaskDropRow` 有被 `TaskBarContainer` 共用

## 開發與部署

- `npm run dev` / `npm run build`（build 會輸出到 `./out`）。
- 靜態部署到 GitHub Pages 用 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)；`NEXT_PUBLIC_BASE_PATH` 在 workflow 設為 repo 名稱，本地不需設定。
- `next.config.ts` 的 `output: 'export'` + `images.unoptimized` 是 GH Pages 的硬性要求，別改。
