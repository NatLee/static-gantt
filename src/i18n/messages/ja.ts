import type { MessageKey } from './keys';

const ja: Record<MessageKey, string> = {
  // common
  'common.close': '閉じる',
  'common.cancel': 'キャンセル',
  'common.delete': '削除',
  'common.rename': '名前を変更',
  'common.duplicate': '複製',
  'common.download': 'ダウンロード',

  // top-level menus
  'menu.file': 'ファイル',
  'menu.edit': '編集',
  'menu.view': '表示',
  'menu.insert': '挿入',
  'menu.export': 'エクスポート',
  'menu.help': 'ヘルプ',

  // File menu
  'file.newEmpty': '新規（空）',
  'file.newTemplate': 'テンプレートから新規',
  'file.openManage': '開く／管理…',
  'file.duplicate': '現在のプロジェクトを複製',
  'file.rename': '現在のプロジェクトの名前を変更…',
  'file.downloadJson': 'JSON をダウンロード',
  'file.downloadBackup': 'バックアップをダウンロード（全件）',
  'file.importJson': 'JSON をインポート…',
  'file.importFailed': 'インポートに失敗しました',
  'import.notJson': 'このファイルは有効な JSON ではありません。',
  'import.unknownFormat': 'この JSON は、このアプリのプロジェクトファイルでもバックアップでもありません。',
  'import.noProjects': 'バックアップにプロジェクトが含まれていないため、何もインポートしませんでした。',
  'import.invalidProject': 'プロジェクト「{name}」のタスクが欠けているか壊れているため、何もインポートしませんでした。',

  // Edit menu
  'edit.undo': '元に戻す',
  'edit.redo': 'やり直し',
  'edit.find': 'タスクを検索…',

  // View menu
  'view.theme': 'テーマ',
  'view.light': 'ライト',
  'view.dark': 'ダーク',
  'view.scrollToday': '今日へスクロール',
  'view.zoomIn': '拡大',
  'view.zoomOut': '縮小',
  'view.fit': '画面に合わせる',
  'view.zoomPreset': 'ズームプリセット',
  'view.dayView': '日表示',
  'view.weekView': '週表示',
  'view.monthView': '月表示',
  'view.phaseFilter': 'フェーズフィルター',
  'view.allPhases': 'すべてのフェーズ',
  'view.collapseAll': 'すべてのフェーズを折りたたむ',
  'view.expandAll': 'すべてのフェーズを展開',
  'view.hideLegend': '凡例を非表示',
  'view.showLegend': '凡例を表示',
  'view.scheduleBaseline': 'スケジュールとベースライン',
  'view.workingDays': '稼働日のみ（週末をスキップ）',
  'view.captureBaseline': 'ベースラインを取得',
  'view.recaptureBaseline': 'ベースラインを再取得',
  'view.clearBaseline': 'ベースラインをクリア',
  'view.language': '言語',

  // Insert menu
  'insert.phase': 'フェーズ…',
  'insert.subPhase': 'サブフェーズ…',
  'insert.task': 'タスク…',
  'insert.milestone': 'マイルストーン…',

  // Export menu
  'export.gantt': 'ガント',
  'export.csv': 'Excel（.xlsx）',
  'export.png': 'PNG',
  'export.jsonProject': 'JSON（現在のプロジェクト）',
  'export.mermaid': 'Mermaid',
  'export.svg': 'SVG',
  'export.mmdFile': '.mmd ファイル',
  'export.importMmd': '.mmd をインポート…',
  'export.pngFailed': 'PNG のエクスポートに失敗しました。もう一度お試しください。',

  // Help menu
  'help.shortcuts': 'キーボードショートカット',
  'help.about': 'このアプリについて',
  'help.aboutBody': 'ビジュアルと Mermaid モードに対応した静的なガントチャートエディターです。',

  // About dialog
  'about.appName': 'Gantt Studio',
  'about.version': 'v1.0',
  'about.tagline': 'ビジュアルと Mermaid モードに対応した、高速なクライアントサイドのガントチャートエディターです。',
  'about.features': '主な機能',
  'about.featureVisual': '依存関係とクリティカルパスに対応したドラッグ＆ドロップのスケジューリング',
  'about.featureMermaid': 'Mermaid ガントチャートの双方向編集',
  'about.featureAutosave': '自動保存とブラウザー内での複数プロジェクト管理',
  'about.featureExport': 'PNG・Excel・Mermaid へのエクスポート',
  'about.builtWith': 'Next.js・React・TypeScript で構築',

  // Mode segmented + header buttons
  'mode.visual': 'ビジュアル',
  'mode.mermaid': 'Mermaid',
  'mode.switchLight': 'ライトに切り替え',
  'mode.switchDark': 'ダークに切り替え',
  'mode.shortcutsTitle': 'キーボードショートカット（?）',

  // Visual contextual toolbar
  'toolbar.undo': '元に戻す（⌘Z）',
  'toolbar.redo': 'やり直し（⇧⌘Z）',
  'toolbar.today': '今日',
  'toolbar.todayTitle': '今日へスクロール（T）',
  'toolbar.workDays': '稼働日',
  'toolbar.workDaysTitle': '稼働日スケジュール — 期間は営業日で数え、依存は週末をスキップします',
  'toolbar.dayTitle': '日表示',
  'toolbar.weekTitle': '週表示',
  'toolbar.monthTitle': '月表示',
  'toolbar.fitTitle': '画面に合わせる',
  'toolbar.allPhases': 'すべてのフェーズ',
  'toolbar.milestone': 'マイルストーン',
  'toolbar.milestoneTitle': 'マイルストーンを追加',
  'toolbar.scrollPhasesLeft': '前のフェーズ',
  'toolbar.scrollPhasesRight': 'さらにフェーズ',

  // Legend
  'legend.done': '完了',
  'legend.inProgress': '進行中',
  'legend.planned': '予定',
  'legend.critical': 'クリティカル',

  // Mermaid contextual toolbar
  'mtoolbar.section': 'セクション',
  'mtoolbar.sectionTitle': 'セクションを挿入（⌘⇧S）',
  'mtoolbar.task': 'タスク',
  'mtoolbar.taskTitle': 'タスクを挿入（⌘⇧T）',
  'mtoolbar.milestone': 'マイルストーン',
  'mtoolbar.milestoneTitle': 'マイルストーンを挿入（⌘⇧M）',
  'mtoolbar.format': '整形',
  'mtoolbar.formatTitle': '整形（⌘⇧F）',
  'mtoolbar.import': 'インポート',
  'mtoolbar.importTitle': '.mmd ファイルをインポート',
  'mtoolbar.download': 'ダウンロード',
  'mtoolbar.downloadTitle': '.mmd としてダウンロード',

  // Gantt corner
  'corner.taskStructure': 'タスク構造',
  'corner.zoomIn': '拡大',
  'corner.zoomOut': '縮小',

  // Empty state
  'empty.title': 'このプロジェクトは空です',
  'empty.body': 'まずフェーズといくつかのタスクを追加するか、サンプルプロジェクトを読み込んでレイアウトを確認しましょう。',
  'empty.addPhase': '最初のフェーズを追加',
  'empty.addTask': 'タスクを追加',
  'empty.loadSample': 'またはサンプルプロジェクトを読み込む',

  // Project switcher
  'switcher.title': 'クリックで切り替え・ダブルクリックで名前を変更',
  'switcher.untitled': '無題',
  'switcher.switchProject': 'プロジェクトを切り替え',
  'switcher.more': '他 {count} 件',
  'switcher.renameThis': 'このプロジェクトの名前を変更…',
  'switcher.manage': 'プロジェクトを管理…',
  'switcher.saving': '保存中…',
  'switcher.saved': '保存しました',
  'switcher.saveFailed': '保存できません：ブラウザーがこのプロジェクトの保存を拒否しました（容量不足の可能性があります）。作業を失わないよう、バックアップをダウンロードしてください。',

  // Add/Edit dialog
  'dialog.addPhase.title': 'フェーズを追加',
  'dialog.addPhase.submit': 'フェーズを追加',
  'dialog.addSubPhase.title': 'サブフェーズを追加',
  'dialog.addSubPhase.submit': 'サブフェーズを追加',
  'dialog.addTask.title': 'タスクを追加',
  'dialog.addTask.submit': 'タスクを追加',
  'dialog.addBefore.title': '前にタスクを挿入',
  'dialog.addAfter.title': '後にタスクを挿入',
  'dialog.insertSubmit': 'タスクを挿入',
  'dialog.editPhase.title': 'フェーズを編集',
  'dialog.editSubPhase.title': 'サブフェーズを編集',
  'dialog.saveChanges': '変更を保存',
  'dialog.addMilestone.title': 'マイルストーンを追加',
  'dialog.addMilestone.submit': 'マイルストーンを追加',
  'dialog.editMilestone.title': 'マイルストーンを編集',
  'dialog.generic.title': 'ダイアログ',
  'dialog.generic.submit': '送信',

  // Dialog field labels
  'field.phaseName': 'フェーズ名',
  'field.firstSubPhase': '最初のサブフェーズ名',
  'field.firstTask': '最初のタスク名',
  'field.duration': '期間（日）',
  'field.subPhaseName': 'サブフェーズ名',
  'field.taskName': 'タスク名',
  'field.milestoneName': 'マイルストーン名',
  'field.date': '日付',

  // Dialog placeholders
  'ph.phase': '例: Phase 10',
  'ph.setup': '例: Setup',
  'ph.initialSetup': '例: 初期セットアップ',
  'ph.testing': '例: Testing',
  'ph.writeTests': '例: テストケースを作成',
  'ph.implement': '例: 機能を実装',
  'ph.betaRelease': '例: Beta Release',

  // Defaults
  'default.newTask': '新しいタスク',

  // Task editor panel
  'editor.title': 'タスクを編集',
  'editor.taskName': 'タスク名',
  'editor.duration': '期間（日）',
  'editor.status': 'ステータス',
  'editor.criticalPath': 'クリティカルパス',
  'editor.predecessor': '先行タスク ID',
  'editor.predecessorPh': '例: p1a または p1a,p1b',
  'editor.fixedStart': '固定開始日',
  'editor.progress': '進捗',
  'editor.color': '色の上書き',
  'editor.colorAuto': '自動',
  'editor.assignee': '担当者',
  'editor.assigneePh': '例: Alice',
  'editor.tags': 'タグ（カンマ区切り）',
  'editor.tagsPh': '例: frontend, blocked',
  'editor.description': '説明',
  'editor.descriptionPh': '自由記述のメモ…',
  'editor.deleteTask': 'タスクを削除',
  'editor.apply': '変更を適用',
  'editor.close': '閉じる',

  // Shared status labels
  'status.done': '完了',
  'status.inProgress': '進行中',
  'status.planned': '予定',

  // Task context menu
  'ctx.edit': '編集…',
  'ctx.duplicate': '複製',
  'ctx.copyId': 'ID をコピー（{id}）',
  'ctx.addBefore': '前に追加',
  'ctx.addAfter': '後に追加',
  'ctx.markCritical': 'クリティカルに設定',
  'ctx.unmarkCritical': 'クリティカルを解除',
  'ctx.status': 'ステータス',
  'ctx.statusInProgress': '進行中',
  'ctx.delete': '削除',

  // Phase context menu
  'pctx.phase': 'フェーズ',
  'pctx.subPhase': 'サブフェーズ',
  'pctx.rename': '名前を変更…',
  'pctx.addSubPhase': 'サブフェーズを追加…',
  'pctx.addTask': 'タスクを追加…',
  'pctx.expand': '展開',
  'pctx.collapse': '折りたたむ',
  'pctx.delete': '削除',

  // Left task-list "add" overlays
  'list.addTask': 'タスクを追加',
  'list.addSubPhase': 'サブフェーズを追加',
  'list.addPhase': 'フェーズを追加',

  // Bar affordances (titles)
  'bar.addLinkedPred': '先行依存タスクを追加・ドラッグで接続',
  'bar.addAdjacent': '隣接タスクを追加',
  'bar.addLinkedSucc': '後続依存タスクを追加・ドラッグで接続',
  'bar.baselineGhost': 'ベースライン（計画）',
  'bar.overallocated': '過負荷・この担当者の別タスクと期間が重複しています',

  // Task tooltip
  'tip.dates': '日付',
  'tip.duration': '期間',
  'tip.status': 'ステータス',
  'tip.criticalPath': '⚡ クリティカルパス',
  'tip.slackLabel': 'フロート',
  'tip.slack': '余裕 {days} 日',
  'tip.overallocated': '⚠ 担当者が過負荷',
  'tip.baseline': 'ベースライン',
  'tip.onBaseline': 'ベースライン通り',
  'tip.driftLate': '{days} 日遅延',
  'tip.driftEarly': '{days} 日前倒し',
  'tip.progress': '進捗',
  'tip.assignee': '担当者',
  'tip.tags': 'タグ',
  'tip.after': '依存先',
  'tip.days': '{days} 日',

  // Today marker
  'ms.today': '今日',

  // Gantt warnings
  'gantt.cycleBlocked': '作成できません：循環依存が発生します',

  // Search panel
  'search.placeholder': '名前・ID・フェーズでタスクを検索…',
  'search.close': '閉じる（Esc）',
  'search.noMatches': '一致なし',
  'search.hintPrefix': '入力して検索。',
  'search.hintNav': '移動',
  'search.hintPick': '選択',
  'search.hintClose': '閉じる',
  'search.badgeActive': '進行中',

  // Project list dialog
  'projects.title': 'プロジェクト（{count}）',
  'projects.taskOne': '{count} 件のタスク',
  'projects.taskOther': '{count} 件のタスク',

  // Keyboard shortcuts dialog
  'shortcuts.title': 'キーボードショートカット',
  'shortcuts.general': '一般',
  'shortcuts.history': '履歴',
  'shortcuts.navigation': 'ナビゲーション',
  'shortcuts.mermaidEditor': 'Mermaid エディター',
  'shortcuts.showCheatsheet': 'このチートシートを表示',
  'shortcuts.closeDialogs': 'ダイアログ／パネルを閉じる',
  'shortcuts.undo': '元に戻す',
  'shortcuts.redo': 'やり直し',
  'shortcuts.redoAlt': 'やり直し（代替）',
  'shortcuts.search': 'タスクを検索',
  'shortcuts.today': '今日へスクロール',
  'shortcuts.zoomIn': '拡大',
  'shortcuts.zoomOut': '縮小',
  'shortcuts.insertSection': 'セクションを挿入',
  'shortcuts.insertTask': 'タスクを挿入',
  'shortcuts.insertMilestone': 'マイルストーンを挿入',
  'shortcuts.format': '整形',

  // Welcome dialog
  'welcome.title': 'ようこそ 👋',
  'welcome.subtitle': 'ここでできることを簡単にご紹介',
  'welcome.dragTitle': 'ドラッグで編集',
  'welcome.dragBody': 'タスクバーをドラッグして日付を移動したり、サブフェーズをまたいで並べ替えできます。右端をドラッグで期間を変更。タスクを右クリックで複製／削除／ステータス変更。',
  'welcome.connectTitle': '依存関係を接続',
  'welcome.connectBody': 'あるタスクバーから別のタスクバーへドラッグすると依存を作成できます。循環になる場合は線が赤くなります。',
  'welcome.saveTitle': '複数プロジェクト + 自動保存',
  'welcome.saveBody': 'ファイルメニュー → 新規／開く／ダウンロード／インポート。すべての変更は localStorage に自動保存され、再読み込みしても失われません。',
  'welcome.kbdTitle': 'キーボードショートカット',
  'welcome.kbdBody': 'Cmd/Ctrl+Z で元に戻す、Cmd/Ctrl+F で検索、T で今日へ移動、+/- でズーム。どこでも ? を押すと全ショートカットを表示します。',
  'welcome.showShortcuts': 'すべてのショートカットを表示',
  'welcome.letsGo': 'はじめる',

  // Mermaid panel
  'mermaid.editor': 'Mermaid エディター',
  'mermaid.preview': 'プレビュー',
  'mermaid.zoomOut': '縮小',
  'mermaid.zoomIn': '拡大',
  'mermaid.resetView': '表示をリセット',
  'mermaid.fit': 'フィット',
  'mermaid.rendering': '図を描画中…',
  'mermaid.renderError': '描画エラー',
};

export default ja;
