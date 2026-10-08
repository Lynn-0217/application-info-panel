'use strict';
const { t } = InfoI18n;
InfoI18n.localizeDocument(document);
const M = InfoModel;
const $ = id => document.getElementById(id);
const isExtension = Boolean(globalThis.chrome?.runtime?.id && chrome.storage?.local);
const isPreview = !isExtension && new URLSearchParams(location.search).has('demo');
const isSidePanel = document.documentElement.dataset.surface === 'panel';
const panelPin = isExtension && !isSidePanel ? createPanelPin(chrome, () => window.close()) : null;
let pinReady = isPreview;
let items = [];
let activeCategory = null;
let editingItem = null;
let deletingItem = null;
let pendingBackup = null;
let busy = false;
let loaded = false;
let toastTimer;
const iconPaths = {
  search: ['m21 21-5-5', 'M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0'],
  copy: ['M9 9h12v12H9z', 'M5 15H3V3h12v2'],
  edit: ['m16 3 5 5-12 12-6 1 1-6Z', 'm14 5 5 5'],
  trash: ['M3 6h18', 'M9 6V3h6v3', 'm5 6 1 15h12l1-15', 'M10 10v7M14 10v7'],
  close: ['m6 6 12 12', 'm18 6-12 12'],
  pin: ['m16 3 5 5-4 1-4 5-1 4-6-6 4-1 5-4Z', 'm8 16-5 5'],
};
function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) svg.setAttribute(key, value);
  for (const d of iconPaths[name]) {
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}
function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function button(text, className, onClick, iconName) {
  const btn = element('button', className);
  btn.type = 'button';
  if (iconName) btn.append(icon(iconName));
  btn.append(document.createTextNode(text));
  btn.addEventListener('click', onClick);
  return btn;
}
function showToast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').classList.add('show');
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2600);
}
function showError(id, message = '') {
  $(id).textContent = message;
  $(id).classList.toggle('hidden', !message);
}
const sampleItems = [
  { id: 'demo-name', category: t('基本信息'), label: t('英文姓名'), value: 'Alex Chen' },
  { id: 'demo-email', category: t('基本信息'), label: t('学术邮箱'), value: 'alex.chen@example.edu' },
  { id: 'demo-paper', category: 'Publications', label: t('论文引用'), value: 'Chen, A., & Lee, J. (2025). Learning from limited data.\nExample Journal of Research, 12(3), 101–118.' },
  { id: 'demo-school', category: t('教育'), label: t('学校与专业'), value: 'Example University\nM.Sc. in Computer Science\nSeptember 2023 – June 2025' },
  { id: 'demo-award', category: t('奖项'), label: t('研究奖学金'), value: 'Graduate Research Scholarship\nExample University · 2024' }
];
let previewRepository;
if (isPreview) {
  let memory = { [M.STORAGE_KEY]: sampleItems };
  previewRepository = createInfoRepository({ get: async () => structuredClone(memory), set: async next => { memory = structuredClone(next); } });
}
async function request(action, payload = {}) {
  if (isPreview) return previewRepository.dispatch({ action, ...payload });
  if (!isExtension) throw new Error(t('请在 Chrome 中加载扩展后点击右上角图标。网页示例请使用 ?demo。'));
  const response = await chrome.runtime.sendMessage({ scope: 'application-info', action, ...payload });
  if (!response?.ok) throw new Error(response?.error || t('扩展连接中断，请重新打开弹窗'));
  return response;
}
function categories() { return [...new Set(items.map(i => i.category))]; }
function renderCategories() {
  const cats = categories();
  if (activeCategory !== null && !cats.includes(activeCategory)) activeCategory = null;
  $('categoryFilter').replaceChildren();
  for (const cat of [null, ...cats]) {
    const option = element('option', '', cat === null ? t('全部分类') : cat);
    option.value = cat ?? '';
    $('categoryFilter').append(option);
  }
  $('categoryFilter').value = activeCategory ?? '';
  $('categorySuggestions').replaceChildren(...cats.map(cat => {
    const option = document.createElement('option');
    option.value = cat;
    return option;
  }));
}
async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(t('已复制到剪贴板'));
    if (btn) {
      const original = btn.textContent;
      btn.disabled = true;
      btn.replaceChildren(icon('copy'), document.createTextNode(t('已复制')));
      setTimeout(() => { btn.replaceChildren(icon('copy'), document.createTextNode(original)); btn.disabled = false; }, 1400);
    }
  } catch {
    showToast(t('复制失败，请检查剪贴板权限，或选中文本手动复制'));
  }
}
function renderCards() {
  const visible = M.filterItems(items, activeCategory, $('searchInput').value);
  $('cards').replaceChildren();
  $('resultCount').textContent = visible.length === items.length ? t('count', { count: items.length }) : t('filteredCount', { visible: visible.length, total: items.length });
  $('emptyState').classList.toggle('hidden', visible.length > 0 || !loaded);
  const filtered = items.length > 0;
  $('emptyTitle').textContent = filtered ? t('没有匹配的信息') : t('暂无信息');
  $('emptyDescription').textContent = filtered ? t('更换关键词或清除筛选。') : t('点击「新增」保存常用信息。');
  $('emptyAddBtn').classList.toggle('hidden', filtered);
  $('clearFiltersBtn').classList.toggle('hidden', !filtered);
  for (const item of visible) {
    const card = element('article', 'record');
    const head = element('div', 'record-head');
    const title = element('div', 'record-title');
    const label = element('h3', '', item.label);
    label.title = item.label;
    const category = element('div', 'category', item.category);
    category.title = item.category;
    title.append(label, category);
    const edit = button('', 'icon-btn', () => openEdit(item.id), 'edit');
    edit.setAttribute('aria-label', t('editItem', { name: item.label }));
    edit.title = t('编辑信息');
    const remove = button('', 'icon-btn delete-icon', () => openDelete(item.id), 'trash');
    remove.setAttribute('aria-label', t('deleteItem', { name: item.label }));
    remove.title = t('删除信息');
    const tools = element('div', 'record-tools');
    tools.append(edit, remove);
    head.append(title, tools);
    const body = element('div', 'record-body');
    body.append(element('div', 'value', item.value));
    const actions = element('div', 'record-actions');
    const copyValue = button(t('复制'), 'copy-btn', () => copyText(item.value, copyValue), 'copy');
    copyValue.title = t('复制内容');
    actions.append(copyValue);
    body.append(actions);
    card.append(head, body);
    $('cards').append(card);
  }
}
function render() { renderCategories(); renderCards(); }
function openEdit(id = null) {
  if (!loaded || busy) return;
  editingItem = id ? structuredClone(items.find(i => i.id === id)) : null;
  if (id && !editingItem) return;
  $('editForm').reset();
  $('dialogTitle').textContent = editingItem ? t('编辑信息') : t('新增信息');
  $('categoryField').value = editingItem?.category || activeCategory || '';
  $('labelField').value = editingItem?.label || '';
  $('valueField').value = editingItem?.value || '';
  showError('formError');
  $('editDialog').showModal();
  (editingItem || activeCategory ? $('labelField') : $('categoryField')).focus();
}
function openDelete(id) {
  if (!loaded || busy) return;
  const item = items.find(item => item.id === id);
  if (!item) return;
  deletingItem = structuredClone(item);
  $('deleteSummary').textContent = t('deleteSummary', { name: item.label });
  showError('deleteError');
  $('deleteDialog').showModal();
  $('cancelDeleteBtn').focus();
}
function setBusy(value) {
  busy = value;
  for (const id of ['saveBtn', 'confirmDeleteBtn', 'cancelDeleteBtn', 'confirmImportBtn', 'cancelImportBtn', 'cancelBtn', 'closeDialogBtn', 'addBtn', 'emptyAddBtn', 'importBtn', 'exportBtn']) $(id).disabled = value || !loaded;
  $('saveBtn').textContent = value ? t('处理中…') : t('保存信息');
  $('pinBtn').disabled = value || !loaded || !pinReady;
}
async function mutate(action, payload, errorId, successMessage) {
  if (busy) return;
  setBusy(true);
  showError(errorId);
  try {
    const result = await request(action, payload);
    items = result.items;
    render();
    $('editDialog').close();
    $('deleteDialog').close();
    $('importDialog').close();
    showToast(typeof successMessage === 'function' ? successMessage(result) : successMessage);
  } catch (error) {
    showError(errorId, error.message);
  } finally { setBusy(false); }
}
for (const [id, name] of [['searchIcon', 'search'], ['closeDialogBtn', 'close'], ['pinBtn', 'pin']]) $(id).append(icon(name));
$('pinBtn').addEventListener('click', async () => {
  if (busy || !pinReady) return;
  if (isPreview) { showToast(t('请在 Chrome 扩展中使用固定功能')); return; }
  setBusy(true);
  try { await panelPin.open(); }
  catch (error) {
    showToast(error.message === 'PIN_NOT_READY' ? t('固定功能暂不可用，请重新打开弹窗') : t('pinError', { error: error.message }));
  } finally { setBusy(false); }
});
$('addBtn').addEventListener('click', () => openEdit());
$('emptyAddBtn').addEventListener('click', () => openEdit());
for (const id of ['closeDialogBtn', 'cancelBtn']) $(id).addEventListener('click', () => { if (!busy) $('editDialog').close(); });
for (const id of ['editDialog', 'deleteDialog', 'importDialog']) $(id).addEventListener('cancel', event => { if (busy) event.preventDefault(); });
$('searchInput').addEventListener('input', renderCards);
$('categoryFilter').addEventListener('change', event => { activeCategory = event.target.value || null; render(); });
$('clearFiltersBtn').addEventListener('click', () => { activeCategory = null; $('searchInput').value = ''; render(); $('searchInput').focus(); });
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !$('editDialog').open && !$('deleteDialog').open && !$('importDialog').open) {
    event.preventDefault();
    $('searchInput').focus();
  }
});
$('editForm').addEventListener('submit', event => {
  event.preventDefault();
  if (busy) return;
  try {
    // Preserve legacy notes in storage and backups without exposing them in the UI.
    const next = M.validateItem({ id: editingItem?.id || crypto.randomUUID(), category: $('categoryField').value, label: $('labelField').value, value: $('valueField').value, note: editingItem?.note || '' });
    mutate('save', { item: next, expectedUpdatedAt: editingItem?.updatedAt ?? null }, 'formError', t('信息已保存'));
  } catch (error) { showError('formError', error.message); }
});
$('cancelDeleteBtn').addEventListener('click', () => { if (!busy) $('deleteDialog').close(); });
$('deleteDialog').addEventListener('close', () => { deletingItem = null; });
$('confirmDeleteBtn').addEventListener('click', () => {
  if (deletingItem) mutate('delete', { id: deletingItem.id, expectedUpdatedAt: deletingItem.updatedAt }, 'deleteError', t('信息已删除'));
});
$('exportBtn').addEventListener('click', async () => {
  if (busy || !loaded) return;
  setBusy(true);
  try {
    const latest = await request('load');
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), items: latest.items }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `application-info-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(t('备份下载已开始'));
  } catch (error) { showToast(t('exportError', { error: error.message })); }
  finally { setBusy(false); }
});
$('importBtn').addEventListener('click', () => { if (!busy) $('importInput').click(); });
$('importInput').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file || busy) return;
  setBusy(true);
  try {
    if (file.size > 10 * 1024 * 1024) throw new Error(t('备份文件不能超过 10 MB'));
    const backup = JSON.parse(await file.text());
    const imported = M.parseBackup(backup);
    // Retain normalized IDs so legacy backups without IDs are parsed only once.
    pendingBackup = { version: 1, items: imported };
    const cats = new Set(imported.map(i => i.category));
    $('importSummary').textContent = t('importSummary', { count: imported.length, categories: cats.size });
    showError('importError');
    $('importDialog').showModal();
  } catch (error) { showToast(t('importError', { error: error.message })); }
  finally { setBusy(false); }
});
$('cancelImportBtn').addEventListener('click', () => { if (!busy) { pendingBackup = null; $('importDialog').close(); } });
$('confirmImportBtn').addEventListener('click', () => {
  if (pendingBackup) mutate('import', { backup: pendingBackup }, 'importError', result => result.added ? t('imported', { count: result.added }) : t('内容已存在，无需重复导入'));
});
if (isExtension) chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes[M.STORAGE_KEY]) return;
  try {
    items = M.validateItems(changes[M.STORAGE_KEY].newValue ?? []);
    render();
  } catch (error) { showError('errorBanner', t('loadError', { error: error.message })); }
});
async function init() {
  try {
    const result = await request('load');
    items = result.items;
    loaded = true;
    $('storageStatus').textContent = isPreview ? t('示例数据') : t('本地保存');
    $('storageStatus').title = isPreview ? t('示例修改仅保留在当前页面') : t('信息仅保存在此浏览器');
    setBusy(false);
    render();
    if (panelPin) {
      try {
        await panelPin.prepare();
        pinReady = true;
        setBusy(busy);
      } catch {
        $('pinBtn').title = t('固定功能暂不可用，请重新打开弹窗');
      }
    }
  } catch (error) {
    showError('errorBanner', error.message);
    $('storageStatus').textContent = t('本地信息未加载');
  }
}
init();
