'use strict';
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const languageIndex = process.argv.indexOf('--language');
const language = languageIndex === -1 ? null : process.argv[languageIndex + 1];
if (language !== null && !['en', 'zh-CN'].includes(language)) throw new Error('Use --language en or --language zh-CN');
const root = path.resolve(__dirname, language ? `../dist/application-info-panel-${language}` : '../application-info-panel');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8' };
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, `.${pathname === '/' ? '/popup.html' : pathname}`);
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end('Forbidden'); return; }
    const content = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(content);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(8765, '127.0.0.1', () => process.stdout.write('Preview: http://127.0.0.1:8765/popup.html?demo\n'));
