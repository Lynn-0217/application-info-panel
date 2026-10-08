'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../application-info-panel/info-model.js');
const { createRepository } = require('../application-info-panel/info-store.js');
const item = (overrides = {}) => ({ id: crypto.randomUUID(), category: 'Publications', label: 'A paper', value: 'First line\nSecond line', note: 'APA citation', ...overrides });
function fixture(initial) {
  let data = initial === undefined ? {} : { [M.STORAGE_KEY]: structuredClone(initial) };
  let rejectWrite = false;
  const storage = {
    get: async () => structuredClone(data),
    set: async next => { if (rejectWrite) throw new Error('QUOTA_BYTES exceeded'); data = structuredClone(next); }
  };
  return { repo: createRepository(storage), storage, snapshot: () => structuredClone(data), fail: value => { rejectWrite = value; } };
}
test('new installations start empty and do not write demonstration data', async () => {
  const f = fixture();
  assert.deepEqual((await f.repo.dispatch({ action: 'load' })).items, []);
  assert.deepEqual(f.snapshot(), {});
});
test('existing 0.1 arrays load with content, categories and notes preserved', async () => {
  const old = item();
  const result = await fixture([old]).repo.dispatch({ action: 'load' });
  assert.deepEqual(result.items[0], { ...old, updatedAt: '' });
});
test('search covers visible fields and multiline values but excludes legacy notes', () => {
  const list = [item(), item({ category: '教育', label: 'School', value: 'University', note: '本科' })];
  assert.equal(M.filterItems(list, null, 'PAPER second').length, 1);
  assert.equal(M.filterItems(list, null, 'APA').length, 0);
  assert.equal(M.filterItems(list, '教育', '本科').length, 0);
  assert.equal(M.filterItems(list, '教育', 'school university').length, 1);
  assert.equal(M.filterItems(list, '教育', 'paper').length, 0);
  assert.equal(M.filterItems(list, null, 'paper absent').length, 0);
});
test('whitespace-only required fields are rejected', () => {
  for (const key of ['category', 'label', 'value']) assert.throws(() => M.validateItem(item({ [key]: ' \n ' })));
});
test('invalid backups and repeated IDs are rejected as a whole', () => {
  const valid = item();
  for (const backup of [{ version: 2, items: [] }, { version: 1, items: [valid, valid] }, { version: 1, items: [valid, item({ value: 12 })] }, { version: 1, items: 'invalid' }]) assert.throws(() => M.parseBackup(backup));
});
test('old backups without IDs can still import', () => {
  const result = M.parseBackup({ version: 1, items: [item({ id: undefined })] });
  assert.equal(typeof result[0].id, 'string');
});
test('concurrent additions from different panels do not overwrite one another', async () => {
  const f = fixture();
  const a = item();
  const b = item();
  await Promise.all([a, b].map(i => f.repo.dispatch({ action: 'save', item: i })));
  assert.deepEqual(new Set((await f.repo.dispatch({ action: 'load' })).items.map(i => i.id)), new Set([a.id, b.id]));
});
test('data reloads from local storage after the repository is recreated', async () => {
  const f = fixture();
  const a = item();
  await f.repo.dispatch({ action: 'save', item: a });
  const reloaded = await createRepository(f.storage).dispatch({ action: 'load' });
  assert.equal(reloaded.items[0].value, a.value);
  assert.equal(reloaded.items[0].id, a.id);
});
test('stale edits and stale deletions cannot erase newer work', async () => {
  const original = item();
  const f = fixture([original]);
  const { items: saved } = await f.repo.dispatch({ action: 'save', item: { ...original, value: 'New content' }, expectedUpdatedAt: '' });
  await assert.rejects(f.repo.dispatch({ action: 'save', item: original, expectedUpdatedAt: '' }), /其他窗口/);
  await assert.rejects(f.repo.dispatch({ action: 'delete', id: original.id, expectedUpdatedAt: '' }), /其他窗口/);
  assert.equal((await f.repo.dispatch({ action: 'load' })).items[0].value, 'New content');
  await f.repo.dispatch({ action: 'delete', id: original.id, expectedUpdatedAt: saved[0].updatedAt });
  assert.equal((await f.repo.dispatch({ action: 'load' })).items.length, 0);
});
test('failed writes preserve stored data and do not poison the operation queue', async () => {
  const original = item();
  const f = fixture([original]);
  f.fail(true);
  await assert.rejects(f.repo.dispatch({ action: 'save', item: item() }), /QUOTA/);
  assert.equal((await f.repo.dispatch({ action: 'load' })).items.length, 1);
  f.fail(false);
  await f.repo.dispatch({ action: 'save', item: item() });
  assert.equal((await f.repo.dispatch({ action: 'load' })).items.length, 2);
});
test('imports merge, skip identical facts and preserve both records when IDs collide', async () => {
  const existing = item();
  const changed = { ...existing, value: 'Different fact' };
  const f = fixture([existing]);
  const backup = { version: 1, items: [existing, item({ label: changed.label, value: changed.value })] };
  assert.equal((await f.repo.dispatch({ action: 'import', backup })).added, 1);
  assert.equal((await f.repo.dispatch({ action: 'import', backup })).added, 0);
  const collision = await fixture([existing]).repo.dispatch({ action: 'import', backup: { version: 1, items: [changed] } });
  assert.equal(collision.items.length, 2);
  assert.notEqual(collision.items[0].id, collision.items[1].id);
});
test('malformed imports leave the original library unchanged', async () => {
  const f = fixture([item()]);
  const before = f.snapshot();
  await assert.rejects(f.repo.dispatch({ action: 'import', backup: { version: 1, items: [item(), item({ note: {} })] } }));
  assert.deepEqual(f.snapshot(), before);
});
test('backup round trips preserve Unicode, line breaks and plain text markup', () => {
  const original = item({ value: '研究\n<script>alert(1)</script>\nhttps://example.edu', note: '奖学金 🏅' });
  const result = M.parseBackup(JSON.parse(JSON.stringify({ version: 1, items: [original] })));
  assert.equal(result[0].value, original.value);
  assert.equal(result[0].note, original.note);
});
