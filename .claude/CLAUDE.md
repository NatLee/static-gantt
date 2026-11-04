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

## i18n（多語系）— 新增功能務必遵守

所有**使用者可見文字**都必須透過 i18n，不可在元件裡寫死字串（純符號／icon 例外，例如工具列的 `D`/`W`/`M`）。新功能若加了任何文案，沒走 `t()` 視為未完成。

- **字典位置**：[src/i18n/messages/](src/i18n/messages/)。`en.ts` 是**唯一真實來源**（source of truth），`MessageKey = keyof typeof en`。其餘 `zh-TW.ts` / `zh-CN.ts` / `ja.ts` 都是 `Record<MessageKey, string>` → **少 key 或多 key 都會編譯失敗**，TypeScript 幫你擋漏譯。
- **新增一個字串**：先在 `en.ts` 加 key（用點分命名空間，如 `dialog.addTask.title`），再到 `zh-TW` / `zh-CN` / `ja` 補上同一個 key；`npx tsc --noEmit` 會列出還沒翻的 key。
- **元件用法**：`const { t } = useI18n();` 然後 `t('key')`；要帶變數用 `{name}` 佔位符 + `t('key', { count: n })`（插值在 [I18nProvider.tsx](src/i18n/I18nProvider.tsx) 的 `interpolate`）。四個語系的佔位符 token 必須一致。
- **語言偵測**：`navigator.languages` → `normalizeLocale`（[config.ts](src/i18n/config.ts)）。使用者用 View 選單切換時把選擇存到 localStorage `gantt-locale`；沒有覆寫時每次載入都跟隨系統語言。English 永遠是 fallback。
- **Provider 位置**：在 [src/app/page.tsx](src/app/page.tsx) 包住 `GanttApp`，所以 `GanttApp` 以下全部都能 `useI18n`。靜態輸出為避免 hydration mismatch，初始 locale 固定 `en`，在 layout effect 內於 paint 前解析真正語系。
- **非 React 的 lib**（如 [exportPng.ts](src/lib/exportPng.ts)）拿不到 hook → 由呼叫端把 `t('...')` 字串當參數傳進去，不要在 lib 內寫死。
- **日期／數字格式**要跟著語系：用 `Intl`（如 [TimelineHeader.tsx](src/components/Gantt/TimelineHeader.tsx) 的月份）並把 `useI18n().locale` 當 BCP-47 tag 傳入。

## 關鍵檔案

- [src/hooks/useGanttState.ts](src/hooks/useGanttState.ts) — 單一 reducer
- [src/i18n/](src/i18n/) — i18n 基礎建設（`config` 偵測、`I18nProvider`/`useI18n`/`t`、`messages/` 四語系字典，`en` 為來源）
- [src/lib/scheduler.ts](src/lib/scheduler.ts) — 依賴解析、關鍵路徑計算
- [src/lib/cycleCheck.ts](src/lib/cycleCheck.ts) — 新增依賴前的 DFS cycle 檢查
- [src/lib/depPath.ts](src/lib/depPath.ts) — 依賴線的 SVG path 路由（right-angle / bezier），`DependencyLines` 與拖曳預覽線共用
- [src/components/Gantt/TaskBarContainer.tsx](src/components/Gantt/TaskBarContainer.tsx) — 2 軸拖曳（水平改日期、垂直跨 sub-phase）
- [src/hooks/useDragToConnect.ts](src/hooks/useDragToConnect.ts) — 拖線連接依賴
- [src/hooks/useDragReorder.ts](src/hooks/useDragReorder.ts) — 左側列表內 phase / sub-phase / task 重排；`TaskBarContainer` 共用 `buildRowMap`、`taskListRowsEl`（落點從列表的列容器量起）和 `taskDropGap` / `isOwnSlot`：前者算出落點的空隙（或回傳 null 表示該列拒收），後者判斷是否只是留在原位（不畫紅色拒收列），再交給 `resolveTaskDropTarget`

## 開發與部署

- `npm run dev` / `npm run build`（build 會輸出到 `./out`）。
- 靜態部署到 GitHub Pages 用 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)；`NEXT_PUBLIC_BASE_PATH` 在 workflow 設為 repo 名稱，本地不需設定。
- `next.config.ts` 的 `output: 'export'` + `images.unoptimized` 是 GH Pages 的硬性要求，別改。
