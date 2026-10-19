// Checks the built site in dist/: one <h1>, title and description (present, unique, length), canonical, hreflang
// (complete and reciprocal), JSON-LD (valid JSON, expected types), internal links and #fragments, sitemap coverage
// and the links in llms.txt / llms-full.txt. Exits with 1 on errors; length warnings don't fail.
// Usage: node build.mjs && node check.mjs

import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGUAGES } from './src/languages.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const SITE = 'https://filee.sh';
/** <html lang> of every language (languages.mjs). */
const LANGS = LANGUAGES.map(l => l.htmlLang);
/** Soft limits for search snippets (characters), per language: CJK characters are wider, so their limits are lower. */
const LIMITS = Object.fromEntries(LANGUAGES.map(l => [l.htmlLang, l.snippet]));

const errors = [];
const warnings = [];
const error = (page, message) => errors.push(`${page}: ${message}`);
const warn = (page, message) => warnings.push(`${page}: ${message}`);
const decode = s => s.replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}

const urlPathOf = file => `/${relative(DIST, file).split(sep).join('/')}`.replace(/index\.html$/, '');

/** Redirect sources from _redirects (exact paths and /prefix/* splats). */
async function redirectSources() {
  const text = await readFile(join(DIST, '_redirects'), 'utf8');
  return text.split('\n').map(line => line.trim().split(/\s+/)[0]).filter(Boolean);
}

function matchesRedirect(sources, path) {
  return sources.some(src => (src.endsWith('/*') ? path.startsWith(src.slice(0, -1)) : src === path));
}

