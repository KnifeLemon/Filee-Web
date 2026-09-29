// Local studio server for the promo renderer: serves this folder and saves what the page renders
// (videos, stills) into ./out. Development only — binds to 127.0.0.1.
//
//   node marketing/server.mjs        then open http://127.0.0.1:4173/studio.html

import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
/** The Filee app repository (fonts, icons): a sibling folder ../Filee unless FILEE_REPO says otherwise. */
const repo = resolve(process.env.FILEE_REPO ?? join(root, '..', '..', 'Filee'));
const out = join(root, 'out');
const port = Number(process.env.PORT ?? 4173);

const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.gif': 'image/gif',
};

/** Maps a URL path to a file: /repo/... reads from the repository (app icons, fonts), everything else from here. */
function fileFor(pathname) {
  const decoded = decodeURIComponent(pathname);
  const base = decoded.startsWith('/repo/') ? repo : root;
  const relative = decoded.startsWith('/repo/') ? decoded.slice(6) : decoded.slice(1);
  const full = normalize(join(base, relative || 'studio.html'));
  return full.startsWith(base) ? full : null;
}

createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === 'POST' && url.pathname === '/save') {
    const name = url.searchParams.get('name') ?? '';
    const target = normalize(join(out, name));
    if (!name || !target.startsWith(out)) {
      response.writeHead(400).end('bad name');
      return;
    }
    const chunks = [];
    request.on('data', chunk => chunks.push(chunk));
    request.on('end', () => {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, Buffer.concat(chunks));
      console.log(`saved ${name} (${Math.round(Buffer.concat(chunks).length / 1024)} KB)`);
      response.writeHead(200).end('ok');
    });
    return;
  }

  const file = fileFor(url.pathname);
  if (!file || !existsSync(file) || statSync(file).isDirectory()) {
    response.writeHead(404).end('not found');
    return;
  }
  response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => console.log(`studio on http://127.0.0.1:${port}/`));
