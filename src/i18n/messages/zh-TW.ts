import type { MessageKey } from './keys';

const zhTW: Record<MessageKey, string> = {
  // common
  'common.close': '關閉',
  'common.cancel': '取消',
  'common.delete': '刪除',
  'common.rename': '重新命名',
  'common.duplicate': '複製',
  'common.download': '下載',

  // top-level menus
  'menu.file': '檔案',
  'menu.edit': '編輯',
  'menu.view': '檢視',
  'menu.insert': '插入',
  'menu.export': '匯出',
  'menu.help': '說明',

  // File menu
  'file.newEmpty': '新增（空白）',
  'file.newTemplate': '從範本新增',
  'file.openManage': '開啟／管理…',
  'file.duplicate': '複製目前專案',
  'file.rename': '重新命名目前專案…',
  'file.downloadJson': '下載 JSON',
  'file.downloadBackup': '下載備份（全部）',
  'file.importJson': '匯入 JSON…',
  'file.importFailed': '匯入失敗',
  'import.notJson': '這個檔案不是有效的 JSON。',
  'import.unknownFormat': '這個 JSON 不是本工具的專案檔或備份檔。',
  'import.noProjects': '備份檔裡沒有任何專案，所以沒有匯入。',
  'import.invalidProject': '專案「{name}」的任務資料缺漏或損壞，所以沒有匯入。',

  // Edit menu
  'edit.undo': '復原',
  'edit.redo': '重做',
  'edit.find': '尋找任務…',

  // View menu
  'view.theme': '佈景主題',
  'view.light': '淺色',
  'view.dark': '深色',
  'view.scrollToday': '捲動至今天',
  'view.zoomIn': '放大',
  'view.zoomOut': '縮小',
  'view.fit': '符合畫面',
  'view.zoomPreset': '縮放預設',
  'view.dayView': '日檢視',
  'view.weekView': '週檢視',
  'view.monthView': '月檢視',
  'view.phaseFilter': '階段篩選',
  'view.allPhases': '所有階段',
  'view.collapseAll': '收合所有階段',
  'view.expandAll': '展開所有階段',
  'view.hideLegend': '隱藏圖例',
  'view.showLegend': '顯示圖例',
  'view.scheduleBaseline': '排程與基準線',
  'view.workingDays': '僅計工作日（跳過週末）',
  'view.captureBaseline': '擷取基準線',
  'view.recaptureBaseline': '重新擷取基準線',
  'view.clearBaseline': '清除基準線',
  'view.language': '語言',

  // Insert menu
  'insert.phase': '階段…',
  'insert.subPhase': '子階段…',
  'insert.task': '任務…',
  'insert.milestone': '里程碑…',

  // Export menu
  'export.gantt': '甘特圖',
  'export.csv': 'Excel（.xlsx）',
  'export.png': 'PNG',
  'export.jsonProject': 'JSON（目前專案）',
  'export.mermaid': 'Mermaid',
  'export.svg': 'SVG',
  'export.mmdFile': '.mmd 檔案',
  'export.importMmd': '匯入 .mmd…',
  'export.pngFailed': 'PNG 匯出失敗，請再試一次。',

  // Help menu
  'help.shortcuts': '鍵盤快捷鍵',
  'help.about': '關於',
  'help.aboutBody': '一款支援視覺化與 Mermaid 模式的靜態甘特圖編輯器。',

  // About dialog
  'about.appName': 'Gantt Studio',
  'about.version': 'v1.0',
  'about.tagline': '一款快速、純前端的甘特圖編輯器，支援視覺化與 Mermaid 模式。',
  'about.features': '功能亮點',
  'about.featureVisual': '拖放排程，支援相依關係與關鍵路徑',
  'about.featureMermaid': 'Mermaid 甘特圖雙向編輯',
  'about.featureAutosave': '自動儲存，瀏覽器內多專案管理',
  'about.featureExport': '匯出 PNG、Excel 與 Mermaid',
  'about.builtWith': '以 Next.js、React 與 TypeScript 打造',

  // Mode segmented + header buttons
  'mode.visual': '視覺化',
  'mode.mermaid': 'Mermaid',
  'mode.switchLight': '切換為淺色',
  'mode.switchDark': '切換為深色',
  'mode.shortcutsTitle': '鍵盤快捷鍵（?）',

  // Visual contextual toolbar
  'toolbar.undo': '復原（⌘Z）',
  'toolbar.redo': '重做（⇧⌘Z）',
  'toolbar.today': '今天',
  'toolbar.todayTitle': '捲動至今天（T）',
  'toolbar.workDays': '工作日',
  'toolbar.workDaysTitle': '工作日排程 — 工期以工作天計算，依賴自動跳過週末',
  'toolbar.dayTitle': '日檢視',
  'toolbar.weekTitle': '週檢視',
  'toolbar.monthTitle': '月檢視',
  'toolbar.fitTitle': '符合畫面',
  'toolbar.allPhases': '所有階段',
  'toolbar.milestone': '里程碑',
  'toolbar.milestoneTitle': '新增里程碑',
  'toolbar.scrollPhasesLeft': '上一頁階段',
  'toolbar.scrollPhasesRight': '更多階段',

  // Legend
  'legend.done': '已完成',
  'legend.inProgress': '進行中',
  'legend.planned': '規劃中',
  'legend.critical': '關鍵路徑',

  // Mermaid contextual toolbar
  'mtoolbar.section': '區段',
  'mtoolbar.sectionTitle': '插入區段（⌘⇧S）',
  'mtoolbar.task': '任務',
  'mtoolbar.taskTitle': '插入任務（⌘⇧T）',
  'mtoolbar.milestone': '里程碑',
  'mtoolbar.milestoneTitle': '插入里程碑（⌘⇧M）',
  'mtoolbar.format': '格式化',
  'mtoolbar.formatTitle': '格式化（⌘⇧F）',
  'mtoolbar.import': '匯入',
  'mtoolbar.importTitle': '匯入 .mmd 檔案',
  'mtoolbar.download': '下載',
  'mtoolbar.downloadTitle': '下載為 .mmd',

  // Gantt corner
  'corner.taskStructure': '任務結構',
  'corner.zoomIn': '放大',
  'corner.zoomOut': '縮小',

  // Empty state
  'empty.title': '這個專案是空的',
  'empty.body': '先新增一個階段與幾個任務，或載入範例專案來看看版面效果。',
  'empty.addPhase': '新增第一個階段',
  'empty.addTask': '新增任務',
  'empty.loadSample': '或載入範例專案',

  // Project switcher
  'switcher.title': '點擊切換 · 雙擊重新命名',
  'switcher.untitled': '未命名',
  'switcher.switchProject': '切換專案',
  'switcher.more': '還有 {count} 個',
  'switcher.renameThis': '重新命名此專案…',
  'switcher.manage': '管理專案…',
  'switcher.saving': '儲存中…',
  'switcher.saved': '已儲存',
  'switcher.saveFailed': '沒有儲存：瀏覽器拒絕儲存這個專案（空間可能已滿）。請先下載備份，以免資料遺失。',

  // Add/Edit dialog
  'dialog.addPhase.title': '新增階段',
  'dialog.addPhase.submit': '新增階段',
  'dialog.addSubPhase.title': '新增子階段',
  'dialog.addSubPhase.submit': '新增子階段',
  'dialog.addTask.title': '新增任務',
  'dialog.addTask.submit': '新增任務',
  'dialog.addBefore.title': '在前方插入任務',
  'dialog.addAfter.title': '在後方插入任務',
  'dialog.insertSubmit': '插入任務',
  'dialog.editPhase.title': '編輯階段',
  'dialog.editSubPhase.title': '編輯子階段',
  'dialog.saveChanges': '儲存變更',
  'dialog.addMilestone.title': '新增里程碑',
  'dialog.addMilestone.submit': '新增里程碑',
  'dialog.editMilestone.title': '編輯里程碑',
  'dialog.generic.title': '對話框',
  'dialog.generic.submit': '送出',

  // Dialog field labels
  'field.phaseName': '階段名稱',
  'field.firstSubPhase': '第一個子階段名稱',
  'field.firstTask': '第一個任務名稱',
  'field.duration': '工期（天）',
  'field.subPhaseName': '子階段名稱',
  'field.taskName': '任務名稱',
  'field.milestoneName': '里程碑名稱',
  'field.date': '日期',

  // Dialog placeholders
  'ph.phase': '例如 Phase 10',
  'ph.setup': '例如 Setup',
  'ph.initialSetup': '例如 初始設定',
  'ph.testing': '例如 Testing',
  'ph.writeTests': '例如 撰寫測試案例',
  'ph.implement': '例如 實作功能',
  'ph.betaRelease': '例如 Beta Release',

  // Defaults
  'default.newTask': '新任務',

  // Task editor panel
  'editor.title': '編輯任務',
  'editor.taskName': '任務名稱',
  'editor.duration': '工期（天）',
  'editor.status': '狀態',
  'editor.criticalPath': '關鍵路徑',
  'editor.predecessor': '前置任務 ID',
  'editor.predecessorPh': '例如 p1a 或 p1a,p1b',
  'editor.fixedStart': '固定開始日期',
  'editor.progress': '進度',
  'editor.color': '色彩覆寫',
  'editor.colorAuto': '自動',
  'editor.assignee': '負責人',
  'editor.assigneePh': '例如 Alice',
  'editor.tags': '標籤（以逗號分隔）',
  'editor.tagsPh': '例如 frontend, blocked',
  'editor.description': '描述',
  'editor.descriptionPh': '自由輸入備註…',
  'editor.deleteTask': '刪除任務',
  'editor.apply': '套用變更',
  'editor.close': '關閉',

  // Shared status labels
  'status.done': '已完成',
  'status.inProgress': '進行中',
  'status.planned': '規劃中',

  // Task context menu
  'ctx.edit': '編輯…',
  'ctx.duplicate': '複製',
  'ctx.copyId': '複製 ID（{id}）',
  'ctx.addBefore': '在前方新增',
  'ctx.addAfter': '在後方新增',
  'ctx.markCritical': '標記為關鍵',
  'ctx.unmarkCritical': '取消關鍵標記',
  'ctx.status': '狀態',
  'ctx.statusInProgress': '進行中',
  'ctx.delete': '刪除',

  // Phase context menu
  'pctx.phase': '階段',
  'pctx.subPhase': '子階段',
  'pctx.rename': '重新命名…',
  'pctx.addSubPhase': '新增子階段…',
  'pctx.addTask': '新增任務…',
  'pctx.expand': '展開',
  'pctx.collapse': '收合',
  'pctx.delete': '刪除',

  // Left task-list "add" overlays
  'list.addTask': '新增任務',
  'list.addSubPhase': '新增子階段',
  'list.addPhase': '新增階段',

  // Bar affordances (titles)
  'bar.addLinkedPred': '新增前置依賴任務 · 拖曳以連接',
  'bar.addAdjacent': '新增相鄰任務',
  'bar.addLinkedSucc': '新增後續依賴任務 · 拖曳以連接',
  'bar.baselineGhost': '基準線（原計畫）',
  'bar.overallocated': '負載過重 · 與此負責人的另一個任務時間重疊',

  // Task tooltip
  'tip.dates': '日期',
  'tip.duration': '工期',
  'tip.status': '狀態',
  'tip.criticalPath': '⚡ 關鍵路徑',
  'tip.slackLabel': '浮時',
  'tip.slack': '{days} 天浮時',
  'tip.overallocated': '⚠ 負責人負載過重',
  'tip.baseline': '基準線',
  'tip.onBaseline': '符合基準線',
  'tip.driftLate': '延後 {days} 天',
  'tip.driftEarly': '提前 {days} 天',
  'tip.progress': '進度',
  'tip.assignee': '負責人',
  'tip.tags': '標籤',
  'tip.after': '依賴於',
  'tip.days': '{days} 天',

  // Today marker
  'ms.today': '今天',

  // Gantt warnings
  'gantt.cycleBlocked': '無法建立：會造成循環依賴',

  // Search panel
  'search.placeholder': '以名稱、ID 或階段搜尋任務…',
  'search.close': '關閉（Esc）',
  'search.noMatches': '沒有符合的結果',
  'search.hintPrefix': '輸入以搜尋。',
  'search.hintNav': '移動',
  'search.hintPick': '選取',
  'search.hintClose': '關閉',
  'search.badgeActive': '進行中',

  // Project list dialog
  'projects.title': '專案（{count}）',
  'projects.taskOne': '{count} 個任務',
  'projects.taskOther': '{count} 個任務',

  // Keyboard shortcuts dialog
  'shortcuts.title': '鍵盤快捷鍵',
  'shortcuts.general': '一般',
  'shortcuts.history': '歷史紀錄',
  'shortcuts.navigation': '導覽',
  'shortcuts.mermaidEditor': 'Mermaid 編輯器',
  'shortcuts.showCheatsheet': '顯示此快捷表',
  'shortcuts.closeDialogs': '關閉對話框／面板',
  'shortcuts.undo': '復原',
  'shortcuts.redo': '重做',
  'shortcuts.redoAlt': '重做（替代）',
  'shortcuts.search': '搜尋任務',
  'shortcuts.today': '捲動至今天',
  'shortcuts.zoomIn': '放大',
  'shortcuts.zoomOut': '縮小',
  'shortcuts.insertSection': '插入區段',
  'shortcuts.insertTask': '插入任務',
  'shortcuts.insertMilestone': '插入里程碑',
  'shortcuts.format': '格式化',

  // Welcome dialog
  'welcome.title': '歡迎 👋',
  'welcome.subtitle': '快速導覽這裡有什麼',
  'welcome.dragTitle': '拖曳即可編輯',
  'welcome.dragBody': '拖曳任務列可移動日期或跨子階段重新排序，拖曳右緣可調整工期。在任務上按右鍵可複製／刪除／改狀態。',
  'welcome.connectTitle': '連接依賴關係',
  'welcome.connectBody': '從一條任務列拖曳到另一條即可建立依賴。若會造成循環，連線會變紅。',
  'welcome.saveTitle': '多專案 + 自動儲存',
  'welcome.saveBody': '檔案選單 → 新增／開啟／下載／匯入。所有變更都會自動存到 localStorage，重新整理也不會遺失。',
  'welcome.kbdTitle': '鍵盤快捷鍵',
  'welcome.kbdBody': 'Cmd/Ctrl+Z 復原、Cmd/Ctrl+F 搜尋、T 跳到今天、+/- 縮放。在任何地方按 ? 可查看完整快捷表。',
  'welcome.showShortcuts': '顯示所有快捷鍵',
  'welcome.letsGo': '開始使用',

  // Mermaid panel
  'mermaid.editor': 'Mermaid 編輯器',
  'mermaid.preview': '預覽',
  'mermaid.zoomOut': '縮小',
  'mermaid.zoomIn': '放大',
  'mermaid.resetView': '重設檢視',
  'mermaid.fit': '符合',
  'mermaid.rendering': '正在繪製圖表…',
  'mermaid.renderError': '繪製錯誤',
};

export default zhTW;