async function main() {
  if (!existsSync(DIST)) throw new Error('dist/ is missing: run node build.mjs first');
  const files = await walk(DIST);
  const htmlFiles = files.filter(f => f.endsWith('.html') && !f.endsWith(`${sep}404.html`));
  const sources = await redirectSources();
  const pages = new Map();

  for (const file of htmlFiles) {
    const path = urlPathOf(file);
    const html = await readFile(file, 'utf8');
    const page = { path, html, size: Buffer.byteLength(html) };
    page.lang = /<html lang="([^"]+)"/.exec(html)?.[1];
    page.title = decode(/<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '');
    page.description = decode(/<meta name="description" content="([^"]*)">/.exec(html)?.[1] ?? '');
    page.canonical = /<link rel="canonical" href="([^"]+)">/.exec(html)?.[1];
    page.hreflang = Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map(m => [m[1], m[2]]));
    page.ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
    page.h1 = (html.match(/<h1[\s>]/g) ?? []).length;
    page.jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
    pages.set(path, page);
  }

  const titles = new Map(), descriptions = new Map();
  for (const page of pages.values()) {
    const { path } = page;
    if (!LANGS.includes(page.lang)) error(path, `unexpected <html lang="${page.lang}">`);
    if (page.h1 !== 1) error(path, `${page.h1} <h1> elements`);
    if (!page.title) error(path, 'missing <title>');
    if (!page.description) error(path, 'missing meta description');
    const limit = LIMITS[page.lang] ?? LIMITS.en;
    if ([...page.title].length > limit.title) warn(path, `title has ${[...page.title].length} characters (> ${limit.title}): ${page.title}`);
    if ([...page.description].length > limit.description) warn(path, `description has ${[...page.description].length} characters (> ${limit.description})`);
    if (/\bCtrl\b/.test(page.description)) error(path, 'meta description mentions Ctrl');
    titles.set(page.title, [...(titles.get(page.title) ?? []), path]);
    descriptions.set(page.description, [...(descriptions.get(page.description) ?? []), path]);

    // Canonical and hreflang.
    if (page.canonical !== SITE + path) error(path, `canonical ${page.canonical} ≠ ${SITE + path}`);
    for (const lang of [...LANGS, 'x-default']) if (!page.hreflang[lang]) error(path, `missing hreflang ${lang}`);
    if (page.hreflang[page.lang] !== page.canonical) error(path, `hreflang ${page.lang} doesn't point at the page itself`);
    if (page.hreflang['x-default'] !== page.hreflang.en) error(path, 'x-default should be the English page');
    for (const [lang, href] of Object.entries(page.hreflang)) {
      const other = pages.get(href.replace(SITE, ''));
      if (!other) { error(path, `hreflang ${lang} → ${href} does not exist`); continue; }
      if (lang !== 'x-default' && other.lang !== lang) error(path, `hreflang ${lang} → ${href} has lang ${other.lang}`);
      const back = Object.entries(other.hreflang).find(([, h]) => h === page.canonical)?.[0];
      if (back !== page.lang && !(page.lang === 'en' && back === 'x-default')) error(path, `${href} doesn't link back with hreflang ${page.lang}`);
    }

    // JSON-LD.
    if (!page.jsonLd.length) error(path, 'no JSON-LD');
    const types = [];
    for (const block of page.jsonLd) {
      let data;
      try { data = JSON.parse(block); } catch (e) { error(path, `invalid JSON-LD: ${e.message}`); continue; }
      for (const item of [data].flat()) {
        if (item['@context'] !== 'https://schema.org') error(path, `JSON-LD without schema.org @context (${item['@type']})`);
        types.push(item['@type']);
        if (item['@type'] === 'BreadcrumbList') {
          for (const el of item.itemListElement) if (!pages.has(el.item.replace(SITE, ''))) error(path, `breadcrumb ${el.item} does not exist`);
          if (item.itemListElement.at(-1).item !== page.canonical) error(path, 'last breadcrumb is not the page itself');
        }
        if (item['@type'] === 'HowTo' && item.step?.length !== 3) error(path, 'HowTo should have 3 steps');
        if (item['@type'] === 'FAQPage' && !(item.mainEntity?.length >= 5)) error(path, 'FAQPage has too few questions');
      }
    }
    const expected = path.includes('/convert/') ? ['HowTo', 'BreadcrumbList'] : path.endsWith('/formats/') ? ['CollectionPage', 'BreadcrumbList']
      : path.endsWith('/cli/') ? ['TechArticle', 'BreadcrumbList'] : ['SoftwareApplication', 'FAQPage'];
    for (const type of expected) if (!types.includes(type)) error(path, `JSON-LD type ${type} missing`);

    // Internal links and fragments.
    for (const [, attr, raw] of page.html.matchAll(/\s(href|src)="([^"]+)"/g)) {
      if (attr === 'href' && raw.startsWith('#')) {
        if (raw.length > 1 && !page.ids.has(raw.slice(1))) error(path, `link to missing #${raw.slice(1)}`);
        continue;
      }
      let target = raw.startsWith(SITE) ? raw.slice(SITE.length) || '/' : raw;
      if (!target.startsWith('/') || target.startsWith('//')) continue;
      const [pathPart, fragment] = target.split('#');
      const clean = pathPart.split('?')[0];
      if (pages.has(clean)) {
        if (fragment && !pages.get(clean).ids.has(fragment)) error(path, `link to missing ${clean}#${fragment}`);
        continue;
      }
      const file = join(DIST, ...clean.split('/').filter(Boolean));
      const isFile = existsSync(file) && (await stat(file)).isFile();
      if (isFile || matchesRedirect(sources, clean)) continue;
      error(path, `broken link ${raw}`);
    }
  }
  for (const [title, where] of titles) if (where.length > 1) error(where.join(', '), `duplicate title "${title}"`);
  for (const [description, where] of descriptions) if (where.length > 1) error(where.join(', '), `duplicate description "${description.slice(0, 60)}…"`);

  // Sitemap: every page once, alternates exist.
  const sitemap = await readFile(join(DIST, 'sitemap.xml'), 'utf8');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(SITE, ''));
  const locSet = new Set(locs);
  if (locSet.size !== locs.length) error('sitemap.xml', 'duplicate <loc>');
  for (const path of pages.keys()) if (!locSet.has(path)) error('sitemap.xml', `missing ${path}`);
  for (const loc of locSet) if (!pages.has(loc)) error('sitemap.xml', `lists ${loc}, which does not exist`);
  for (const [, href] of sitemap.matchAll(/<xhtml:link rel="alternate" hreflang="[^"]+" href="([^"]+)"\/>/g)) {
    if (!pages.has(href.replace(SITE, ''))) error('sitemap.xml', `alternate ${href} does not exist`);
  }

  // llms.txt and llms-full.txt: every filee.sh link resolves.
  for (const name of ['llms.txt', 'llms-full.txt']) {
    const text = await readFile(join(DIST, name), 'utf8');
    for (const [url] of text.matchAll(/https:\/\/filee\.sh[^\s)\],]*/g)) {
      const [path, fragment] = url.slice(SITE.length).split('#');
      const clean = path || '/';
      if (pages.has(clean)) {
        if (fragment && !pages.get(clean).ids.has(fragment)) error(name, `link to missing ${clean}#${fragment}`);
      } else if (!existsSync(join(DIST, ...clean.split('/').filter(Boolean)))) error(name, `broken link ${url}`);
    }
  }

  // Report.
  const byType = { home: 0, formats: 0, cli: 0, convert: 0 };
  for (const p of pages.keys()) byType[p.includes('/convert/') ? 'convert' : p.endsWith('/formats/') ? 'formats' : p.endsWith('/cli/') ? 'cli' : 'home']++;
  const sizes = [...pages.values()].sort((a, b) => b.size - a.size);
  console.log(`Checked ${pages.size} pages (home ${byType.home}, format catalog ${byType.formats}, command line guide ${byType.cli}, conversion guides ${byType.convert}), ${locs.length} sitemap URLs.`);
  console.log(`Largest pages: ${sizes.slice(0, 3).map(p => `${p.path} ${(p.size / 1024).toFixed(1)} KB`).join(', ')}; smallest ${sizes.at(-1).path} ${(sizes.at(-1).size / 1024).toFixed(1)} KB`);
  for (const lang of LANGS) {
    const ofLang = [...pages.values()].filter(p => p.lang === lang);
    const max = key => Math.max(...ofLang.map(p => [...p[key]].length));
    console.log(`${lang}: longest title ${max('title')} chars, longest description ${max('description')} chars`);
  }
  if (warnings.length) console.log(`\n${warnings.length} warning(s):\n- ${warnings.join('\n- ')}`);
  if (errors.length) {
    console.error(`\n${errors.length} error(s):\n- ${errors.slice(0, 200).join('\n- ')}`);
    process.exit(1);
  }
  console.log('\nNo errors.');
}

await main();
