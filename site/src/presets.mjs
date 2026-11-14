// The preset gallery's data: KnifeLemon/Filee-Presets' index.json and every listed preset's files, read from GitHub at
// build time, with the likes and comments of each preset's discussion (GitHub GraphQL API) and the download counts
// kept by the Worker (Cloudflare D1, read through the Cloudflare API). The build writes /presets/index.json with the
// stats filled in, and mirrors the files under /presets/files/ (the Content-Security-Policy allows images from this
// site only, and the app downloads from here).
//
// Every source is optional: an empty repository, no network, no GITHUB_TOKEN (GraphQL needs one) or no Cloudflare
// credentials give fewer presets or zero counts, never a failed build. A build with neither keeps the stats that are
// published on filee.sh now, so a deploy from a machine without tokens doesn't reset them.
//
// Environment:
//   PRESETS=<folder>          read a local Filee-Presets checkout instead of GitHub (index.json and presets/ in it)
//   GITHUB_TOKEN / GH_TOKEN   reads reactions and comment counts (any token; public data only)
//   CLOUDFLARE_API_TOKEN      with "D1 Read" on the account, and CLOUDFLARE_ACCOUNT_ID: reads the download counters
//   PRESETS_D1_ID             the D1 database's id (otherwise looked up by its name, D1_NAME)
//   PRESETS_PUBLISHED         where a build without either source takes the stats from (default: the live index.json)

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { presetStats, rank, utcDay } from './preset-stats.mjs';

export const PRESETS_REPO = 'https://github.com/KnifeLemon/Filee-Presets';
const OWNER = 'KnifeLemon', NAME = 'Filee-Presets';
const RAW = `https://raw.githubusercontent.com/${OWNER}/${NAME}/main/`;
/** The submission form (Filee-Presets' issue template). */
export const UPLOAD = `${PRESETS_REPO}/issues/new?template=submit-preset.yml`;
/** Where removal requests and reports go. */
export const ISSUES = `${PRESETS_REPO}/issues/new`;
/** The D1 database the Worker counts downloads in (wrangler.jsonc → d1_databases). */
export const D1_NAME = 'filee-presets';
/** Slugs that would clash with the gallery's own paths under /presets/. */
export const RESERVED = ['files', 'download', 'index'];
export const EMPTY = { generated: null, presets: [] };

const SLUG = /^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/;
const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const WORD = /^[a-z0-9][a-z0-9-]{0,31}$/;
const LANG = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const FORMAT = /^[a-z0-9]{1,12}$/;
const IMAGE = /\.(webp|png|jpe?g)$/i;
const DATE = value => (typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null);
const text = (value, max) => (typeof value === 'string' && value.trim() && value.length <= max ? value.trim() : null);
const words = (value, pattern, max) => (Array.isArray(value) ? [...new Set(value.filter(v => typeof v === 'string' && pattern.test(v)))].slice(0, max) : []);

/**
 * One index.json entry, checked and normalised, or a reason it is left out. Paths must stay in the preset's own
 * folder (presets/<id>/…), so a bad entry can never make the build read or write anywhere else.
 */
export function checkEntry(entry) {
  const id = entry?.id;
  if (typeof id !== 'string' || !SLUG.test(id)) return { error: `bad id ${JSON.stringify(id)}` };
  if (RESERVED.includes(id)) return { error: `${id}: reserved id` };
  const title = text(entry.title, 80), description = text(entry.description, 1000);
  if (!title || !description) return { error: `${id}: title or description missing or too long` };
  if (typeof entry.author !== 'string' || !LOGIN.test(entry.author)) return { error: `${id}: bad author` };
  const folder = `presets/${id}/`;
  const inFolder = (path, pattern) => typeof path === 'string' && path.startsWith(folder) && !path.includes('..')
    && !path.includes('\\') && /^[\w./-]+$/.test(path) && pattern.test(path);
  const images = Array.isArray(entry.images) ? entry.images.filter(p => inFolder(p, IMAGE)).slice(0, 4) : [];
  if (!images.length) return { error: `${id}: no image` };
  const thumb = inFolder(entry.thumb, IMAGE) ? entry.thumb : images[0];
  if (entry.preset !== `${folder}preset.json`) return { error: `${id}: preset must be ${folder}preset.json` };
  if (typeof entry.sha256 !== 'string' || !/^[0-9a-f]{64}$/i.test(entry.sha256)) return { error: `${id}: bad sha256` };
  const formats = { from: words(entry.formats?.from, FORMAT, 40), to: words(entry.formats?.to, FORMAT, 40) };
  return {
    entry: {
      id, title, description, author: entry.author,
      tags: words(entry.tags, WORD, 6),
      languages: words(entry.languages, LANG, 10),
      kinds: words(entry.kinds, WORD, 3),
      formats,
      minVersion: typeof entry.minVersion === 'string' && /^\d+\.\d+\.\d+$/.test(entry.minVersion) ? entry.minVersion : null,
      created: DATE(entry.created), updated: DATE(entry.updated) ?? DATE(entry.created),
      discussion: Number.isInteger(entry.discussion) && entry.discussion > 0 ? entry.discussion : null,
      license: 'CC0-1.0',
      images, thumb, preset: entry.preset, sha256: entry.sha256.toLowerCase(),
    },
  };
}

