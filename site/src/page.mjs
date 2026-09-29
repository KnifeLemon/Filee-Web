// Page template: one static HTML page per language (SEO: real URLs, hreflang, structured data, no client-side
// rendering). build.mjs calls renderPage for every i18n/*.json file.

export const SITE = 'https://filee.sh';
export const REPO = 'https://github.com/KnifeLemon/Filee';
export const DOWNLOAD = `${REPO}/releases/latest/download/Filee-win-Setup.exe`;
/** Date the promo video was published (VideoObject.uploadDate); bump when the video is re-rendered. */
const VIDEO_DATE = '2026-09-30';

const escape = value => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export const LOGO = `<svg class="logo" viewBox="0 0 512 512" aria-hidden="true"><path fill="#7F77DD" d="M154.61 65.27A216 216 0 0 1 357.39 65.27L304.82 164.17A104 104 0 0 0 207.18 164.17Z"/><path transform="translate(13.86,-8)" fill="#1D9E75" d="M373.66 67.74A222 222 0 0 1 477.86 248.23L359.94 252.36A104 104 0 0 0 311.12 167.81Z"/><path fill="#7F77DD" d="M471.87 263.56A216 216 0 0 1 370.48 439.17L311.12 344.19A104 104 0 0 0 359.94 259.64Z"/><path fill="#6A62C9" d="M357.39 446.73A216 216 0 0 1 154.61 446.73L207.18 347.83A104 104 0 0 0 304.82 347.83Z"/><path fill="#7F77DD" d="M141.52 439.17A216 216 0 0 1 40.13 263.56L152.06 259.64A104 104 0 0 0 200.88 344.19Z"/><path fill="#6A62C9" d="M40.13 248.44A216 216 0 0 1 141.52 72.83L200.88 167.81A104 104 0 0 0 152.06 252.36Z"/><path fill="#3C3489" d="M222 212h44l24 24v64h-68z"/><path fill="#AFA9EC" d="M266 212v24h24z"/></svg>`;

/** Material Design icons (Apache-2.0), 24×24. */
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
};

/** Marks JS as available before first paint so reveal animations don't flash. */
const JS_FLAG_SCRIPT = "document.documentElement.classList.add('js')";

/** Google Analytics 4 measurement ID; empty turns analytics off. */
const GA_ID = 'G-0Q2YHDJHEL';
const GA_SCRIPT = GA_ID
  ? `window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', '${GA_ID}');`
  : '';
