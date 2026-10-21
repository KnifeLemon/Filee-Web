// Builds the static site into dist/: per language the home page, the format catalog, the command line guide and one
// conversion guide per catalog pair; hashed CSS/JS, sitemap (hreflang for every page, the promo video on home pages), robots.txt,
// llms.txt, llms-full.txt, pad.xml (for download sites), 404 page, web manifest and Cloudflare _headers/_redirects.
// Usage: node build.mjs          (no dependencies; Node 20+)

import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAIRS, pairSlug, validateCatalog } from './src/catalog.mjs';
import { renderCliPage } from './src/cli-page.mjs';
import { renderConvertPage } from './src/convert-page.mjs';
import { renderFormatsPage } from './src/formats-page.mjs';
import { DOWNLOAD, INLINE_SCRIPTS, REPO, SITE, paths } from './src/layout.mjs';
import { llmsFullTxt, llmsTxt } from './src/llms.mjs';
import { latestRelease, padXml } from './src/pad.mjs';
import { loadSupporters, logoFiles } from './src/sponsors.mjs';
import { renderNotFound, renderPage } from './src/page.mjs';
import { LANGUAGES } from './src/languages.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');

const hash = text => createHash('sha256').update(text).digest('hex').slice(0, 10);

/**
 * Third-party scripts kept in vendor/, served from the site's own origin (the Content-Security-Policy allows no
 * script hosts but Google's analytics): GSAP and ScrollTrigger from the npm package gsap, dist/*.min.js, for the
 * home page's showcase only (main.js loads them when that section comes near). To update, replace both files with
 * the same version's.
 */
const VENDOR = [['gsap', 'vendor/gsap/gsap.min.js'], ['ScrollTrigger', 'vendor/gsap/ScrollTrigger.min.js']];
const minifyCss = css => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n\s*/g, '\n').replace(/\n{2,}/g, '\n').trim();

/**
 * Every language of src/languages.mjs with its texts from i18n/<lang>.json, in that order (English first: the
 * x-default at the root, the others in sub-folders). An i18n file without an entry there is an error.
 */
async function loadLanguages() {
  const files = (await readdir(join(ROOT, 'i18n'))).filter(f => f.endsWith('.json'));
  const unknown = files.filter(f => !LANGUAGES.some(l => `${l.lang}.json` === f));
  if (unknown.length) throw new Error(`i18n/${unknown.join(', i18n/')}: not in src/languages.mjs`);
  return Promise.all(LANGUAGES.map(async language => {
    if (!files.includes(`${language.lang}.json`)) throw new Error(`i18n/${language.lang}.json is missing`);
    const texts = JSON.parse(await readFile(join(ROOT, 'i18n', `${language.lang}.json`), 'utf8'));
    return { ...texts, ...language };
  }));
}

/** Every language must have the same keys (and the same number of steps, rows…) as English. */
function checkLanguageKeys(languages) {
  const shape = (value, prefix = '') => {
    if (Array.isArray(value)) return [`${prefix}[${value.length}]`, ...value.flatMap((v, i) => shape(v, `${prefix}[${i}]`))];
    if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => shape(v, prefix ? `${prefix}.${k}` : k));
    return [prefix];
  };
  // Only the i18n texts: the language data from languages.mjs (match, aliases…) differs by design.
  const texts = l => Object.fromEntries(Object.entries(l).filter(([key]) => !LANGUAGES.some(language => Object.hasOwn(language, key))));
  const reference = new Set(shape(texts(languages[0])));
  for (const l of languages.slice(1)) {
    const keys = new Set(shape(texts(l)));
    const missing = [...reference].filter(k => !keys.has(k));
    const extra = [...keys].filter(k => !reference.has(k));
    if (missing.length || extra.length) throw new Error(`i18n/${l.lang}.json differs from ${languages[0].lang}.json: missing ${missing.join(', ') || '-'}; extra ${extra.join(', ') || '-'}`);
  }
}

/** Every logical page: its path in each language and how to render it. */
function pageList() {
  return [
    { pathOf: paths.home, render: renderPage, video: true, priority: '1.0' },
    { pathOf: paths.formats, render: renderFormatsPage, priority: '0.9' },
    { pathOf: paths.cli, render: renderCliPage, priority: '0.8' },
    ...PAIRS.map(pair => ({
      pathOf: l => paths.convert(l, pairSlug(pair)),
      render: (t, languages, assets) => renderConvertPage(t, languages, assets, pair),
      priority: '0.7',
    })),
  ];
}

