(function (root) {
  'use strict';
  const { t } = root.InfoI18n || require('./i18n.js');
  const STORAGE_KEY = 'applicationInfoItems';
  function validateItem(item) {
    if (!item || typeof item !== 'object') throw new Error(t('信息格式无效'));
    const next = {};
    for (const key of ['id', 'category', 'label', 'value']) {
      if (typeof item[key] !== 'string' || !item[key].trim()) throw new Error(t('请填写分类、名称和内容'));
      next[key] = item[key].trim();
    }
    if (next.id.length > 200 || next.category.length > 100 || next.label.length > 200 || next.value.length > 100000) throw new Error(t('信息超过长度限制'));
    if (item.note !== undefined && typeof item.note !== 'string') throw new Error(t('备注格式无效'));
    next.note = (item.note || '').trim();
    if (next.note.length > 10000) throw new Error(t('备注超过长度限制'));
    next.updatedAt = typeof item.updatedAt === 'string' ? item.updatedAt : '';
    return next;
  }
  function validateItems(items) {
    if (!Array.isArray(items) || items.length > 10000) throw new Error(t('备份格式无效或记录过多'));
    const result = items.map(validateItem);
    if (new Set(result.map(i => i.id)).size !== result.length) throw new Error(t('备份包含重复 ID'));
    return result;
  }
  function parseBackup(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.items)) throw new Error(t('不支持的备份格式'));
    return validateItems(data.items.map(item => ({ ...item, id: item?.id || crypto.randomUUID() })));
  }
  function filterItems(items, category, query) {
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return items.filter(item => (category === null || item.category === category) && terms.every(term => `${item.category} ${item.label} ${item.value}`.toLocaleLowerCase().includes(term)));
  }
  const signature = item => JSON.stringify([item.category, item.label, item.value, item.note]);
  const api = { STORAGE_KEY, validateItem, validateItems, parseBackup, filterItems, signature };
  root.InfoModel = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
