// Home page: one static page per language (SEO: real URLs, hreflang, structured data, no client-side rendering).
// Texts come from i18n/<lang>.json, every format fact and count from catalog.mjs.

import {
  CATEGORIES, DEMO_DONUTS, ENGINES, FAQ, MARQUEE, PAIRS, VERSION, L, enginesOf, fill, label, vars,
} from './catalog.mjs';
import {
  DOWNLOAD, LOGO, REPO, SITE, alternatesOf, downloadCard, engineBadge, escape, icon, pairLinks, paths, renderDocument,
} from './layout.mjs';
import { NOBODY, supportersSection } from './sponsors.mjs';
import { md, terminal } from './cli-page.mjs';

export { DOWNLOAD, INLINE_SCRIPTS, REPO, SITE } from './layout.mjs';

/** Date the promo video was published (VideoObject.uploadDate); bump when the video is re-rendered. */
const VIDEO_DATE = '2026-10-04';

/** Pixel sizes of the screenshots in public/media/screens (for width/height attributes: no layout shift). */
const SCREEN_SIZES = {
  'engine-setup-en': [560, 953], 'engine-setup-ko': [560, 945], 'preset-popup-ko': [560, 680],
};
const screenSize = name => SCREEN_SIZES[name] ?? [1080, 820];

/** The terminal on the home page's automation section (output as the filee command prints it). */
const AUTO_SESSION = [
  '> filee watch . --to pdf --move-originals',
  'Watching D:\\Inbox → PDF, saving to D:\\Inbox\\converted. Press Ctrl+C to stop.',
  'ok    scan-0412.jpg -> converted\\scan-0412.pdf',
  'ok    receipt.heic -> converted\\receipt.pdf',
  'ok    contract.docx -> converted\\contract.pdf',
];

/** One endless marquee row: the chips repeated twice so the CSS loop is seamless. */
function marqueeRow(ids, lang, reverse = false) {
  const chips = ids.map(id => `<span class="chip">${escape(label(id, lang))}</span>`).join('');
  return `<div class="marquee-row${reverse ? ' reverse' : ''}"><div class="marquee-track">${chips}${chips}</div></div>`;
}

/** Plain text of an FAQ answer (placeholders filled). */
const faqAnswer = (item, lang) => fill(L(item.a, lang), vars(lang));

function structuredData(t, languages) {
  const url = SITE + t.path;
  const v = vars(t.lang);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': `${SITE}/#app`,
      name: 'Filee',
      alternateName: fill(t.meta.appAlternateName, v),
      url,
      description: fill(t.meta.description, v),
      applicationCategory: 'UtilitiesApplication',
      applicationSubCategory: 'File converter',
      operatingSystem: 'Windows 10, Windows 11, macOS 14, Linux',
      processorRequirements: 'x64, ARM64',
      softwareVersion: VERSION,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isAccessibleForFree: true,
      license: 'https://opensource.org/licenses/MIT',
      downloadUrl: DOWNLOAD,
      installUrl: DOWNLOAD,
      releaseNotes: `${REPO}/releases`,
      codeRepository: REPO,
      image: `${SITE}/media/og-${t.lang}.jpg`,
      screenshot: t.gallery.shots.map(s => `${SITE}/media/screens/${s.src}.webp`),
      // What Filee converts, from the catalog (schema.org has no "supported formats" property for software).
      featureList: [
        ...t.features.items.map(f => fill(f.title, v)),
        ...CATEGORIES.map(c => `${L(c.name, t.lang)}: ${c.formats.slice(0, 12).map(f => f.display ?? f.label).join(', ')}${c.formats.length > 12 ? ', …' : ''}`),
      ],
      keywords: t.meta.keywords,
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
      '@type': 'FAQPage',
      inLanguage: t.htmlLang,
      mainEntity: FAQ.map(item => ({
        '@type': 'Question',
        name: L(item.q, t.lang),
        acceptedAnswer: { '@type': 'Answer', text: faqAnswer(item, t.lang) },
      })),
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
  return t.demo.files.map((file, i) => {
    const kind = { image: 'image', video: 'video' }[file.profile] ?? 'doc';
    return `
          <li><button class="file" type="button" data-index="${i}" aria-label="${escape(file.name)}">
            <span class="file-icon" data-kind="${kind}" data-type="${file.type}"><b>${file.type.toUpperCase()}</b></span>
            <span class="file-name">${escape(file.name)}</span>
          </button></li>`;
  }).join('');
}

