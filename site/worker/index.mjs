// The site's Worker. It runs only for /presets/download/<id> (wrangler.jsonc → assets.run_worker_first); every other
// request goes straight to the static assets, as before.
//
// /presets/download/<id>: serves the preset's mirrored preset.json (dist/presets/files/presets/<id>/preset.json, written
// by the build) as a download and adds one to that preset's counter for the day (UTC) in D1:
//   downloads(slug TEXT, day TEXT 'YYYY-MM-DD', n INTEGER), one row per preset per day.
// Nothing about the visitor is stored or logged: no IP, no user agent, no cookie. The build reads the counters back
// through the Cloudflare API (src/presets.mjs → loadDownloads) to fill the gallery's stats.
//
// Abuse: each Worker instance counts at most LIMIT downloads per preset per minute; further requests in that minute
// still get the file but aren't counted. It is a naive cap (instances don't share it, and it isn't per visitor, which
// would need the IP) that keeps a single script hammering the link from inflating a preset's count by much. Unknown ids
// get the 404 page and are never counted, so the table only ever holds published presets. If counting fails (no D1
// binding, D1 down), the download still works.

export const LIMIT = 30;
const ID = /^\/presets\/download\/([a-z0-9][a-z0-9-]{1,46}[a-z0-9])\/?$/;
const SCHEMA = 'CREATE TABLE IF NOT EXISTS downloads (slug TEXT NOT NULL, day TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (slug, day)) WITHOUT ROWID';
const COUNT = 'INSERT INTO downloads (slug, day, n) VALUES (?1, ?2, 1) ON CONFLICT (slug, day) DO UPDATE SET n = n + 1';

/** Downloads counted in this instance: id → { minute, n }. */
const recent = new Map();
let ready = null;

/** Whether this download may be counted (at most LIMIT per preset per minute in this instance). */
export function allow(id, now = Date.now(), seen = recent) {
  const minute = Math.floor(now / 60_000);
  if (seen.size > 2_000) for (const [key, value] of seen) if (value.minute !== minute) seen.delete(key);
  const entry = seen.get(id);
  if (!entry || entry.minute !== minute) { seen.set(id, { minute, n: 1 }); return true; }
  if (entry.n >= LIMIT) return false;
  entry.n++;
  return true;
}

async function count(db, id, now) {
  // The table is made on the first download, so a new database needs no setup step.
  ready ??= db.prepare(SCHEMA).run().catch(error => { ready = null; throw error; });
  await ready;
  await db.prepare(COUNT).bind(id, new Date(now).toISOString().slice(0, 10)).run();
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const match = ID.exec(url.pathname);
    if (!match) return env.ASSETS.fetch(request);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const id = match[1];
    const file = await env.ASSETS.fetch(new Request(new URL(`/presets/files/presets/${id}/preset.json`, url), { method: request.method }));
    if (!file.ok) return file; // the site's 404 page
    if (request.method === 'GET' && env.DB) {
      const now = Date.now();
      if (allow(id, now)) ctx.waitUntil(count(env.DB, id, now).catch(error => console.error(`download count failed: ${error.message}`)));
    }
    return new Response(file.body, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${id}.json"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  },
};
