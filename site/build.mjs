// Builds the static site into dist/: one HTML page per i18n/*.json, hashed CSS/JS, sitemap (with hreflang and the
// promo video), robots.txt, llms.txt, 404 page, web manifest and Cloudflare _headers/_redirects.
// Usage: node build.mjs          (no dependencies; Node 20+)

import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOWNLOAD, INLINE_SCRIPT, REPO, SITE, renderNotFound, renderPage } from './src/page.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
/** Page order: English is the x-default at the root, the others live in sub-folders. */
const ORDER = ['en', 'ko', 'zh-CN'];

const hash = text => createHash('sha256').update(text).digest('hex').slice(0, 10);
const minifyCss = css => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n\s*/g, '\n').replace(/\n{2,}/g, '\n').trim();

async function loadLanguages() {
  const files = await readdir(join(ROOT, 'i18n'));
  const languages = await Promise.all(files.filter(f => f.endsWith('.json'))
    .map(async f => JSON.parse(await readFile(join(ROOT, 'i18n', f), 'utf8'))));
  return languages.sort((a, b) => ORDER.indexOf(a.lang) - ORDER.indexOf(b.lang));
}

function sitemap(languages, today) {
  const alternates = languages.map(l => `    <xhtml:link rel="alternate" hreflang="${l.htmlLang}" href="${SITE}${l.path}"/>`).join('\n')
    + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/"/>`;
  const xml = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
  const urls = languages.map(l => `  <url>
    <loc>${SITE}${l.path}</loc>
    <lastmod>${today}</lastmod>
${alternates}
    <video:video>
      <video:thumbnail_loc>${SITE}/media/poster-${l.lang}.jpg</video:thumbnail_loc>
      <video:title>${xml(l.video.title)}</video:title>
      <video:description>${xml(l.video.caption)}</video:description>
      <video:content_loc>${SITE}/media/promo-${l.lang}.mp4</video:content_loc>
      <video:duration>27</video:duration>
    </video:video>
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls}
</urlset>
`;
}

/** llms.txt (llmstxt.org): a plain summary for AI assistants and answer engines (GEO). */
function llmsTxt(languages) {
  const en = languages.find(l => l.lang === 'en');
  return `# Filee

> Filee is a free, open-source (MIT) drag & drop file converter for Windows 10 and 11. Hold Ctrl, drag files and drop them on a format in a radial "donut" menu that opens at the cursor; the converted files are saved next to the originals. Everything runs locally and works offline.

- Price: free. License: MIT. Platform: Windows 10/11, x64 (macOS planned).
- 26 formats: images, PDF, Word/ODT/RTF, Excel/ODS/CSV, PowerPoint/ODP, HWP/HWPX, TXT, Markdown and HTML.
- Converts Korean HWP and HWPX documents without Hancom Office: a built-in HWPX writer (DOCX → HWPX) and rhwp for HWP ↔ HWPX, PDF and PNG.
- Optional engines are downloaded only when wanted: LibreOffice for office documents, Pandoc for Markdown.
- The app is available in English, Korean and Simplified Chinese.

## Features

${en.features.items.map(f => `- ${f.title}: ${f.text}`).join('\n')}

## Formats

${en.formats.groups.map(g => `- ${g.name}: ${g.list} → ${g.to}`).join('\n')}

## Download

- [Windows installer, latest version](${DOWNLOAD})
- [All releases and release notes](${REPO}/releases)

## Website

${languages.map(l => `- [${l.name}](${SITE}${l.path})`).join('\n')}

## Source code and documentation

- [GitHub repository](${REPO})
- [Conversion engines](${REPO}/blob/main/docs/ENGINES.md)
- [Architecture](${REPO}/blob/main/docs/ARCHITECTURE.md)
- [Adding a converter](${REPO}/blob/main/docs/ADDING-A-CONVERTER.md)
`;
}

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;

const manifest = JSON.stringify({
  name: 'Filee',
  short_name: 'Filee',
  description: 'Drag & drop file converter for Windows',
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
  const scriptHash = createHash('sha256').update(INLINE_SCRIPT).digest('base64');
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'sha256-${scriptHash}' https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
    "img-src 'self' data:",
    "media-src 'self'",
    "connect-src 'self' https://api.github.com https://cloudflareinsights.com",
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

/** Short links (handy for social posts) and forgiving language URLs. */
const redirects = `/download ${DOWNLOAD} 302
/github ${REPO} 302
/releases ${REPO}/releases 302
/kr /ko/ 301
/zh /zh-cn/ 301
/cn /zh-cn/ 301
/zh-CN /zh-cn/ 301
/zh-CN/ /zh-cn/ 301
`;

export async function build() {
  const started = Date.now();
  const languages = await loadLanguages();
  const css = minifyCss(await readFile(join(ROOT, 'src', 'styles.css'), 'utf8'));
  const js = await readFile(join(ROOT, 'src', 'main.js'), 'utf8');
  const assets = { css: `styles.${hash(css)}.css`, js: `main.${hash(js)}.js` };
  const today = new Date().toISOString().slice(0, 10);

  await rm(DIST, { recursive: true, force: true });
  await cp(join(ROOT, 'public'), DIST, { recursive: true });
  await mkdir(join(DIST, 'assets'), { recursive: true });
  await writeFile(join(DIST, 'assets', assets.css), css);
  await writeFile(join(DIST, 'assets', assets.js), js);

  for (const t of languages) {
    const folder = join(DIST, ...t.path.split('/').filter(Boolean));
    await mkdir(folder, { recursive: true });
    await writeFile(join(folder, 'index.html'), renderPage(t, languages, assets));
  }
  await writeFile(join(DIST, '404.html'), renderNotFound(languages, assets));
  await writeFile(join(DIST, 'sitemap.xml'), sitemap(languages, today));
  await writeFile(join(DIST, 'robots.txt'), robots);
  await writeFile(join(DIST, 'llms.txt'), llmsTxt(languages));
  await writeFile(join(DIST, 'site.webmanifest'), manifest);
  await writeFile(join(DIST, '_headers'), headers());
  await writeFile(join(DIST, '_redirects'), redirects);
  console.log(`Built ${languages.length} languages into dist/ in ${Date.now() - started} ms`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await build();
