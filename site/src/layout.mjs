// Shared page frame: <head> (meta, canonical, hreflang, Open Graph, JSON-LD), navigation, footer, icons and small
// building blocks used by every page type (home, format catalog, conversion pages, command line guide).

import { CATEGORIES, FORMATS, PAIRS, label, pairSlug } from './catalog.mjs';
import { DOWNLOAD_TARGETS } from './downloads.mjs';

export const SITE = 'https://filee.sh';
export const REPO = 'https://github.com/KnifeLemon/Filee';
/**
 * Download buttons point at the latest release page: from 1.1.0 the installer's file name carries the version
 * (Filee-1.1.0-win-Setup.exe), so there is no stable direct link. main.js swaps in the real asset URL from the
 * GitHub API when it can.
 */
export const DOWNLOAD = `${REPO}/releases/latest`;

/** Filee's AlternativeTo page (footer badge; the badge SVGs are kept in public/media/badges, the CSP allows no other hosts). */
/**
 * Where to sponsor Filee: Fairy for Korean pages (Korean cards and easy-pay), GitHub Sponsors elsewhere (cards from
 * anywhere).
 */
const SPONSOR = { ko: 'https://fairy.hada.io/@filee', default: 'https://github.com/sponsors/KnifeLemon' };
const sponsorUrl = t => SPONSOR[t.lang] ?? SPONSOR.default;
const ALTERNATIVETO = 'https://alternativeto.net/software/filee-1/about/?utm_source=badge&utm_medium=referral';

export const escape = value => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

/** JSON for <script> blocks: `<` escaped so text can never close the element. */
export const json = value => JSON.stringify(value).replaceAll('<', '\\u003c');

export const LOGO = `<svg class="logo" viewBox="0 0 512 512" aria-hidden="true"><path fill="#7F77DD" d="M154.61 65.27A216 216 0 0 1 357.39 65.27L304.82 164.17A104 104 0 0 0 207.18 164.17Z"/><path transform="translate(13.86,-8)" fill="#1D9E75" d="M373.66 67.74A222 222 0 0 1 477.86 248.23L359.94 252.36A104 104 0 0 0 311.12 167.81Z"/><path fill="#7F77DD" d="M471.87 263.56A216 216 0 0 1 370.48 439.17L311.12 344.19A104 104 0 0 0 359.94 259.64Z"/><path fill="#6A62C9" d="M357.39 446.73A216 216 0 0 1 154.61 446.73L207.18 347.83A104 104 0 0 0 304.82 347.83Z"/><path fill="#7F77DD" d="M141.52 439.17A216 216 0 0 1 40.13 263.56L152.06 259.64A104 104 0 0 0 200.88 344.19Z"/><path fill="#6A62C9" d="M40.13 248.44A216 216 0 0 1 141.52 72.83L200.88 167.81A104 104 0 0 0 152.06 252.36Z"/><path fill="#3C3489" d="M222 212h44l24 24v64h-68z"/><path fill="#AFA9EC" d="M266 212v24h24z"/></svg>`;

