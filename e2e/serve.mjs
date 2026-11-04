// Serve the static export the way GitHub Pages does: under a base path, index.html for folders.
// usage: node e2e/serve.mjs <dir> <port> [basePath]
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const [root = 'out', port = '4173', basePath = ''] = process.argv.slice(2);
const rootDir = path.resolve(root);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

http
  .createServer((req, res) => {
    let url = decodeURIComponent((req.url ?? '/').split('?')[0]);
    if (basePath) {
      if (!url.startsWith(basePath)) return res.writeHead(404).end('outside base path');
      url = url.slice(basePath.length) || '/';
    }
    let file = path.join(rootDir, url);
    if (url.endsWith('/')) file = path.join(file, 'index.html');
    if (!file.startsWith(rootDir)) return res.writeHead(403).end();
    fs.readFile(file, (err, data) => {
      if (err) return res.writeHead(404).end('not found');
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
      res.end(data);
    });
  })
  .listen(Number(port), '127.0.0.1', () => {
    console.log(`serving ${rootDir} at http://127.0.0.1:${port}${basePath}/`);
  });
