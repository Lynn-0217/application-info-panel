'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { webcrypto, randomUUID } = require('node:crypto');
const root = path.resolve(__dirname, '../application-info-panel');
const key = 'applicationInfoItems';
const record = () => ({ id: randomUUID(), category: '验证', label: '重开测试', value: 'First line\n第二行' });

function startWorker(localStorage) {
  let handler;
  const context = vm.createContext({
    crypto: webcrypto,
    console,
    chrome: {
      storage: { local: localStorage },
      runtime: { id: 'test-extension', onMessage: { addListener: listener => { handler = listener; } } }
    }
  });
  context.importScripts = (...files) => files.forEach(file => {
    vm.runInContext(fsSync.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  });
  vm.runInContext(fsSync.readFileSync(path.join(root, 'service-worker.js'), 'utf8'), context);
  return request => new Promise(resolve => {
    assert.equal(handler({ scope: 'application-info', ...request }, { id: 'test-extension' }, resolve), true);
  });
}

test('background re-creation reloads saved, edited and deleted records from durable storage', async t => {
  // A real file simulates the durable Chrome storage boundary; contexts share no JS state.
  const file = path.resolve(__dirname, '../artifacts', `worker-storage-${randomUUID()}.json`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  t.after(async () => { await fs.unlink(file).catch(error => { if (error.code !== 'ENOENT') throw error; }); });
  const diskStorage = () => ({
    get: async requestedKey => {
      assert.equal(requestedKey, key);
      try { return JSON.parse(await fs.readFile(file, 'utf8')); }
      catch (error) { if (error.code === 'ENOENT') return {}; throw error; }
    },
    set: async data => { await fs.writeFile(file, JSON.stringify(data)); }
  });
  let send = startWorker(diskStorage());
  const original = record();
  assert.equal((await send({ action: 'save', item: original })).ok, true);
  send = startWorker(diskStorage());
  let response = await send({ action: 'load' });
  assert.equal(response.items[0].value, original.value);
  const saved = response.items[0];
  assert.equal((await send({ action: 'save', item: { ...saved, value: 'Edited\n已编辑' }, expectedUpdatedAt: saved.updatedAt })).ok, true);
  send = startWorker(diskStorage());
  response = await send({ action: 'load' });
  assert.equal(response.items[0].value, 'Edited\n已编辑');
  assert.equal((await send({ action: 'delete', id: saved.id, expectedUpdatedAt: response.items[0].updatedAt })).ok, true);
  assert.equal((await startWorker(diskStorage())({ action: 'load' })).items.length, 0);
});

test('background acknowledges saving only after local storage finishes writing', async () => {
  let stored = {};
  let releaseWrite;
  let signalWrite;
  const started = new Promise(resolve => { signalWrite = resolve; });
  const gate = new Promise(resolve => { releaseWrite = resolve; });
  const storage = {
    get: async () => structuredClone(stored),
    set: async data => { signalWrite(); await gate; stored = structuredClone(data); }
  };
  const send = startWorker(storage);
  let acknowledged = false;
  const saving = send({ action: 'save', item: record() }).then(response => { acknowledged = true; return response; });
  await started;
  assert.equal(acknowledged, false);
  assert.deepEqual(stored, {});
  releaseWrite();
  assert.equal((await saving).ok, true);
  assert.equal((await startWorker(storage)({ action: 'load' })).items.length, 1);
});

test('background reports storage errors and can recover without clearing saved data', async () => {
  let stored = {};
  let fail = false;
  const storage = {
    get: async () => structuredClone(stored),
    set: async data => { if (fail) throw new Error('QUOTA_BYTES exceeded'); stored = structuredClone(data); }
  };
  const send = startWorker(storage);
  await send({ action: 'save', item: record() });
  fail = true;
  const result = await send({ action: 'save', item: record() });
  assert.equal(result.ok, false);
  assert.match(result.error, /QUOTA/);
  assert.equal((await send({ action: 'load' })).items.length, 1);
  fail = false;
  assert.equal((await send({ action: 'save', item: record() })).ok, true);
});
