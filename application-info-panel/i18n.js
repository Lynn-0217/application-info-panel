(function (root) {
  'use strict';
  const english = {
    'Application Info · 申请信息库': 'Application Info · Info Library',
    '信息库': 'Info Library',
    '＋ 新增': '+ Add',
    '固定到侧栏': 'Pin to side panel',
    '固定到侧栏，点击网页也不会关闭': 'Pin to side panel to keep it open while browsing',
    '请在 Chrome 扩展中使用固定功能': 'Pinning is available in the installed Chrome extension.',
    '固定功能暂不可用，请重新打开弹窗': 'Pinning is unavailable. Please reopen the popup.',
    pinError: 'Could not pin: {error}',
    '搜索信息': 'Search info',
    '按分类筛选': 'Filter by category',
    '全部分类': 'All categories',
    '0 条': '0 items',
    '暂无信息': 'No saved info',
    '点击「新增」保存常用信息。': 'Click Add to save frequently used info.',
    '新增信息': 'Add info',
    '清除筛选': 'Clear filters',
    '正在读取…': 'Loading…',
    '导出': 'Export',
    '导入': 'Import',
    '选择 JSON 备份': 'Choose a JSON backup',
    '关闭编辑': 'Close editor',
    '分类': 'Category',
    '名称': 'Name',
    '内容': 'Content',
    '如：基本信息、教育、Publications': 'e.g. Personal, Education, Publications',
    '如：英文姓名、论文引用、学校地址': 'e.g. Full name, Citation, School address',
    '要保存或复制的内容': 'Content to save or copy',
    '取消': 'Cancel',
    '保存信息': 'Save',
    '删除信息': 'Delete info',
    '删除后无法撤销。': 'This cannot be undone.',
    '删除': 'Delete',
    '导入备份': 'Import backup',
    '信息会合并到现有库，完全相同的内容会自动跳过。': 'Merge into this library. Identical entries are skipped.',
    '合并导入': 'Merge import',
    '基本信息': 'Personal',
    '英文姓名': 'Full name',
    '学术邮箱': 'Academic email',
    '论文引用': 'Citation',
    '教育': 'Education',
    '学校与专业': 'School and degree',
    '奖项': 'Awards',
    '研究奖学金': 'Research scholarship',
    '请在 Chrome 中加载扩展后点击右上角图标。网页示例请使用 ?demo。': 'Load the extension in Chrome and click its toolbar icon. Use ?demo for a web preview.',
    '扩展连接中断，请重新打开弹窗': 'Connection lost. Please reopen the popup.',
    '已复制到剪贴板': 'Copied to clipboard',
    '已复制': 'Copied',
    '复制失败，请检查剪贴板权限，或选中文本手动复制': 'Copy failed. Check clipboard permission or select and copy the text.',
    '没有匹配的信息': 'No matching info',
    '更换关键词或清除筛选。': 'Try another search or clear the filters.',
    '编辑信息': 'Edit info',
    '复制': 'Copy',
    '复制内容': 'Copy content',
    '处理中…': 'Working…',
    '信息已保存': 'Info saved',
    '信息已删除': 'Info deleted',
    '备份下载已开始': 'Backup download started',
    '备份文件不能超过 10 MB': 'Backup files must be 10 MB or smaller.',
    '内容已存在，无需重复导入': 'Already in this library. No duplicates added.',
    '示例数据': 'Demo data',
    '本地保存': 'Saved locally',
    '示例修改仅保留在当前页面': 'Demo changes last only on this page.',
    '信息仅保存在此浏览器': 'Info is stored only in this browser.',
    '本地信息未加载': 'Local info could not be loaded',
    '信息格式无效': 'Invalid entry format',
    '请填写分类、名称和内容': 'Enter a category, name and content.',
    '信息超过长度限制': 'Entry exceeds the length limit.',
    '备注格式无效': 'Invalid legacy note format',
    '备注超过长度限制': 'Legacy note exceeds the length limit.',
    '备份格式无效或记录过多': 'Invalid backup or too many entries',
    '备份包含重复 ID': 'Backup contains duplicate IDs',
    '不支持的备份格式': 'Unsupported backup format',
    '此信息已在其他窗口更新，请关闭编辑后重新打开': 'This entry changed in another window. Close this dialog and reopen it.',
    '信息已不存在': 'This entry no longer exists.',
    '未知操作': 'Unknown operation',
    count: '{count} items',
    filteredCount: '{visible} / {total} items',
    editItem: 'Edit {name}',
    deleteItem: 'Delete {name}',
    deleteSummary: 'Delete “{name}”?',
    exportError: 'Export failed: {error}',
    importError: 'Import failed: {error}',
    importSummary: 'This backup contains {count} entries in {categories} categories.',
    imported: 'Imported {count} new entries',
    loadError: 'Cannot read local info: {error}'
  };
  const chinese = {
    pinError: '固定失败：{error}',
    count: '{count} 条',
    filteredCount: '{visible} / {total} 条',
    editItem: '编辑 {name}',
    deleteItem: '删除 {name}',
    deleteSummary: '确定删除“{name}”吗？',
    exportError: '导出失败：{error}',
    importError: '导入失败：{error}',
    importSummary: '此备份包含 {count} 条信息，来自 {categories} 个分类。',
    imported: '已导入 {count} 条新信息',
    loadError: '本地数据无法读取：{error}'
  };
  function createI18n(language) {
    const locale = language === 'en' ? 'en' : 'zh-CN';
    const messages = locale === 'en' ? english : chinese;
    function t(key, params = {}) {
      const text = messages[key] ?? key;
      return text.replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(params, name) ? String(params[name]) : match);
    }
    function localizeDocument(document) {
      document.documentElement.lang = locale;
      const walker = document.createTreeWalker(document.body, 4);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (['SCRIPT', 'STYLE'].includes(node.parentElement?.tagName)) continue;
        const key = node.textContent.trim();
        if (key && Object.hasOwn(english, key)) node.textContent = node.textContent.replace(key, t(key));
      }
      for (const el of document.querySelectorAll('[aria-label], [placeholder], [title]')) {
        for (const attr of ['aria-label', 'placeholder', 'title']) {
          const key = el.getAttribute(attr);
          if (key && Object.hasOwn(english, key)) el.setAttribute(attr, t(key));
        }
      }
      document.title = t('Application Info · 申请信息库');
    }
    return { locale, t, localizeDocument };
  }
  const api = { ...createI18n(root.INFO_LANGUAGE), createI18n, english, chinese };
  root.InfoI18n = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