async function get(path, as) {
  if (process.env.PRESETS) {
    const bytes = await readFile(join(process.env.PRESETS, ...path.split('/')));
    return as === 'json' ? JSON.parse(bytes.toString('utf8')) : bytes;
  }
  const response = await fetch(RAW + path, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw Object.assign(new Error(`${path}: HTTP ${response.status}`), { status: response.status });
  return as === 'json' ? response.json() : Buffer.from(await response.arrayBuffer());
}

/** Filee-Presets' index.json with every listed file, or EMPTY (an empty repository has no index.json yet). */
async function loadRepo() {
  let index;
  try {
    index = await get('index.json', 'json');
  } catch (error) {
    console.warn(`presets: none in the gallery (${error.status === 404 ? 'no index.json yet' : error.message})`);
    return { index: EMPTY, files: new Map() };
  }
  const files = new Map();
  const presets = [];
  for (const raw of Array.isArray(index?.presets) ? index.presets : []) {
    const { entry, error } = checkEntry(raw);
    if (error) { console.warn(`presets: left out, ${error}`); continue; }
    if (presets.some(p => p.id === entry.id)) { console.warn(`presets: left out, duplicate ${entry.id}`); continue; }
    try {
      const preset = await get(entry.preset);
      const sha = createHash('sha256').update(preset).digest('hex');
      if (sha !== entry.sha256) throw new Error(`preset.json has sha256 ${sha}, index.json says ${entry.sha256}`);
      const bundle = JSON.parse(preset.toString('utf8'));
      const paths = [...new Set([...entry.images, entry.thumb])];
      const images = await Promise.all(paths.map(path => get(path)));
      files.set(entry.preset, preset);
      paths.forEach((path, i) => files.set(path, images[i]));
      presets.push({ ...entry, bundle });
    } catch (error) {
      console.warn(`presets: left out ${entry.id} (${error.message})`);
    }
  }
  return { index: { generated: DATE(index.generated), presets }, files };
}

/* ───────── Likes and comments (GitHub GraphQL) ───────── */

async function graphql(query, variables, token) {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'filee-site-build' },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.errors?.length && !body.data) throw new Error(`GitHub GraphQL: ${response.status} ${body.errors?.[0]?.message ?? ''}`.trim());
  return body.data;
}

const REACTIONS = 'reactions(content: THUMBS_UP, first: 100, after: $after) { totalCount pageInfo { hasNextPage endCursor } nodes { createdAt } }';

/** { [discussion number]: { likes: [createdAt…], likeTotal, comments } } for the given discussions. */
export async function loadDiscussions(numbers, token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN) {
  const out = {};
  if (!numbers.length) return out;
  if (!token) { console.warn('presets: no GITHUB_TOKEN, likes and comments count as 0'); return out; }
  try {
    for (let i = 0; i < numbers.length; i += 25) {
      const batch = numbers.slice(i, i + 25);
      const fields = batch.map(n => `d${n}: discussion(number: ${n}) { comments { totalCount } ${REACTIONS.replace(', after: $after', '')} }`).join('\n');
      const data = await graphql(`query { repository(owner: "${OWNER}", name: "${NAME}") { ${fields} } }`, {}, token);
      for (const n of batch) {
        const d = data?.repository?.[`d${n}`];
        if (!d) continue;
        const likes = d.reactions.nodes.map(r => r.createdAt);
        let page = d.reactions.pageInfo;
        // More than 100 likes: read the rest of this discussion's reactions page by page.
        while (page.hasNextPage && likes.length < 10_000) {
          const more = await graphql(`query($n: Int!, $after: String) { repository(owner: "${OWNER}", name: "${NAME}") { discussion(number: $n) { ${REACTIONS} } } }`,
            { n, after: page.endCursor }, token);
          const r = more.repository.discussion.reactions;
          likes.push(...r.nodes.map(x => x.createdAt));
          page = r.pageInfo;
        }
        out[n] = { likes, likeTotal: d.reactions.totalCount, comments: d.comments.totalCount };
      }
    }
  } catch (error) {
    console.warn(`presets: likes and comments not read (${error.message})`);
  }
  return out;
}

/* ───────── Downloads (Cloudflare D1, written by worker/index.mjs) ───────── */

async function cloudflare(path, token, init = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) throw new Error(`Cloudflare API ${path.split('?')[0]}: ${response.status} ${body.errors?.[0]?.message ?? ''}`.trim());
  return body.result;
}