/** 24×24 icons: Material Design icons (Apache-2.0) and simple category glyphs drawn for this site (even-odd fill). */
const ICONS = {
  donut: 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16Z',
  sliders: 'M3,17V19H9V17H3M3,5V7H13V5H3M13,21V19H21V17H13V15H11V21H13M7,9V11H3V13H7V15H9V9H7M21,13V11H11V13H21M15,9H17V7H21V5H17V3H15V9Z',
  hwp: 'M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M8,12H16V14H8V12M8,16H13V18H8V16Z',
  stack: 'M12,16L19.36,10.27L21,9L12,2L3,9L4.63,10.27M12,18.54L4.62,12.81L3,14.07L12,21.07L21,14.07L19.37,12.8L12,18.54Z',
  lock: 'M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z',
  doors: 'M4,4H10V10H4V4M14,4H20V10H14V4M4,14H10V20H4V14M14,14H20V20H14V14Z',
  palette: 'M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A1.5,1.5 0 0,0 13.5,19.5C13.5,19.11 13.35,18.76 13.11,18.5C12.88,18.23 12.73,17.88 12.73,17.5A1.5,1.5 0 0,1 14.23,16H16A5,5 0 0,0 21,11C21,6.58 16.97,3 12,3Z',
  globe: 'M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z',
  code: 'M14.6,16.6L19.2,12L14.6,7.4L16,6L22,12L16,18L14.6,16.6M9.4,16.6L4.8,12L9.4,7.4L8,6L2,12L8,18L9.4,16.6Z',
  download: 'M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z',
  github: 'M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21.09C14.5,21.36 14.66,21.67 15.17,21.59C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z',
  windows: 'M3,12V6.75L9,5.43V11.91L3,12M20,3V11.75L10,11.9V5.21L20,3M3,13L9,13.09V19.9L3,18.75V13M20,13.25V22L10,20.09V13.1L20,13.25Z',
  check: 'M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z',
  star: 'M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z',
  arrow: 'M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z',
  chevron: 'M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z',
  // Category glyphs (even-odd): cut-outs are holes.
  image: { d: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM5 5v11l4-4.5 3 3.5 3.5-4.5L19 15.5V5zm4 1.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4z' },
  vector: { d: 'M3 15h6v6H3zM15 3h6v6h-6zM5 15c0-5.5 4.5-10 10-10v2c-4.4 0-8 3.6-8 8z' },
  pdf: { d: 'M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V9h5.5zM7 12.5h10V18H7z' },
  document: { d: 'M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V9h5.5zM7 12h10v1.8H7zm0 3.4h10v1.8H7zm0 3.4h6.5v1.8H7z' },
  table: { d: 'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm1 4v4.5h6V8zm8 0v4.5h6V8zM5 14.5V18h6v-3.5zm8 0V18h6v-3.5z' },
  slides: { d: 'M2 3h20v2h-1v11h-6.2l1.4 5h-2l-1.4-5h-1.6l-1.4 5h-2l1.4-5H3V5H2zm3 2v9h14V5zm2 5h2v2.5H7zm4-2h2v4.5h-2zm4 3h2v1.5h-2z' },
  text: { d: 'M4 5h16v2H4zm0 4h16v2H4zm0 4h16v2H4zm0 4h10v2H4z' },
  book: { d: 'M3 5.5C5.9 4.6 9.3 5 12 7c2.7-2 6.1-2.4 9-1.5V19c-2.9-.9-6.3-.5-9 1.5-2.7-2-6.1-2.4-9-1.5zm2 1.7v10c2.1-.3 4.2.1 6 1.1v-10c-1.8-1-3.9-1.4-6-1.1zm14 0c-2.1-.3-4.2.1-6 1.1v10c1.8-1 3.9-1.4 6-1.1z' },
  video: { d: 'M4 6h11a1 1 0 0 1 1 1v3.2l5-3.2v10l-5-3.2V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z' },
  audio: { d: 'M12 3h7v4h-5v10a4 4 0 1 1-2-3.46z' },
  archive: { d: 'M3 3h18v4H3zm1 5h16v13H4zm5 3v2h6v-2z' },
  cad: { d: 'M3 3v18h18zm3 7.2V18h7.8z' },
  font: { d: 'M10.2 4h3.6L20 20h-3l-1.4-4H8.4L7 20H4zm-1 9.4h5.6L12 6.2z' },
};

export const icon = (name, cls = 'icon') => {
  const glyph = ICONS[name];
  if (!glyph) throw new Error(`Unknown icon ${name}`);
  const path = typeof glyph === 'string' ? `<path d="${glyph}"/>` : `<path fill-rule="evenodd" d="${glyph.d}"/>`;
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
};

/* ───────── Scripts, analytics, fonts, verification ───────── */

/** Marks JS as available before first paint so reveal animations don't flash. */
const JS_FLAG_SCRIPT = "document.documentElement.classList.add('js')";

/**
 * On the English home page only (filee.sh/ typed or shared without a language): a visitor whose browser prefers
 * Korean or Simplified Chinese goes straight to /ko/ or /zh-cn/. Runs before anything renders. Not when the visitor
 * picked a language in the menu before (localStorage, see setupLanguageBanner), nor when coming from another page of
 * the site. Crawlers read English and stay, so every language keeps its own indexed URL (hreflang does the rest).
 */
const LANG_REDIRECT_SCRIPT = "(function(){try{if(location.pathname!=='/'||localStorage.getItem('filee-lang-chosen'))return;"
  + "var r=document.referrer;if(r&&new URL(r).origin===location.origin)return;"
  + "var l=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language];"
  + "for(var i=0;i<l.length;i++){var t=String(l[i]||'').toLowerCase();if(t.indexOf('en')===0)return;"
  + "if(t.indexOf('ko')===0){location.replace('/ko/'+location.search+location.hash);return}"
  + "if(t==='zh'||t.indexOf('zh-cn')===0||t.indexOf('zh-hans')===0||t.indexOf('zh-sg')===0){location.replace('/zh-cn/'+location.search+location.hash);return}}"
  + "}catch(e){}})()";

/** Google Analytics 4 measurement ID; empty turns analytics off. */
const GA_ID = 'G-0Q2YHDJHEL';
const GA_SCRIPT = GA_ID
  ? `window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', '${GA_ID}');`
  : '';
/** Google tag (gtag.js), as Google asks: early in <head>. */
export const ANALYTICS = GA_ID
  ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>\n<script>${GA_SCRIPT}</script>`
  : '';

/** Every inline script on the pages: build.mjs puts their hashes into the Content-Security-Policy. */
export const INLINE_SCRIPTS = [JS_FLAG_SCRIPT, LANG_REDIRECT_SCRIPT, GA_SCRIPT].filter(Boolean);

/** Search engine ownership checks: paste only the content="…" value from each console. Empty ones are skipped. */
const SITE_VERIFICATION = {
  'google-site-verification': '',   // Google Search Console → URL prefix → HTML tag
  'naver-site-verification': 'f0011d6370ae2cc7478f0ec9d1457451cbcdfc87', // Naver Search Advisor → HTML 태그
  'msvalidate.01': '',              // Bing Webmaster Tools → HTML Meta Tag
};
const verificationMeta = Object.entries(SITE_VERIFICATION)
  .filter(([, value]) => value)
  .map(([name, value]) => `<meta name="${name}" content="${escape(value)}">`)
  .join('\n');

const FONTS = {
  en: '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">',
  ko: '<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">',
  // Google Fonts is not reachable from mainland China: Chinese pages use the system fonts.
  'zh-CN': '',
};

/* ───────── URLs ───────── */

/** Paths of the page types in language t (t.path is '/', '/ko/' or '/zh-cn/'). */
export const paths = {
  home: t => t.path,
  formats: t => `${t.path}formats/`,
  cli: t => `${t.path}cli/`,
  convert: (t, slug) => `${t.path}convert/${slug}/`,
};

/** { lang: path } of one logical page in every language. */
export const alternatesOf = (languages, pathOf) => Object.fromEntries(languages.map(l => [l.lang, pathOf(l)]));

/* ───────── Page frame ───────── */

/**
 * A complete HTML document. alternates: { lang: path } of this page in every language (hreflang, language menu,
 * language suggestion). jsonLd: array of schema.org objects. main: the <main> content.
 */
export function renderDocument({ t, languages, assets, title, description, alternates, jsonLd = [], main, extraHead = '', nav = '', scripts = '' }) {
  const url = SITE + alternates[t.lang];
  const others = languages.filter(l => l.lang !== t.lang);
  const hreflang = languages.map(l => `<link rel="alternate" hreflang="${l.htmlLang}" href="${SITE}${alternates[l.lang]}">`).join('')
    + `<link rel="alternate" hreflang="x-default" href="${SITE}${alternates.en}">`;
  const pageData = {
    lang: t.lang,
    langs: languages.map(l => ({ lang: l.lang, path: alternates[l.lang], banner: l.langBanner, name: l.name })),
    afterDownload: t.download.after,
    download: t.download,
  };
  return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${alternates[t.lang] === '/' ? `<script>${LANG_REDIRECT_SCRIPT}</script>` : ''}
${ANALYTICS}
<script>${JS_FLAG_SCRIPT}</script>
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
${verificationMeta}
<link rel="canonical" href="${url}">
${hreflang}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Filee">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/media/og-${t.lang}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escape(t.meta.ogAlt)}">
<meta property="og:locale" content="${t.ogLocale}">
${others.map(l => `<meta property="og:locale:alternate" content="${l.ogLocale}">`).join('')}
${extraHead}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(title)}">
<meta name="twitter:description" content="${escape(description)}">
<meta name="twitter:image" content="${SITE}/media/og-${t.lang}.jpg">
<meta name="theme-color" content="#7F77DD" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#16151F" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
${FONTS[t.lang] ?? ''}
<link rel="stylesheet" href="/assets/${assets.css}">
${jsonLd.length ? `<script type="application/ld+json">${json(jsonLd.length === 1 ? jsonLd[0] : jsonLd)}</script>` : ''}
<script type="module" src="/assets/${assets.js}"></script>
</head>
<body class="lang-${t.lang}">
<a class="skip" href="#main">${escape(t.nav.skip)}</a>
<div class="backdrop" aria-hidden="true"><i></i><i></i><i></i></div>
${header(t, languages, alternates, nav)}
<main id="main">
${main}
</main>
${footer(t, languages, alternates)}
<script id="page-data" type="application/json">${json(pageData)}</script>
${scripts}
</body>
</html>
`;
}