/** Category cards linking into the format catalog. */
function categoryCards(t) {
  const catalog = paths.formats(t);
  return `<ul class="cat-grid">${CATEGORIES.map((c, i) => {
    const engines = enginesOf(c.id);
    return `<li data-reveal style="--i:${i % 4}"><a class="cat-card" href="${catalog}#${c.id}" style="--cat:${c.color}">
      ${icon(c.icon, 'cat-icon')}
      <span class="cat-name">${escape(L(c.name, t.lang))}</span>
      <span class="cat-count">${escape(fill(t.formats.count, { n: c.formats.length }))}</span>
      <span class="cat-sample">${escape(c.formats.filter(f => !f.raw).slice(0, 6).map(f => f.label).join(' · '))}</span>
      <span class="cat-tags">${engines.map(e => engineBadge(t, e, ENGINES)).join('')}</span>
    </a></li>`;
  }).join('')}</ul>`;
}

/** HWP section checklist: the HWP routes from the catalog plus the layout note. */
function hwpPoints(t) {
  const hwp = CATEGORIES.find(c => c.id === 'hwp');
  const sep = t.lang === 'zh-CN' ? '、' : ', ';
  const route = r => `${r.from.map(id => label(id, t.lang)).join(sep)} → ${r.to.map(id => label(id, t.lang)).join(sep)}`;
  return [...hwp.routes.map(route), t.hwp.quality];
}

/** Renders the home page for language t; languages lists every translation (for links and hreflang). */
export function renderPage(t, languages, assets) {
  const v = vars(t.lang);
  const f = text => fill(text, v);
  const alternates = alternatesOf(languages, paths.home);
  const demoData = {
    files: t.demo.files, center: t.demo.center,
    donuts: Object.fromEntries(Object.entries(DEMO_DONUTS).map(([key, d]) => [key, d.items])),
    done: t.demo.done, cancelled: t.demo.cancelled, close: t.demo.close, hintTouch: t.demo.hintTouch,
  };
  const half = Math.ceil(MARQUEE.length / 2);
  const popular = PAIRS.filter(p => p.popular);
  const hwpGuides = ['hwp-to-pdf', 'hwp-to-docx', 'hwpx-to-pdf', 'hwp-to-hwpx', 'docx-to-hwpx', 'pdf-to-hwpx']
    .map(slug => PAIRS.find(p => `${p.from}-to-${p.to}` === slug)).filter(Boolean);

  const extraHead = `<meta property="og:video" content="${SITE}/media/promo-${t.lang}.mp4">
<meta property="og:video:type" content="video/mp4">
<meta property="og:video:width" content="1280">
<meta property="og:video:height" content="720">
<link rel="preload" as="image" href="/media/poster-${t.lang}.jpg" fetchpriority="low">`;

  const main = `
  <section class="hero">
    <div class="hero-copy">
      <a class="badge" href="${REPO}/releases/latest" rel="noopener" data-reveal>${escape(f(t.hero.badge))}</a>
      <h1 class="hero-title"><span class="kicker">${escape(f(t.hero.kicker))}</span> ${t.hero.title.map((w, i) => `<span class="word" style="--i:${i}">${escape(w)}</span>`).join(' ')}</h1>
      <p class="lead" data-reveal>${escape(f(t.hero.lead))}</p>
      <div class="cta" data-reveal>
        <a class="btn btn-primary btn-large" href="#download">${icon('download')}<span>${escape(t.hero.download)}</span></a>
        <a class="btn btn-ghost btn-large" href="${paths.formats(t)}">${icon('stack')}<span>${escape(f(t.hero.formats))}</span></a>
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
      ${t.features.items.map((item, i) => `<li class="card" data-reveal data-tilt style="--i:${i}">${icon(item.icon, 'card-icon')}<h3>${escape(f(item.title))}</h3><p>${escape(f(item.text))}</p></li>`).join('')}
    </ul>
  </section>

  <section class="section" id="formats">
    <header class="section-head" data-reveal><h2>${escape(f(t.formats.title))}</h2><p>${escape(f(t.formats.lead))}</p></header>
    <div class="marquee" aria-hidden="true">
      ${marqueeRow(MARQUEE.slice(0, half), t.lang)}
      ${marqueeRow(MARQUEE.slice(half), t.lang, true)}
    </div>
    ${categoryCards(t)}
    <div class="popular" data-reveal>
      <h3>${escape(t.formats.popular)}</h3>
      ${pairLinks(t, popular)}
      <p class="more-link"><a href="${paths.formats(t)}">${escape(f(t.formats.catalog))} ${icon('arrow')}</a></p>
    </div>
  </section>

  <section class="section hwp" id="hwp">
    <div class="hwp-copy" data-reveal>
      <p class="eyebrow">${escape(t.hwp.eyebrow)}</p>
      <h2>${escape(t.hwp.title)}</h2>
      <p>${escape(t.hwp.text)}</p>
      <ul class="checks">${hwpPoints(t).map(p => `<li>${icon('check')}<span>${escape(p)}</span></li>`).join('')}</ul>
      <p class="guides-label">${escape(t.hwp.guides)}</p>
      ${pairLinks(t, hwpGuides)}
    </div>
    <div class="hwp-visual" data-reveal aria-hidden="true">
      <div class="doc doc-docx"><i class="doc-head"></i><i class="doc-title"></i><i class="doc-table"></i><i class="doc-lines"></i><b>DOCX</b></div>
      <div class="doc-arrow">${icon('arrow')}</div>
      <div class="doc doc-hwpx"><i class="doc-head"></i><i class="doc-title"></i><i class="doc-table"></i><i class="doc-lines"></i><b>HWPX</b></div>
    </div>
  </section>

  <section class="section auto" id="automation">
    <div class="auto-copy" data-reveal>
      <p class="eyebrow">${escape(t.auto.eyebrow)}</p>
      <h2>${escape(t.auto.title)}</h2>
      <p>${escape(t.auto.text)}</p>
      <ul class="checks">${t.auto.points.map(p => `<li>${icon('check')}<span>${md(f(p))}</span></li>`).join('')}</ul>
      <p class="more-link"><a href="${paths.cli(t)}">${escape(t.auto.guide)} ${icon('arrow')}</a></p>
    </div>
    <div class="auto-visual" data-reveal>
      ${terminal(AUTO_SESSION, t.auto.terminal, 'D:\\Inbox>')}
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

  <section class="section" id="faq">
    <header class="section-head" data-reveal><h2>${escape(t.faq.title)}</h2><p>${escape(t.faq.lead)}</p></header>
    <div class="faq" data-reveal>
      ${FAQ.map((item, i) => `<details${i === 0 ? ' open' : ''}><summary><h3>${escape(L(item.q, t.lang))}</h3>${icon('chevron', 'icon faq-chevron')}</summary>
        <div class="faq-answer"><p>${escape(faqAnswer(item, t.lang))}</p>${faqLinks(t, item)}</div></details>`).join('\n      ')}
    </div>
  </section>

  <section class="section" id="specs">
    <header class="section-head" data-reveal><h2>${escape(t.specs.title)}</h2></header>
    <dl class="specs" data-reveal>
      ${t.specs.rows.map(([k, value]) => `<div><dt>${escape(k)}</dt><dd>${escape(f(value))}</dd></div>`).join('')}
    </dl>
  </section>

  ${supportersSection(t, assets.supporters ?? NOBODY)}

  ${downloadCard(t, { title: t.download.title, text: f(t.download.text), button: t.download.button })}`;

  return renderDocument({
    t, languages, assets, alternates, extraHead,
    title: f(t.meta.title), description: f(t.meta.description),
    jsonLd: structuredData(t, languages),
    main,
    scripts: `<script id="demo-data" type="application/json">${JSON.stringify(demoData).replaceAll('<', '\\u003c')}</script>`,
  });
}

