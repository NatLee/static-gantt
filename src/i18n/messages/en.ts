// English message catalog — the SINGLE SOURCE OF TRUTH for translation keys.
// `MessageKey` is derived from this object, so every other locale must provide
// exactly these keys (enforced by TypeScript). Use {placeholder} for variables.
const en = {
  // common
  'common.close': 'Close',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.rename': 'Rename',
  'common.duplicate': 'Duplicate',
  'common.download': 'Download',

  // top-level menus
  'menu.file': 'File',
  'menu.edit': 'Edit',
  'menu.view': 'View',
  'menu.insert': 'Insert',
  'menu.export': 'Export',
  'menu.help': 'Help',

  // File menu
  'file.newEmpty': 'New (empty)',
  'file.newTemplate': 'New from template',
  'file.openManage': 'Open / Manage…',
  'file.duplicate': 'Duplicate current',
  'file.rename': 'Rename current…',
  'file.downloadJson': 'Download JSON',
  'file.downloadBackup': 'Download backup (all)',
  'file.importJson': 'Import JSON…',
  'file.importFailed': 'Import failed',

  // Edit menu
  'edit.undo': 'Undo',
  'edit.redo': 'Redo',
  'edit.find': 'Find task…',

  // View menu
  'view.theme': 'Theme',
  'view.light': 'Light',
  'view.dark': 'Dark',
  'view.scrollToday': 'Scroll to today',
  'view.zoomIn': 'Zoom in',
  'view.zoomOut': 'Zoom out',
  'view.fit': 'Fit to screen',
  'view.zoomPreset': 'Zoom preset',
  'view.dayView': 'Day view',
  'view.weekView': 'Week view',
  'view.monthView': 'Month view',
  'view.phaseFilter': 'Phase filter',
  'view.allPhases': 'All phases',
  'view.collapseAll': 'Collapse all phases',
  'view.expandAll': 'Expand all phases',
  'view.hideLegend': 'Hide legend',
  'view.showLegend': 'Show legend',
  'view.scheduleBaseline': 'Schedule & baseline',
  'view.workingDays': 'Working days only (skip weekends)',
  'view.captureBaseline': 'Capture baseline',
  'view.recaptureBaseline': 'Recapture baseline',
  'view.clearBaseline': 'Clear baseline',
  'view.language': 'Language',

  // Insert menu
  'insert.phase': 'Phase…',
  'insert.subPhase': 'Sub-phase…',
  'insert.task': 'Task…',
  'insert.milestone': 'Milestone…',

  // Export menu
  'export.gantt': 'Gantt',
  'export.csv': 'CSV (Excel)',
  'export.png': 'PNG',
  'export.jsonProject': 'JSON (current project)',
  'export.mermaid': 'Mermaid',
  'export.svg': 'SVG',
  'export.mmdFile': '.mmd file',
  'export.importMmd': 'Import .mmd…',
  'export.pngFailed': 'PNG export failed, please try again.',

  // Help menu
  'help.shortcuts': 'Keyboard shortcuts',
  'help.about': 'About',
  'help.aboutBody': 'A static Gantt chart editor with visual and Mermaid modes.',

  // About dialog
  'about.appName': 'Gantt Studio',
  'about.version': 'v1.0',
  'about.tagline': 'A fast, client-side Gantt chart editor with visual and Mermaid modes.',
  'about.features': 'Highlights',
  'about.featureVisual': 'Drag-and-drop scheduling with dependencies & critical path',
  'about.featureMermaid': 'Two-way Mermaid Gantt editing',
  'about.featureAutosave': 'Auto-save & multiple projects in your browser',
  'about.featureExport': 'Export to PNG, CSV and Mermaid',
  'about.builtWith': 'Built with Next.js, React & TypeScript',

  // Mode segmented + header buttons
  'mode.visual': 'Visual',
  'mode.mermaid': 'Mermaid',
  'mode.switchLight': 'Switch to light',
  'mode.switchDark': 'Switch to dark',
  'mode.shortcutsTitle': 'Keyboard shortcuts (?)',

  // Visual contextual toolbar
  'toolbar.undo': 'Undo (⌘Z)',
  'toolbar.redo': 'Redo (⇧⌘Z)',
  'toolbar.today': 'Today',
  'toolbar.todayTitle': 'Scroll to today (T)',
  'toolbar.workDays': 'Work days',
  'toolbar.workDaysTitle': 'Working-day scheduling — durations count business days and dependencies skip weekends',
  'toolbar.dayTitle': 'Day view',
  'toolbar.weekTitle': 'Week view',
  'toolbar.monthTitle': 'Month view',
  'toolbar.fitTitle': 'Fit to screen',
  'toolbar.allPhases': 'All Phases',
  'toolbar.milestone': 'Milestone',
  'toolbar.milestoneTitle': 'Add milestone',
  'toolbar.scrollPhasesLeft': 'Previous phases',
  'toolbar.scrollPhasesRight': 'More phases',

  // Legend
  'legend.done': 'Done',
  'legend.inProgress': 'In Progress',
  'legend.planned': 'Planned',
  'legend.critical': 'Critical',

  // Mermaid contextual toolbar
  'mtoolbar.section': 'Section',
  'mtoolbar.sectionTitle': 'Insert section (⌘⇧S)',
  'mtoolbar.task': 'Task',
  'mtoolbar.taskTitle': 'Insert task (⌘⇧T)',
  'mtoolbar.milestone': 'Milestone',
  'mtoolbar.milestoneTitle': 'Insert milestone (⌘⇧M)',
  'mtoolbar.format': 'Format',
  'mtoolbar.formatTitle': 'Format (⌘⇧F)',
  'mtoolbar.import': 'Import',
  'mtoolbar.importTitle': 'Import .mmd file',
  'mtoolbar.download': 'Download',
  'mtoolbar.downloadTitle': 'Download as .mmd',

  // Gantt corner
  'corner.taskStructure': 'Task Structure',
  'corner.zoomIn': 'Zoom In',
  'corner.zoomOut': 'Zoom Out',

  // Empty state
  'empty.title': 'This project is empty',
  'empty.body': 'Start by adding a phase and a few tasks, or load the sample project to see the layout in action.',
  'empty.addPhase': 'Add your first phase',
  'empty.addTask': 'Add a task',
  'empty.loadSample': 'Or load the sample project',

  // Project switcher
  'switcher.title': 'Click to switch · double-click to rename',
  'switcher.untitled': 'Untitled',
  'switcher.switchProject': 'Switch project',
  'switcher.more': '+{count} more',
  'switcher.renameThis': 'Rename this project…',
  'switcher.manage': 'Manage projects…',
  'switcher.saving': 'Saving…',
  'switcher.saved': 'Saved',

  // Add/Edit dialog
  'dialog.addPhase.title': 'Add New Phase',
  'dialog.addPhase.submit': 'Add Phase',
  'dialog.addSubPhase.title': 'Add Sub-Phase',
  'dialog.addSubPhase.submit': 'Add Sub-Phase',
  'dialog.addTask.title': 'Add Task',
  'dialog.addTask.submit': 'Add Task',
  'dialog.addBefore.title': 'Insert Task Before',
  'dialog.addAfter.title': 'Insert Task After',
  'dialog.insertSubmit': 'Insert Task',
  'dialog.editPhase.title': 'Edit Phase',
  'dialog.editSubPhase.title': 'Edit Sub-Phase',
  'dialog.saveChanges': 'Save Changes',
  'dialog.addMilestone.title': 'Add Milestone',
  'dialog.addMilestone.submit': 'Add Milestone',
  'dialog.editMilestone.title': 'Edit Milestone',
  'dialog.generic.title': 'Dialog',
  'dialog.generic.submit': 'Submit',

  // Dialog field labels
  'field.phaseName': 'Phase Name',
  'field.firstSubPhase': 'First Sub-Phase Name',
  'field.firstTask': 'First Task Name',
  'field.duration': 'Duration (days)',
  'field.subPhaseName': 'Sub-Phase Name',
  'field.taskName': 'Task Name',
  'field.milestoneName': 'Milestone Name',
  'field.date': 'Date',

  // Dialog placeholders
  'ph.phase': 'e.g. Phase 10',
  'ph.setup': 'e.g. Setup',
  'ph.initialSetup': 'e.g. Initial setup',
  'ph.testing': 'e.g. Testing',
  'ph.writeTests': 'e.g. Write test cases',
  'ph.implement': 'e.g. Implement feature',
  'ph.betaRelease': 'e.g. Beta Release',

  // Defaults
  'default.newTask': 'New Task',

  // Task editor panel
  'editor.title': 'Edit Task',
  'editor.taskName': 'Task Name',
  'editor.duration': 'Duration (days)',
  'editor.status': 'Status',
  'editor.criticalPath': 'Critical Path',
  'editor.predecessor': 'Predecessor Task ID',
  'editor.predecessorPh': 'e.g. p1a or p1a,p1b',
  'editor.fixedStart': 'Fixed Start Date',
  'editor.progress': 'Progress',
  'editor.color': 'Color override',
  'editor.colorAuto': 'Auto',
  'editor.assignee': 'Assignee',
  'editor.assigneePh': 'e.g. Alice',
  'editor.tags': 'Tags (comma separated)',
  'editor.tagsPh': 'e.g. frontend, blocked',
  'editor.description': 'Description',
  'editor.descriptionPh': 'Free-form notes...',
  'editor.deleteTask': 'Delete Task',
  'editor.apply': 'Apply Changes',
  'editor.close': 'Close',

  // Shared status labels
  'status.done': 'Done',
  'status.inProgress': 'In Progress',
  'status.planned': 'Planned',

  // Task context menu
  'ctx.edit': 'Edit…',
  'ctx.duplicate': 'Duplicate',
  'ctx.copyId': 'Copy ID ({id})',
  'ctx.addBefore': 'Add before',
  'ctx.addAfter': 'Add after',
  'ctx.markCritical': 'Mark critical',
  'ctx.unmarkCritical': 'Unmark critical',
  'ctx.status': 'Status',
  'ctx.statusInProgress': 'In progress',
  'ctx.delete': 'Delete',

  // Phase context menu
  'pctx.phase': 'Phase',
  'pctx.subPhase': 'Sub-phase',
  'pctx.rename': 'Rename…',
  'pctx.addSubPhase': 'Add sub-phase…',
  'pctx.addTask': 'Add task…',
  'pctx.expand': 'Expand',
  'pctx.collapse': 'Collapse',
  'pctx.delete': 'Delete',

  // Left task-list "add" overlays
  'list.addTask': 'Add Task',
  'list.addSubPhase': 'Add Sub-Phase',
  'list.addPhase': 'Add Phase',

  // Bar affordances (titles)
  'bar.addLinkedPred': 'Add task linked as predecessor · drag to connect',
  'bar.addAdjacent': 'Add adjacent task',
  'bar.addLinkedSucc': 'Add task linked as successor · drag to connect',
  'bar.baselineGhost': 'Baseline (planned)',
  'bar.overallocated': 'Over-allocated · overlaps another task for this assignee',

  // Task tooltip
  'tip.dates': 'Dates',
  'tip.duration': 'Duration',
  'tip.status': 'Status',
  'tip.criticalPath': '⚡ Critical path',
  'tip.slackLabel': 'Slack',
  'tip.slack': '{days}d float',
  'tip.overallocated': '⚠ Over-allocated assignee',
  'tip.baseline': 'Baseline',
  'tip.onBaseline': 'On baseline',
  'tip.driftLate': '+{days}d late',
  'tip.driftEarly': '{days}d early',
  'tip.progress': 'Progress',
  'tip.assignee': 'Assignee',
  'tip.tags': 'Tags',
  'tip.after': 'After',
  'tip.days': '{days}d',

  // Today marker
  'ms.today': 'TODAY',

  // Gantt warnings
  'gantt.cycleBlocked': 'Cannot create: would cause a dependency cycle',

  // Search panel
  'search.placeholder': 'Search task by name, id, or phase...',
  'search.close': 'Close (Esc)',
  'search.noMatches': 'No matches',
  'search.hintPrefix': 'Type to search.',
  'search.hintNav': 'navigate',
  'search.hintPick': 'pick',
  'search.hintClose': 'close',
  'search.badgeActive': 'Active',

  // Project list dialog
  'projects.title': 'Projects ({count})',
  'projects.taskOne': '{count} task',
  'projects.taskOther': '{count} tasks',

  // Keyboard shortcuts dialog
  'shortcuts.title': 'Keyboard shortcuts',
  'shortcuts.general': 'General',
  'shortcuts.history': 'History',
  'shortcuts.navigation': 'Navigation',
  'shortcuts.mermaidEditor': 'Mermaid editor',
  'shortcuts.showCheatsheet': 'Show this cheatsheet',
  'shortcuts.closeDialogs': 'Close dialogs / panels',
  'shortcuts.undo': 'Undo',
  'shortcuts.redo': 'Redo',
  'shortcuts.redoAlt': 'Redo (alt)',
  'shortcuts.search': 'Search tasks',
  'shortcuts.today': 'Scroll to today',
  'shortcuts.zoomIn': 'Zoom in',
  'shortcuts.zoomOut': 'Zoom out',
  'shortcuts.insertSection': 'Insert section',
  'shortcuts.insertTask': 'Insert task',
  'shortcuts.insertMilestone': 'Insert milestone',
  'shortcuts.format': 'Format',

  // Welcome dialog
  'welcome.title': 'Welcome 👋',
  'welcome.subtitle': "A quick tour of what's in here",
  'welcome.dragTitle': 'Drag to edit',
  'welcome.dragBody': 'Drag a task bar to move dates or reorder across sub-phases. Drag the right edge to resize. Right-click a task for duplicate / delete / status.',
  'welcome.connectTitle': 'Connect dependencies',
  'welcome.connectBody': 'Drag from a task bar to another to create a dependency. The line turns red when it would cause a cycle.',
  'welcome.saveTitle': 'Multi-project + auto-save',
  'welcome.saveBody': 'File menu → New / Open / Download / Import. Everything saves to localStorage automatically — no data loss on refresh.',
  'welcome.kbdTitle': 'Keyboard shortcuts',
  'welcome.kbdBody': 'Cmd/Ctrl+Z to undo, Cmd/Ctrl+F to search, T to jump to today, +/- to zoom. Press ? anywhere to see the full cheatsheet.',
  'welcome.showShortcuts': 'Show all shortcuts',
  'welcome.letsGo': "Let's go",

  // Mermaid panel
  'mermaid.editor': 'Mermaid Editor',
  'mermaid.preview': 'Preview',
  'mermaid.zoomOut': 'Zoom out',
  'mermaid.zoomIn': 'Zoom in',
  'mermaid.resetView': 'Reset view',
  'mermaid.fit': 'Fit',
  'mermaid.rendering': 'Rendering diagram...',
  'mermaid.renderError': 'Render Error',
} as const;

export default en;
