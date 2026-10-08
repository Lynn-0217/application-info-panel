'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createPanelPin } = require('../application-info-panel/pin-panel.js');
const { panelHtml } = require('../tools/generate-panel.cjs');

test('pin opens a window-wide panel synchronously on click and closes popup only after success', async () => {
  let finish;
  const calls = [];
  const pin = createPanelPin({
    windows: { getCurrent: async () => ({ id: 42 }) },
    sidePanel: { open: options => { calls.push(options); return new Promise(resolve => { finish = resolve; }); } }
  }, () => calls.push('closed'));
  await pin.prepare();
  const opening = pin.open();
  assert.deepEqual(calls, [{ windowId: 42 }]);
  finish();
  await opening;
  assert.deepEqual(calls, [{ windowId: 42 }, 'closed']);
});

test('failed pinning keeps the original popup open and permits retry', async () => {
  let closed = false;
  let fail = true;
  const pin = createPanelPin({
    windows: { getCurrent: async () => ({ id: 7 }) },
    sidePanel: { open: async () => { if (fail) throw new Error('Side panel unavailable'); } }
  }, () => { closed = true; });
  await pin.prepare();
  await assert.rejects(pin.open(), /Side panel unavailable/);
  assert.equal(closed, false);
  fail = false;
  await pin.open();
  assert.equal(closed, true);
});

test('unavailable or unprepared pin API never closes the popup', async () => {
  let closed = false;
  const pin = createPanelPin({}, () => { closed = true; });
  assert.throws(() => pin.open(), /PIN_NOT_READY/);
  await assert.rejects(pin.prepare(), /PIN_NOT_READY/);
  assert.equal(closed, false);
});

test('native side panel and popup use identical UI and scripts with different layout surfaces', () => {
  const root = require('node:path').resolve(__dirname, '../application-info-panel');
  const manifest = JSON.parse(fs.readFileSync(root + '/manifest.json', 'utf8'));
  assert.equal(manifest.action.default_popup, 'popup.html');
  assert.equal(manifest.side_panel.default_path, 'sidepanel.html');
  assert.ok(manifest.permissions.includes('sidePanel'));
  assert.equal(fs.readFileSync(root + '/sidepanel.html', 'utf8'), panelHtml(fs.readFileSync(root + '/popup.html', 'utf8')));
});