function header(t, languages, alternates, current) {
  const home = paths.home(t);
  const link = (href, text, key) => `<a href="${href}"${current === key ? ' aria-current="page"' : ''}>${escape(text)}</a>`;
  return `<header class="nav" data-nav>
  <div class="nav-inner">
    <a class="brand" href="${home}" aria-label="Filee">${LOGO}<span>Filee</span></a>
    <nav class="nav-links" aria-label="${escape(t.nav.menu)}">
      ${link(`${home}#how`, t.nav.how, 'how')}
      ${link(`${home}#features`, t.nav.features, 'features')}
      ${link(paths.formats(t), t.nav.formats, 'formats')}
      ${link(paths.cli(t), t.nav.cli, 'cli')}
      ${link(`${home}#hwp`, t.nav.hwp, 'hwp')}
      ${link(`${home}#faq`, t.nav.faq, 'faq')}
    </nav>
    <div class="nav-actions">
      <details class="lang-menu">
        <summary aria-label="${escape(t.nav.language)}">${icon('globe')}<span>${escape(t.name)}</span></summary>
        <ul>${languages.map(l => `<li><a href="${alternates[l.lang]}" hreflang="${l.htmlLang}" lang="${l.htmlLang}"${l.lang === t.lang ? ' aria-current="page"' : ''}>${escape(l.name)}</a></li>`).join('')}</ul>
      </details>
      <a class="btn btn-ghost github" href="${REPO}" rel="noopener">${icon('github')}<span class="stars" data-stars>GitHub</span></a>
      <a class="btn btn-primary btn-small" href="#download">${icon('download')}<span>${escape(t.nav.download)}</span></a>
    </div>
  </div>
</header>`;
}

function footer(t, languages, alternates) {
  const popular = PAIRS.filter(p => p.popular).slice(0, 12);
  return `<footer class="footer">
  <div class="footer-inner">
    <div class="footer-brand">${LOGO}<div><strong>Filee</strong><p>${escape(t.footer.tagline)}</p></div></div>
    <nav class="footer-links" aria-label="Footer">
      <a href="${paths.formats(t)}">${escape(t.footer.formats)}</a>
      <a href="${paths.cli(t)}">${escape(t.footer.cli)}</a>
      <a href="${REPO}">GitHub</a>
      <a href="${REPO}/releases">${escape(t.download.all)}</a>
      <a href="${REPO}/issues">${escape(t.footer.issues)}</a>
      <a href="${REPO}/blob/main/LICENSE">${escape(t.footer.license)}</a>
      <a href="${REPO}/blob/main/THIRD-PARTY-NOTICES.md">${escape(t.footer.notices)}</a>
      <a href="${REPO}#code-signing-policy">${escape(t.footer.signing)}</a>
      <a href="${sponsorUrl(t)}" rel="noopener">${escape(t.footer.sponsor)}</a>
    </nav>
    <nav class="footer-popular" aria-label="${escape(t.footer.popular)}">
      <strong>${escape(t.footer.popular)}</strong>
      ${popular.map(p => `<a href="${paths.convert(t, pairSlug(p))}">${escape(pairName(t, p))}</a>`).join('')}
    </nav>
    <nav class="footer-langs" aria-label="${escape(t.nav.language)}">${languages.map(l => `<a href="${alternates[l.lang]}" hreflang="${l.htmlLang}" lang="${l.htmlLang}">${escape(l.name)}</a>`).join('')}</nav>
    <a class="footer-badge" href="${ALTERNATIVETO}" rel="noopener" target="_blank"><picture><source srcset="/media/badges/alternativeto-dark.svg" media="(prefers-color-scheme: dark)"><img src="/media/badges/alternativeto-light.svg" alt="Filee on AlternativeTo" width="141" height="48" loading="lazy" decoding="async"></picture></a>
    <p class="footer-made">${escape(t.footer.made)} © ${new Date().getFullYear()}</p>
  </div>
</footer>`;
}

/* ───────── Building blocks ───────── */

/** "HEIC → JPG" in the reader's language (used for link texts). */
export const pairName = (t, p) => `${label(p.from, t.lang)} → ${label(p.to, t.lang)}`;

/** Breadcrumb trail and its BreadcrumbList. items: [{ name, path }], the last one is the current page. */
export function breadcrumbs(t, items) {
  const html = `<nav class="crumbs" aria-label="${escape(t.common.breadcrumb)}"><ol>${items.map((item, i) => i === items.length - 1
    ? `<li><span aria-current="page">${escape(item.name)}</span></li>`
    : `<li><a href="${item.path}">${escape(item.name)}</a>${icon('chevron')}</li>`).join('')}</ol></nav>`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: SITE + item.path })),
  };
  return { html, ld };
}

/** Built in / optional engine badge. */
export function engineBadge(t, engine, engines) {
  if (engine === 'builtin') return `<span class="tag tag-builtin" title="${escape(t.common.builtInHint)}">${escape(t.common.builtIn)}</span>`;
  return `<span class="tag tag-optional" title="${escape(t.common.optionalHint)}">${escape(engines[engine].name)}</span>`;
}

/** A small file icon (like the demo's) for a format, coloured by its category. */
export function fileIcon(id, lang, cls = '') {
  const f = FORMATS[id];
  const cat = CATEGORIES.find(c => c.id === f.cat);
  const kind = { images: 'image', video: 'video', audio: 'audio', archives: 'archive' }[f.cat] ?? 'doc';
  return `<span class="file-icon ${cls}" data-kind="${kind}" style="--type:${cat.color}" aria-hidden="true"><b>${escape(label(id, lang))}</b></span>`;
}

/** The download call to action at the bottom of every page. */
export function downloadCard(t, { title, text, button }) {
  return `<section class="section download" id="download">
    <div class="download-card" data-reveal>
      ${LOGO}
      <h2>${escape(title)}</h2>
      <p>${escape(text).replaceAll('\n', '<br>')}</p>
      <div class="download-picker" data-download-picker hidden>
        <label for="download-target">${escape(t.download.selector)}</label>
        <select id="download-target" data-download-target aria-describedby="download-platform-note download-status">
          ${DOWNLOAD_TARGETS.map(target => `<option value="${target}">${escape(t.download.targets[target])}</option>`).join('')}
        </select>
      </div>
      <a class="btn btn-primary btn-large" href="${DOWNLOAD}" data-download aria-describedby="download-status">${icon('download')}<span data-download-label>${escape(button)}</span></a>
      <p class="download-status" id="download-status" data-download-status role="status" hidden></p>
      <p class="download-platform-note" id="download-platform-note">${escape(t.download.platformNote)}</p>
      <p class="download-meta"><a href="${REPO}/releases">${escape(t.download.all)}</a>
        <a href="${REPO}">${escape(t.download.source)}</a></p>
      <p class="download-sponsor">${escape(t.download.sponsorText)} <a href="${sponsorUrl(t)}" rel="noopener">${escape(t.download.sponsor)}</a></p>
    </div>
  </section>`;
}

/** Links to conversion pages as pills. */
export function pairLinks(t, pairs, cls = 'pills') {
  if (!pairs.length) return '';
  return `<ul class="${cls}">${pairs.map(p => `<li><a class="pill" href="${paths.convert(t, pairSlug(p))}">${escape(pairName(t, p))}</a></li>`).join('')}</ul>`;
}
