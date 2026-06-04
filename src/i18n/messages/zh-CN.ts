import type { MessageKey } from './keys';

const zhCN: Record<MessageKey, string> = {
  // common
  'common.close': '关闭',
  'common.cancel': '取消',
  'common.delete': '删除',
  'common.rename': '重命名',
  'common.duplicate': '复制',
  'common.download': '下载',

  // top-level menus
  'menu.file': '文件',
  'menu.edit': '编辑',
  'menu.view': '视图',
  'menu.insert': '插入',
  'menu.export': '导出',
  'menu.help': '帮助',

  // File menu
  'file.newEmpty': '新建（空白）',
  'file.newTemplate': '从模板新建',
  'file.openManage': '打开／管理…',
  'file.duplicate': '复制当前项目',
  'file.rename': '重命名当前项目…',
  'file.downloadJson': '下载 JSON',
  'file.downloadBackup': '下载备份（全部）',
  'file.importJson': '导入 JSON…',
  'file.importFailed': '导入失败',

  // Edit menu
  'edit.undo': '撤销',
  'edit.redo': '重做',
  'edit.find': '查找任务…',

  // View menu
  'view.theme': '主题',
  'view.light': '浅色',
  'view.dark': '深色',
  'view.scrollToday': '滚动到今天',
  'view.zoomIn': '放大',
  'view.zoomOut': '缩小',
  'view.fit': '适应屏幕',
  'view.zoomPreset': '缩放预设',
  'view.dayView': '日视图',
  'view.weekView': '周视图',
  'view.monthView': '月视图',
  'view.phaseFilter': '阶段筛选',
  'view.allPhases': '所有阶段',
  'view.collapseAll': '折叠所有阶段',
  'view.expandAll': '展开所有阶段',
  'view.hideLegend': '隐藏图例',
  'view.showLegend': '显示图例',
  'view.scheduleBaseline': '排程与基线',
  'view.workingDays': '仅计工作日（跳过周末）',
  'view.captureBaseline': '捕获基线',
  'view.recaptureBaseline': '重新捕获基线',
  'view.clearBaseline': '清除基线',
  'view.language': '语言',

  // Insert menu
  'insert.phase': '阶段…',
  'insert.subPhase': '子阶段…',
  'insert.task': '任务…',
  'insert.milestone': '里程碑…',

  // Export menu
  'export.gantt': '甘特图',
  'export.csv': 'CSV（Excel）',
  'export.png': 'PNG',
  'export.jsonProject': 'JSON（当前项目）',
  'export.mermaid': 'Mermaid',
  'export.svg': 'SVG',
  'export.mmdFile': '.mmd 文件',
  'export.importMmd': '导入 .mmd…',
  'export.pngFailed': 'PNG 导出失败，请重试。',

  // Help menu
  'help.shortcuts': '键盘快捷键',
  'help.about': '关于',
  'help.aboutBody': '一款支持可视化与 Mermaid 模式的静态甘特图编辑器。',

  // Mode segmented + header buttons
  'mode.visual': '可视化',
  'mode.mermaid': 'Mermaid',
  'mode.switchLight': '切换为浅色',
  'mode.switchDark': '切换为深色',
  'mode.shortcutsTitle': '键盘快捷键（?）',

  // Visual contextual toolbar
  'toolbar.undo': '撤销（⌘Z）',
  'toolbar.redo': '重做（⇧⌘Z）',
  'toolbar.today': '今天',
  'toolbar.todayTitle': '滚动到今天（T）',
  'toolbar.workDays': '工作日',
  'toolbar.workDaysTitle': '工作日排程 — 工期按工作日计算，依赖自动跳过周末',
  'toolbar.dayTitle': '日视图',
  'toolbar.weekTitle': '周视图',
  'toolbar.monthTitle': '月视图',
  'toolbar.fitTitle': '适应屏幕',
  'toolbar.allPhases': '所有阶段',
  'toolbar.milestone': '里程碑',
  'toolbar.milestoneTitle': '添加里程碑',

  // Legend
  'legend.done': '已完成',
  'legend.inProgress': '进行中',
  'legend.planned': '计划中',
  'legend.critical': '关键路径',

  // Mermaid contextual toolbar
  'mtoolbar.section': '区块',
  'mtoolbar.sectionTitle': '插入区块（⌘⇧S）',
  'mtoolbar.task': '任务',
  'mtoolbar.taskTitle': '插入任务（⌘⇧T）',
  'mtoolbar.milestone': '里程碑',
  'mtoolbar.milestoneTitle': '插入里程碑（⌘⇧M）',
  'mtoolbar.format': '格式化',
  'mtoolbar.formatTitle': '格式化（⌘⇧F）',
  'mtoolbar.import': '导入',
  'mtoolbar.importTitle': '导入 .mmd 文件',
  'mtoolbar.download': '下载',
  'mtoolbar.downloadTitle': '下载为 .mmd',

  // Gantt corner
  'corner.taskStructure': '任务结构',
  'corner.zoomIn': '放大',
  'corner.zoomOut': '缩小',

  // Empty state
  'empty.title': '这个项目是空的',
  'empty.body': '先添加一个阶段和几个任务，或加载示例项目来看看布局效果。',
  'empty.addPhase': '添加第一个阶段',
  'empty.addTask': '添加任务',
  'empty.loadSample': '或加载示例项目',

  // Project switcher
  'switcher.title': '单击切换 · 双击重命名',
  'switcher.untitled': '未命名',
  'switcher.switchProject': '切换项目',
  'switcher.more': '还有 {count} 个',
  'switcher.renameThis': '重命名此项目…',
  'switcher.manage': '管理项目…',
  'switcher.saving': '保存中…',
  'switcher.saved': '已保存',

  // Add/Edit dialog
  'dialog.addPhase.title': '添加阶段',
  'dialog.addPhase.submit': '添加阶段',
  'dialog.addSubPhase.title': '添加子阶段',
  'dialog.addSubPhase.submit': '添加子阶段',
  'dialog.addTask.title': '添加任务',
  'dialog.addTask.submit': '添加任务',
  'dialog.addBefore.title': '在前面插入任务',
  'dialog.addAfter.title': '在后面插入任务',
  'dialog.insertSubmit': '插入任务',
  'dialog.editPhase.title': '编辑阶段',
  'dialog.editSubPhase.title': '编辑子阶段',
  'dialog.saveChanges': '保存更改',
  'dialog.addMilestone.title': '添加里程碑',
  'dialog.addMilestone.submit': '添加里程碑',
  'dialog.editMilestone.title': '编辑里程碑',
  'dialog.generic.title': '对话框',
  'dialog.generic.submit': '提交',

  // Dialog field labels
  'field.phaseName': '阶段名称',
  'field.firstSubPhase': '第一个子阶段名称',
  'field.firstTask': '第一个任务名称',
  'field.duration': '工期（天）',
  'field.subPhaseName': '子阶段名称',
  'field.taskName': '任务名称',
  'field.milestoneName': '里程碑名称',
  'field.date': '日期',

  // Dialog placeholders
  'ph.phase': '例如 Phase 10',
  'ph.setup': '例如 Setup',
  'ph.initialSetup': '例如 初始设置',
  'ph.testing': '例如 Testing',
  'ph.writeTests': '例如 编写测试用例',
  'ph.implement': '例如 实现功能',
  'ph.betaRelease': '例如 Beta Release',

  // Defaults
  'default.newTask': '新任务',

  // Task editor panel
  'editor.title': '编辑任务',
  'editor.taskName': '任务名称',
  'editor.duration': '工期（天）',
  'editor.status': '状态',
  'editor.criticalPath': '关键路径',
  'editor.predecessor': '前置任务 ID',
  'editor.predecessorPh': '例如 p1a 或 p1a,p1b',
  'editor.fixedStart': '固定开始日期',
  'editor.progress': '进度',
  'editor.color': '颜色覆盖',
  'editor.colorAuto': '自动',
  'editor.assignee': '负责人',
  'editor.assigneePh': '例如 Alice',
  'editor.tags': '标签（用逗号分隔）',
  'editor.tagsPh': '例如 frontend, blocked',
  'editor.description': '描述',
  'editor.descriptionPh': '自由输入备注…',
  'editor.deleteTask': '删除任务',
  'editor.apply': '应用更改',
  'editor.close': '关闭',

  // Shared status labels
  'status.done': '已完成',
  'status.inProgress': '进行中',
  'status.planned': '计划中',

  // Task context menu
  'ctx.edit': '编辑…',
  'ctx.duplicate': '复制',
  'ctx.copyId': '复制 ID（{id}）',
  'ctx.addBefore': '在前面添加',
  'ctx.addAfter': '在后面添加',
  'ctx.markCritical': '标记为关键',
  'ctx.unmarkCritical': '取消关键标记',
  'ctx.status': '状态',
  'ctx.statusInProgress': '进行中',
  'ctx.delete': '删除',

  // Phase context menu
  'pctx.phase': '阶段',
  'pctx.subPhase': '子阶段',
  'pctx.rename': '重命名…',
  'pctx.addSubPhase': '添加子阶段…',
  'pctx.addTask': '添加任务…',
  'pctx.expand': '展开',
  'pctx.collapse': '折叠',
  'pctx.delete': '删除',

  // Left task-list "add" overlays
  'list.addTask': '添加任务',
  'list.addSubPhase': '添加子阶段',
  'list.addPhase': '添加阶段',

  // Bar affordances (titles)
  'bar.addLinkedPred': '添加前置依赖任务 · 拖动以连接',
  'bar.addAdjacent': '添加相邻任务',
  'bar.addLinkedSucc': '添加后继依赖任务 · 拖动以连接',
  'bar.baselineGhost': '基线（原计划）',
  'bar.overallocated': '负载过高 · 与该负责人的另一个任务时间重叠',

  // Task tooltip
  'tip.dates': '日期',
  'tip.duration': '工期',
  'tip.status': '状态',
  'tip.criticalPath': '⚡ 关键路径',
  'tip.slackLabel': '浮动时间',
  'tip.slack': '{days} 天浮动',
  'tip.overallocated': '⚠ 负责人负载过高',
  'tip.baseline': '基线',
  'tip.onBaseline': '与基线一致',
  'tip.driftLate': '推迟 {days} 天',
  'tip.driftEarly': '提前 {days} 天',
  'tip.progress': '进度',
  'tip.assignee': '负责人',
  'tip.tags': '标签',
  'tip.after': '依赖于',
  'tip.days': '{days} 天',

  // Today marker
  'ms.today': '今天',

  // Gantt warnings
  'gantt.cycleBlocked': '无法创建：会造成循环依赖',

  // Search panel
  'search.placeholder': '按名称、ID 或阶段搜索任务…',
  'search.close': '关闭（Esc）',
  'search.noMatches': '没有匹配的结果',
  'search.hintPrefix': '输入以搜索。',
  'search.hintNav': '移动',
  'search.hintPick': '选择',
  'search.hintClose': '关闭',
  'search.badgeActive': '进行中',

  // Project list dialog
  'projects.title': '项目（{count}）',
  'projects.taskOne': '{count} 个任务',
  'projects.taskOther': '{count} 个任务',

  // Keyboard shortcuts dialog
  'shortcuts.title': '键盘快捷键',
  'shortcuts.general': '通用',
  'shortcuts.history': '历史记录',
  'shortcuts.navigation': '导航',
  'shortcuts.mermaidEditor': 'Mermaid 编辑器',
  'shortcuts.showCheatsheet': '显示此快捷表',
  'shortcuts.closeDialogs': '关闭对话框／面板',
  'shortcuts.undo': '撤销',
  'shortcuts.redo': '重做',
  'shortcuts.redoAlt': '重做（备用）',
  'shortcuts.search': '搜索任务',
  'shortcuts.today': '滚动到今天',
  'shortcuts.zoomIn': '放大',
  'shortcuts.zoomOut': '缩小',
  'shortcuts.insertSection': '插入区块',
  'shortcuts.insertTask': '插入任务',
  'shortcuts.insertMilestone': '插入里程碑',
  'shortcuts.format': '格式化',

  // Welcome dialog
  'welcome.title': '欢迎 👋',
  'welcome.subtitle': '快速了解这里有什么',
  'welcome.dragTitle': '拖动即可编辑',
  'welcome.dragBody': '拖动任务条可移动日期或跨子阶段重新排序，拖动右边缘可调整工期。右键单击任务可复制／删除／改状态。',
  'welcome.connectTitle': '连接依赖关系',
  'welcome.connectBody': '从一条任务条拖动到另一条即可创建依赖。若会造成循环，连线会变红。',
  'welcome.saveTitle': '多项目 + 自动保存',
  'welcome.saveBody': '文件菜单 → 新建／打开／下载／导入。所有更改都会自动保存到 localStorage，刷新也不会丢失。',
  'welcome.kbdTitle': '键盘快捷键',
  'welcome.kbdBody': 'Cmd/Ctrl+Z 撤销、Cmd/Ctrl+F 搜索、T 跳到今天、+/- 缩放。在任意位置按 ? 可查看完整快捷表。',
  'welcome.showShortcuts': '显示所有快捷键',
  'welcome.letsGo': '开始使用',

  // Mermaid panel
  'mermaid.editor': 'Mermaid 编辑器',
  'mermaid.preview': '预览',
  'mermaid.zoomOut': '缩小',
  'mermaid.zoomIn': '放大',
  'mermaid.resetView': '重置视图',
  'mermaid.fit': '适应',
  'mermaid.rendering': '正在渲染图表…',
  'mermaid.renderError': '渲染错误',
};

export default zhCN;
