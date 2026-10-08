'use strict';
const fs = require('node:fs');
const path = require('node:path');
function panelHtml(popup) {
  return popup.replace('<html lang="zh-CN">', '<html lang="zh-CN" data-surface="panel">');
}
if (require.main === module) {
  const root = path.resolve(__dirname, '../application-info-panel');
  fs.writeFileSync(path.join(root, 'sidepanel.html'), panelHtml(fs.readFileSync(path.join(root, 'popup.html'), 'utf8')));
}
module.exports = { panelHtml };