function faqLinks(t, item) {
  if (!item.links?.length) return '';
  const pairs = item.links.filter(l => l !== 'formats' && l !== 'cli').map(slug => PAIRS.find(p => `${p.from}-to-${p.to}` === slug));
  const catalog = item.links.includes('formats')
    ? `<p class="more-link"><a href="${paths.formats(t)}">${escape(fill(t.formats.catalog, vars(t.lang)))} ${icon('arrow')}</a></p>` : '';
  const cli = item.links.includes('cli')
    ? `<p class="more-link"><a href="${paths.cli(t)}">${escape(t.auto.guide)} ${icon('arrow')}</a></p>` : '';
  return `${pairLinks(t, pairs)}${catalog}${cli}`;
}

/** The 404 page: all three languages at once, since we can't know which one the visitor reads. */
export function renderNotFound(languages, assets) {
  const text = {
    en: ['Page not found', "This page doesn't exist. Maybe it was dragged somewhere else.", 'Go to the home page', 'Browse all formats'],
    ko: ['페이지를 찾을 수 없어요', '없는 페이지입니다. 어딘가로 끌려간 것 같아요.', '홈으로 가기', '지원 형식 보기'],
    'zh-CN': ['找不到页面', '此页面不存在，可能被拖到别处了。', '返回首页', '查看全部格式'],
  };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
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
    const [title, body, home, formats] = text[l.lang];
    return `<section lang="${l.htmlLang}"><h1>${title}</h1><p>${body}</p><p class="not-found-links"><a class="btn btn-primary" href="${l.path}">${home}</a> <a class="btn btn-ghost" href="${paths.formats(l)}">${formats}</a></p></section>`;
  }).join('\n  ')}
</main>
</body>
</html>
`;
}