/**
 * { [slug]: { days: { 'YYYY-MM-DD': n }, total } }: the last year per day (enough for Hot, which decays within
 * weeks) and the all-time totals.
 */
export async function loadDownloads(now = Date.now(), env = process.env) {
  const token = env.CLOUDFLARE_API_TOKEN, account = env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !account) { console.warn('presets: no Cloudflare credentials, downloads count as 0'); return {}; }
  try {
    let id = env.PRESETS_D1_ID;
    if (!id) {
      const list = await cloudflare(`/accounts/${account}/d1/database?name=${encodeURIComponent(D1_NAME)}`, token);
      id = list?.find(db => db.name === D1_NAME)?.uuid;
      if (!id) throw new Error(`no D1 database named ${D1_NAME}`);
    }
    const query = (sql, params = []) => cloudflare(`/accounts/${account}/d1/database/${id}/query`, token,
      { method: 'POST', body: JSON.stringify({ sql, params }) }).then(r => r?.[0]?.results ?? []);
    const since = utcDay(now - 365 * 86_400_000);
    const out = {};
    for (const row of await query('SELECT slug, SUM(n) AS total FROM downloads GROUP BY slug')) out[row.slug] = { days: {}, total: Number(row.total) || 0 };
    for (const row of await query('SELECT slug, day, n FROM downloads WHERE day >= ?1', [since])) {
      (out[row.slug] ??= { days: {}, total: 0 }).days[row.day] = Number(row.n) || 0;
    }
    return out;
  } catch (error) {
    // "no such table" until the Worker counts its first download.
    console.warn(`presets: downloads not read (${error.message})`);
    return {};
  }
}

/* ───────── The gallery ───────── */

/**
 * The stats on the site now (https://filee.sh/presets/index.json), for a build that can read neither source (a local
 * or manual build without tokens), so deploying it doesn't reset every count to zero. { [id]: stats }, {} if unreadable.
 */
async function publishedStats(url = process.env.PRESETS_PUBLISHED ?? 'https://filee.sh/presets/index.json') {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const index = await response.json();
    const valid = s => s && [s.likes, s.comments, s.downloads, s.hot].every(Number.isFinite) && s.best && typeof s.best === 'object';
    return Object.fromEntries((index.presets ?? []).filter(p => typeof p.id === 'string' && valid(p.stats)).map(p => [p.id, p.stats]));
  } catch (error) {
    console.warn(`presets: the published stats not read either (${error.message})`);
    return {};
  }
}

/**
 * The gallery: { generated, presets: [entry + bundle + stats], files: Map(path → bytes) }, presets in Hot order.
 * Never throws.
 */
export async function loadGallery(now = Date.now(), env = process.env) {
  const { index, files } = await loadRepo();
  const token = env.GITHUB_TOKEN || env.GH_TOKEN;
  const cloudflareSet = Boolean(env.CLOUDFLARE_API_TOKEN && env.CLOUDFLARE_ACCOUNT_ID);
  const published = index.presets.length && !token && !cloudflareSet ? await publishedStats() : {};
  const discussions = token ? await loadDiscussions(index.presets.map(p => p.discussion).filter(Boolean), token) : {};
  const downloads = index.presets.length && cloudflareSet ? await loadDownloads(now, env) : {};
  if (!token && !cloudflareSet && index.presets.length) console.warn('presets: no GITHUB_TOKEN or Cloudflare credentials, keeping the stats published now');
  const presets = index.presets.map(p => {
    const d = p.discussion ? discussions[p.discussion] : null;
    const dl = downloads[p.id];
    const stats = published[p.id] ?? presetStats({
      now, created: p.created,
      likes: d?.likes, likeTotal: d?.likeTotal, comments: d?.comments, downloads: dl?.days, downloadTotal: dl?.total,
    });
    return { ...p, stats };
  });
  return { generated: new Date(now).toISOString(), presets: rank(presets, 'hot'), files };
}

/** The path a repository file is served at on this site. */
export const filePath = path => `/presets/files/${path}`;
/** The counting download link of a preset (worker/index.mjs). */
export const downloadPath = id => `/presets/download/${id}`;

/**
 * /presets/index.json: Filee-Presets' index with the stats filled in. Paths are relative to this file's URL
 * (files/presets/<id>/…), as the repository's are relative to its own index.json, so a client resolving them against
 * the URL it read the index from gets the mirror here or the raw files on GitHub alike. download is the counting link.
 */
export function publicIndex(gallery, site) {
  return {
    version: 1,
    generated: gallery.generated,
    presets: gallery.presets.map(({ bundle, ...p }) => ({
      ...p,
      images: p.images.map(path => `files/${path}`),
      thumb: `files/${p.thumb}`,
      preset: `files/${p.preset}`,
      download: `${site}${downloadPath(p.id)}`,
    })),
  };
}
