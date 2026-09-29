// Local preview of dist/ that behaves like Cloudflare's static assets (folder index pages, trailing-slash
// redirects, 404.html) and rebuilds when src/, i18n/ or public/ change. Usage: node serve.mjs [port]

import { createReadStream, watch } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { build } from './build.mjs';

const ROOT = import.meta.dirname;
const DIST = join(ROOT, 'dist');
const PORT = Number(process.argv[2] ?? process.env.PORT ?? 4174);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
};

await build();
let timer;
for (const folder of ['src', 'i18n', 'public']) {
  watch(join(ROOT, folder), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => build().catch(error => console.error(error)), 120);
  });
}

const isFile = async path => (await stat(path).catch(() => null))?.isFile() ?? false;

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = normalize(join(DIST, decodeURIComponent(url.pathname)));
  if (!path.startsWith(DIST)) { res.writeHead(403).end(); return; }

  let file = path;
  if (url.pathname.endsWith('/')) file = join(path, 'index.html');
  else if (!(await isFile(path)) && await isFile(join(path, 'index.html'))) {
    res.writeHead(307, { Location: `${url.pathname}/` }).end();
    return;
  }
  let status = 200;
  if (!(await isFile(file))) { file = join(DIST, '404.html'); status = 404; }

  const info = await stat(file);
  const type = TYPES[extname(file)] ?? 'application/octet-stream';
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '');
  if (range && status === 200) {
    // Video seeking needs range requests.
    const start = range[1] ? Number(range[1]) : 0, end = range[2] ? Number(range[2]) : info.size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${info.size}`, 'Content-Length': end - start + 1, 'Accept-Ranges': 'bytes' });
    createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(status, { 'Content-Type': type, 'Content-Length': info.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
  createReadStream(file).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log(`Preview: http://localhost:${PORT}/`));