/** Google tag (gtag.js), as Google asks: early in <head>. */
const ANALYTICS = GA_ID
  ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>\n<script>${GA_SCRIPT}</script>`
  : '';

/** Every inline script on the pages: build.mjs puts their hashes into the Content-Security-Policy. */
export const INLINE_SCRIPTS = [JS_FLAG_SCRIPT, GA_SCRIPT].filter(Boolean);

const icon = (name, cls = 'icon') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;

const ALL_FORMATS = ['JPG', 'PNG', 'WEBP', 'HEIC', 'AVIF', 'TIFF', 'BMP', 'GIF', 'ICO', 'PDF', 'DOCX', 'DOC', 'ODT',
  'RTF', 'HWP', 'HWPX', 'XLSX', 'XLS', 'ODS', 'CSV', 'PPTX', 'PPT', 'ODP', 'TXT', 'MD', 'HTML'];

/** One endless marquee row: the list rotated by offset, repeated twice so the CSS loop is seamless. */
function marqueeRow(offset, reverse = false) {
  const rotated = [...ALL_FORMATS.slice(offset), ...ALL_FORMATS.slice(0, offset)];
  const chips = rotated.map(f => `<span class="chip">${f}</span>`).join('');
  return `<div class="marquee-row${reverse ? ' reverse' : ''}"><div class="marquee-track">${chips}${chips}</div></div>`;
}

/** Formats shown on each demo donut (like the app's default toolbar profiles). */
const DEMO_DONUTS = {
  image: [['PNG'], ['WEBP'], ['PDF'], ['JPG', '70%'], ['ICO'], ['BMP'], ['TIFF'], ['AVIF']],
  document: [['PDF'], ['HWPX'], ['ODT'], ['RTF'], ['TXT'], ['HTML']],
  hwp: [['PDF'], ['HWPX'], ['DOCX'], ['PNG'], ['TXT'], ['MD']],
};

/** Pixel sizes of the screenshots in public/media/screens (for width/height attributes: no layout shift). */
const SCREEN_SIZES = {
  'engine-setup-en': [560, 452], 'engine-setup-ko': [560, 461], 'preset-popup-ko': [560, 680],
};
const screenSize = name => SCREEN_SIZES[name] ?? [1080, 820];

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

function structuredData(t, languages) {
  const url = SITE + t.path;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Filee',
      alternateName: 'Filee file converter',
      url,
      description: t.meta.description,
      applicationCategory: 'UtilitiesApplication',
      applicationSubCategory: 'File converter',
      operatingSystem: 'Windows 10, Windows 11',
      processorRequirements: 'x64',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isAccessibleForFree: true,
      license: 'https://opensource.org/licenses/MIT',
      downloadUrl: DOWNLOAD,
      installUrl: DOWNLOAD,
      codeRepository: REPO,
      image: `${SITE}/media/og-${t.lang}.jpg`,
      screenshot: t.gallery.shots.map(s => `${SITE}/media/screens/${s.src}.webp`),
      featureList: t.features.items.map(f => f.title),
      inLanguage: languages.map(l => l.htmlLang),
      author: { '@type': 'Person', name: 'KnifeLemon', url: 'https://github.com/KnifeLemon' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: t.video.title,
      description: t.video.caption,
      thumbnailUrl: `${SITE}/media/poster-${t.lang}.jpg`,
      contentUrl: `${SITE}/media/promo-${t.lang}.mp4`,
      uploadDate: VIDEO_DATE,
      duration: 'PT27S',
      inLanguage: t.htmlLang,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Filee',
      url: SITE + '/',
      inLanguage: t.htmlLang,
    },
  ];
}

function demoFiles(t) {
  return t.demo.files.map((file, i) => `
          <li><button class="file" type="button" data-index="${i}" aria-label="${escape(file.name)}">
            <span class="file-icon" data-type="${file.type}"><b>${file.type.toUpperCase()}</b></span>
            <span class="file-name">${escape(file.name)}</span>
          </button></li>`).join('');
}

/** Renders the page for language t; languages lists every translation (for links and hreflang). */
export function renderPage(t, languages, assets) {
  const url = SITE + t.path;
  const others = languages.filter(l => l.lang !== t.lang);
  const hreflang = languages.map(l => `<link rel="alternate" hreflang="${l.htmlLang}" href="${SITE}${l.path}">`).join('')
    + `<link rel="alternate" hreflang="x-default" href="${SITE}/">`;
  const demoData = {
    files: t.demo.files, center: t.demo.center, donuts: DEMO_DONUTS,
    done: t.demo.done, cancelled: t.demo.cancelled, close: t.demo.close, hintTouch: t.demo.hintTouch,
    lang: t.lang, langs: languages.map(l => ({ lang: l.lang, path: l.path, banner: l.langBanner, name: l.name })),
  };

  return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${ANALYTICS}
<script>${JS_FLAG_SCRIPT}</script>
<title>${escape(t.meta.title)}</title>
<meta name="description" content="${escape(t.meta.description)}">
${verificationMeta}
<link rel="canonical" href="${url}">
${hreflang}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Filee">
<meta property="og:title" content="${escape(t.meta.title)}">
<meta property="og:description" content="${escape(t.meta.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/media/og-${t.lang}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escape(t.meta.ogAlt)}">
<meta property="og:locale" content="${t.ogLocale}">
${others.map(l => `<meta property="og:locale:alternate" content="${l.ogLocale}">`).join('')}
<meta property="og:video" content="${SITE}/media/promo-${t.lang}.mp4">
<meta property="og:video:type" content="video/mp4">
<meta property="og:video:width" content="1280">
<meta property="og:video:height" content="720">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(t.meta.title)}">
<meta name="twitter:description" content="${escape(t.meta.description)}">
<meta name="twitter:image" content="${SITE}/media/og-${t.lang}.jpg">
<meta name="theme-color" content="#7F77DD" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#16151F" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
${FONTS[t.lang] ?? ''}
<link rel="preload" as="image" href="/media/poster-${t.lang}.jpg" fetchpriority="low">
<link rel="stylesheet" href="/assets/${assets.css}">
<script type="application/ld+json">${JSON.stringify(structuredData(t, languages))}</script>
<script type="module" src="/assets/${assets.js}"></script>
</head>
<body class="lang-${t.lang}">
<a class="skip" href="#main">Skip to content</a>
<div class="backdrop" aria-hidden="true"><i></i><i></i><i></i></div>

<header class="nav" data-nav>
  <div class="nav-inner">
    <a class="brand" href="${t.path}" aria-label="Filee">${LOGO}<span>Filee</span></a>
    <nav class="nav-links" aria-label="${escape(t.nav.menu)}">
      <a href="#how">${escape(t.nav.how)}</a>
      <a href="#features">${escape(t.nav.features)}</a>
      <a href="#formats">${escape(t.nav.formats)}</a>
      <a href="#hwp">${escape(t.nav.hwp)}</a>
    </nav>
    <div class="nav-actions">
      <details class="lang-menu">
        <summary aria-label="${escape(t.nav.language)}">${icon('globe')}<span>${escape(t.name)}</span></summary>
        <ul>${languages.map(l => `<li><a href="${l.path}" hreflang="${l.htmlLang}" lang="${l.htmlLang}"${l.lang === t.lang ? ' aria-current="page"' : ''}>${escape(l.name)}</a></li>`).join('')}</ul>
      </details>
      <a class="btn btn-ghost github" href="${REPO}" rel="noopener">${icon('github')}<span class="stars" data-stars>GitHub</span></a>
      <a class="btn btn-primary btn-small" href="#download">${icon('download')}<span>${escape(t.nav.download)}</span></a>
    </div>
  </div>
</header>

<main id="main">
  <section class="hero">
    <div class="hero-copy">
      <p class="badge" data-reveal>${escape(t.hero.badge)}</p>
      <h1 class="hero-title">${t.hero.title.map((w, i) => `<span class="word" style="--i:${i}">${escape(w)}</span>`).join(' ')}</h1>
      <p class="lead" data-reveal>${escape(t.hero.lead)}</p>
      <div class="cta" data-reveal>
        <a class="btn btn-primary btn-large" href="${DOWNLOAD}" data-download>${icon('windows')}<span>${escape(t.hero.download)}</span></a>
        <a class="btn btn-ghost btn-large" href="${REPO}" rel="noopener">${icon('star')}<span>${escape(t.hero.github)}</span></a>
      </div>
      <p class="cta-note" data-reveal><span data-version></span>${escape(t.hero.downloadNote)}</p>
    </div>

    <div class="demo" data-demo aria-label="${escape(t.demo.label)}">
      <div class="demo-window">
        <div class="demo-titlebar"><span class="folder" aria-hidden="true"></span><span>${escape(t.demo.label)}</span><span class="demo-controls" aria-hidden="true"><i></i><i></i><i></i></span></div>
        <ul class="demo-files">${demoFiles(t)}
        </ul>
        <div class="demo-output">
          <p class="demo-output-title">${escape(t.demo.output)}</p>
          <ul class="demo-results" aria-live="polite"><li class="demo-empty">${escape(t.demo.empty)}</li></ul>
        </div>
        <p class="demo-hint"><kbd>Ctrl</kbd><span class="plus">+</span><span data-hint>${escape(t.demo.hint)}</span></p>
      </div>
      <p class="sr-only">${escape(t.demo.keyboard)}</p>
    </div>
  </section>

  <section class="section video-section" id="video">
    <header class="section-head" data-reveal>
      <h2>${escape(t.video.title)}</h2>
      <p>${escape(t.video.caption)}</p>
    </header>
    <div class="video-frame" data-reveal>
      <video class="promo" data-src="/media/promo-${t.lang}.mp4" poster="/media/poster-${t.lang}.jpg" muted playsinline loop controls preload="none" width="1280" height="720" aria-label="${escape(t.video.title)}"></video>
    </div>
  </section>

  <section class="section" id="how">
    <header class="section-head" data-reveal><h2>${escape(t.how.title)}</h2></header>
    <ol class="steps">
      ${t.how.steps.map((step, i) => `<li class="step" data-reveal style="--i:${i}"><span class="step-number">${i + 1}</span><h3>${escape(step.title)}</h3><p>${escape(step.text)}</p></li>`).join('')}
    </ol>
  </section>

  <section class="section" id="features">
    <header class="section-head" data-reveal><h2>${escape(t.features.title)}</h2></header>
    <ul class="bento">
      ${t.features.items.map((f, i) => `<li class="card" data-reveal data-tilt style="--i:${i}">${icon(f.icon, 'card-icon')}<h3>${escape(f.title)}</h3><p>${escape(f.text)}</p></li>`).join('')}
    </ul>
  </section>

  <section class="section" id="formats">
    <header class="section-head" data-reveal><h2>${escape(t.formats.title)}</h2><p>${escape(t.formats.lead)}</p></header>
    <div class="marquee" aria-hidden="true">
      ${marqueeRow(0)}
      ${marqueeRow(13, true)}
    </div>
    <div class="format-table" data-reveal>
      <table>
        <tbody>
          ${t.formats.groups.map(g => `<tr><th scope="row">${escape(g.name)}</th><td>${escape(g.list)}</td><td class="arrow">${icon('arrow')}</td><td>${escape(g.to)}</td></tr>`).join('')}
        </tbody>
      </table>
      <p class="note">${escape(t.formats.note)}</p>
    </div>
  </section>

  <section class="section hwp" id="hwp">
    <div class="hwp-copy" data-reveal>
      <p class="eyebrow">${escape(t.hwp.eyebrow)}</p>
      <h2>${escape(t.hwp.title)}</h2>
      <p>${escape(t.hwp.text)}</p>
      <ul class="checks">${t.hwp.points.map(p => `<li>${icon('check')}<span>${escape(p)}</span></li>`).join('')}</ul>
    </div>
    <div class="hwp-visual" data-reveal aria-hidden="true">
      <div class="doc doc-docx"><i class="doc-head"></i><i class="doc-title"></i><i class="doc-table"></i><i class="doc-lines"></i><b>DOCX</b></div>
      <div class="doc-arrow">${icon('arrow')}</div>
      <div class="doc doc-hwpx"><i class="doc-head"></i><i class="doc-title"></i><i class="doc-table"></i><i class="doc-lines"></i><b>HWPX</b></div>
    </div>
  </section>

  <section class="section" id="gallery">
    <header class="section-head" data-reveal><h2>${escape(t.gallery.title)}</h2><p>${escape(t.gallery.lead)}</p></header>
    <div class="gallery" data-reveal>
      ${t.gallery.shots.map(s => {
        const [w, h] = screenSize(s.src);
        return `<figure><div class="shot${w < 1000 ? ' shot-dialog' : ''}"><img src="/media/screens/${s.src}.webp" alt="${escape(s.alt)}" width="${w}" height="${h}" loading="lazy" decoding="async"></div><figcaption>${escape(s.alt)}</figcaption></figure>`;
      }).join('')}
    </div>
  </section>

  <section class="section" id="specs">
    <header class="section-head" data-reveal><h2>${escape(t.specs.title)}</h2></header>
    <dl class="specs" data-reveal>
      ${t.specs.rows.map(([k, v]) => `<div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>`).join('')}
    </dl>
  </section>

  <section class="section download" id="download">
    <div class="download-card" data-reveal>
      ${LOGO}
      <h2>${escape(t.download.title)}</h2>
      <p>${escape(t.download.text)}</p>
      <a class="btn btn-primary btn-large" href="${DOWNLOAD}" data-download>${icon('windows')}<span>${escape(t.download.button)}</span></a>
      <p class="download-meta"><span data-latest hidden>${escape(t.download.latest)}: <b data-version-full></b></span>
        <a href="${REPO}/releases">${escape(t.download.all)}</a>
        <a href="${REPO}">${escape(t.download.source)}</a></p>
    </div>
  </section>
</main>

<footer class="footer">
  <div class="footer-inner">
    <div class="footer-brand">${LOGO}<div><strong>Filee</strong><p>${escape(t.footer.tagline)}</p></div></div>
    <nav class="footer-links" aria-label="Footer">
      <a href="${REPO}">GitHub</a>
      <a href="${REPO}/releases">${escape(t.download.all)}</a>
      <a href="${REPO}/issues">${escape(t.footer.issues)}</a>
      <a href="${REPO}/blob/main/LICENSE">${escape(t.footer.license)}</a>
      <a href="${REPO}/blob/main/THIRD-PARTY-NOTICES.md">${escape(t.footer.notices)}</a>
    </nav>
    <nav class="footer-langs" aria-label="${escape(t.nav.language)}">${languages.map(l => `<a href="${l.path}" hreflang="${l.htmlLang}" lang="${l.htmlLang}">${escape(l.name)}</a>`).join('')}</nav>
    <p class="footer-made">${escape(t.footer.made)} © ${new Date().getFullYear()}</p>
  </div>
</footer>
<script id="demo-data" type="application/json">${JSON.stringify(demoData).replaceAll('<', '\\u003c')}</script>
</body>
</html>
`;
}

/** The 404 page: all three languages at once, since we can't know which one the visitor reads. */
export function renderNotFound(languages, assets) {
  const text = {
    en: ['Page not found', "This page doesn't exist. Maybe it was dragged somewhere else.", 'Go to the home page'],
    ko: ['페이지를 찾을 수 없어요', '없는 페이지입니다. 어딘가로 끌려간 것 같아요.', '홈으로 가기'],
    'zh-CN': ['找不到页面', '此页面不存在，可能被拖到别处了。', '返回首页'],
  };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ANALYTICS}
<title>404 · Filee</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/${assets.css}">
</head>
<body class="not-found">
<div class="backdrop" aria-hidden="true"><i></i><i></i><i></i></div>
<main class="not-found-card">
  ${LOGO}
  <p class="not-found-code">404</p>
  ${languages.map(l => {
    const [title, body, link] = text[l.lang];
    return `<section lang="${l.htmlLang}"><h1>${title}</h1><p>${body}</p><a class="btn btn-primary" href="${l.path}">${link}</a></section>`;
  }).join('\n  ')}
</main>
</body>
</html>
`;
}