function sitemap(pages, languages, today) {
  const xml = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;');
  const urls = pages.flatMap(page => {
    const alternates = languages.map(l => `    <xhtml:link rel="alternate" hreflang="${l.htmlLang}" href="${SITE}${page.pathOf(l)}"/>`).join('\n')
      + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${page.pathOf(languages[0])}"/>`;
    return languages.map(l => `  <url>
    <loc>${SITE}${page.pathOf(l)}</loc>
    <lastmod>${today}</lastmod>
    <priority>${page.priority}</priority>
${alternates}${page.video ? `
    <video:video>
      <video:thumbnail_loc>${SITE}/media/poster-${l.media}.jpg</video:thumbnail_loc>
      <video:title>${xml(l.video.title)}</video:title>
      <video:description>${xml(l.video.caption)}</video:description>
      <video:content_loc>${SITE}/media/promo-${l.media}.mp4</video:content_loc>
      <video:duration>27</video:duration>
    </video:video>` : ''}
  </url>`);
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.join('\n')}
</urlset>
`;
}

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;

const manifest = JSON.stringify({
  name: 'Filee',
  short_name: 'Filee',
  description: 'Free drag & drop file converter for Windows and Linux',
  start_url: '/',
  display: 'browser',
  theme_color: '#7F77DD',
  background_color: '#F7F6F2',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
}, null, 2);

/** Security and caching headers (Cloudflare Workers static assets read _headers from the assets directory). */
function headers() {
  const hashes = INLINE_SCRIPTS.map(s => `'sha256-${createHash('sha256').update(s).digest('base64')}'`).join(' ');
  // Google Analytics 4 hosts, per Google's CSP guide for gtag.js (it also reports to www.google.com/g/collect).
  const ga = 'https://*.googletagmanager.com https://*.google-analytics.com https://*.g.doubleclick.net https://*.google.com';
  const csp = [
    "default-src 'self'",
    `script-src 'self' ${hashes} https://www.googletagmanager.com https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
    `img-src 'self' data: ${ga}`,
    "media-src 'self'",
    `connect-src 'self' https://api.github.com https://cloudflareinsights.com ${ga} https://*.analytics.google.com`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ');
  return `/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: DENY

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/media/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
`;
}

/**
 * Short links (handy for social posts) and forgiving URLs. /download goes to the latest release page: since 1.1.0
 * the installer's name carries the version, so there is no fixed asset URL to point at.
 */
function redirects(languages) {
  const convertIndexes = languages.flatMap(l => {
    const base = paths.convert(l, '').replace(/\/+$/, '');
    return [`${base} ${paths.formats(l)} 301`, `${base}/ ${paths.formats(l)} 301`];
  });
  // Short or differently spelled language prefixes (languages.mjs → aliases): /kr → /ko/, /zh-CN/… → /zh-cn/…
  const aliases = languages.flatMap(l => l.aliases.map(alias => (alias.endsWith('/*')
    ? `${alias} ${l.path}:splat 301` : `${alias} ${l.path} 301`)));
  return `/download ${DOWNLOAD} 302
/github ${REPO} 302
/releases ${REPO}/releases 302
${convertIndexes.join('\n')}
${aliases.join('\n')}
`;
}

export async function build() {
  const started = Date.now();
  validateCatalog();
  const languages = await loadLanguages();
  checkLanguageKeys(languages);
  const css = minifyCss(await readFile(join(ROOT, 'src', 'styles.css'), 'utf8'));
  const downloads = await readFile(join(ROOT, 'src', 'downloads.mjs'), 'utf8');
  const downloadsName = `downloads.${hash(downloads)}.js`;
  const js = (await readFile(join(ROOT, 'src', 'main.js'), 'utf8')).replace("'./downloads.mjs'", `'./${downloadsName}'`);
  // Pages get the hashed asset names, and the supporters for the home page's sponsor section.
  const supporters = await loadSupporters();
  const vendor = await Promise.all(VENDOR.map(async ([name, path]) => {
    const text = await readFile(join(ROOT, path), 'utf8');
    return { file: `${name}.${hash(text)}.js`, text };
  }));
  const assets = { css: `styles.${hash(css)}.css`, js: `main.${hash(js)}.js`, gsap: vendor.map(v => v.file), supporters };
  const today = new Date().toISOString().slice(0, 10);
  const pages = pageList();

  await rm(DIST, { recursive: true, force: true });
  await cp(join(ROOT, 'public'), DIST, { recursive: true });
  await mkdir(join(DIST, 'assets'), { recursive: true });
  await writeFile(join(DIST, 'assets', assets.css), css);
  await writeFile(join(DIST, 'assets', assets.js), js);
  await writeFile(join(DIST, 'assets', downloadsName), downloads);
  await Promise.all(vendor.map(v => writeFile(join(DIST, 'assets', v.file), v.text)));
  if (logoFiles(supporters).length) await mkdir(join(DIST, 'media', 'sponsors'), { recursive: true });
  await Promise.all(logoFiles(supporters).map(l => writeFile(join(DIST, 'media', 'sponsors', l.file), l.bytes)));

  // Written in parallel: on Windows each file write is slow on its own (antivirus scanning), not the rendering.
  const jobs = pages.flatMap(page => languages.map(async t => {
    const folder = join(DIST, ...page.pathOf(t).split('/').filter(Boolean));
    await mkdir(folder, { recursive: true });
    await writeFile(join(folder, 'index.html'), page.render(t, languages, assets));
  }));
  await Promise.all(jobs);
  const count = jobs.length;
  await writeFile(join(DIST, '404.html'), renderNotFound(languages, assets));
  await writeFile(join(DIST, 'sitemap.xml'), sitemap(pages, languages, today));
  await writeFile(join(DIST, 'robots.txt'), robots);
  await writeFile(join(DIST, 'llms.txt'), llmsTxt(languages));
  await writeFile(join(DIST, 'llms-full.txt'), llmsFullTxt(languages));
  await writeFile(join(DIST, 'site.webmanifest'), manifest);
  await writeFile(join(DIST, 'pad.xml'), padXml(await latestRelease()));
  await writeFile(join(DIST, '_headers'), headers());
  await writeFile(join(DIST, '_redirects'), redirects(languages));
  console.log(`Built ${count} pages (${pages.length} × ${languages.length} languages) into dist/ in ${Date.now() - started} ms`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await build();
