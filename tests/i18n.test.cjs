'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { createI18n, english } = require('../application-info-panel/i18n.js');
const root = path.resolve(__dirname, '../application-info-panel');

test('all static and dynamic application messages have English translations', () => {
  const html = fs.readFileSync(path.join(root, 'popup.html'), 'utf8');
  const staticText = [...html.matchAll(/>([^<>]*[\p{Script=Han}][^<>]*)</gu),
    ...html.matchAll(/(?:placeholder|aria-label)="([^"]*[\p{Script=Han}][^"]*)"/gu)];
  for (const [, text] of staticText) assert.ok(Object.hasOwn(english, text.trim()), text);
  for (const file of ['popup.js', 'info-model.js', 'info-store.js']) {
    for (const [, key] of fs.readFileSync(path.join(root, file), 'utf8').matchAll(/\bt\('([^']+)'/g)) {
      assert.ok(Object.hasOwn(english, key), `${file}: ${key}`);
    }
  }
});

test('both languages interpolate values without changing user-provided text', () => {
  const name = '个人资料 <script> & {count}';
  assert.equal(createI18n('en').t('deleteSummary', { name }), `Delete “${name}”?`);
  assert.equal(createI18n('zh-CN').t('count', { count: 5 }), '5 条');
  assert.equal(createI18n('en').t('filteredCount', { visible: 1, total: 5 }), '1 / 5 items');
});

function load(language) {
  const context = vm.createContext({ INFO_LANGUAGE: language, crypto: webcrypto });
  for (const file of ['i18n.js', 'info-model.js', 'info-store.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  }
  return context;
}

test('English validation and conflict messages are translated in the storage path', async () => {
  const context = load('en');
  assert.throws(() => context.InfoModel.validateItem({}), /Enter a category/);
  assert.throws(() => context.InfoModel.parseBackup({ version: 2, items: [] }), /Unsupported backup/);
  const existing = { id: 'one', category: '研究', label: '中文标题', value: 'First\n第二行', updatedAt: 'new' };
  const repo = context.createInfoRepository({ get: async () => ({ applicationInfoItems: [existing] }), set: async () => {} });
  await assert.rejects(repo.dispatch({ action: 'delete', id: 'one', expectedUpdatedAt: 'old' }), /another window/);
});

test('backups remain compatible across languages without translating stored facts', () => {
  const backup = { version: 1, items: [{ id: 'one', category: '研究', label: '标题', value: 'First\n第二行', note: '旧备注' }] };
  const chinese = load('zh-CN').InfoModel.parseBackup(backup);
  const englishItems = load('en').InfoModel.parseBackup(JSON.parse(JSON.stringify({ version: 1, items: chinese })));
  assert.equal(JSON.stringify(englishItems), JSON.stringify(chinese));
});
