// The preset gallery: /presets/ (cards with Hot / Best / New tabs, filters and search; the guide to sharing) and
// one page per preset, /presets/<id>/ (all pictures, the description, what each preset in the file does, the install
// steps, the download link, the CC0 note and the comments link), in every language. The presets' own titles and
// descriptions are shown as their authors wrote them, marked with their language. Texts: i18n/<lang>.json (t.presets).
// Data: src/presets.mjs. Sorting and filtering in the browser: src/gallery.js (without it, the cards stay in Hot order).

import { FORMATS, fill, label, vars } from './catalog.mjs';
import { md } from './cli-page.mjs';
import { SITE, alternatesOf, breadcrumbs, downloadCard, escape, icon, paths, renderDocument } from './layout.mjs';
import { ISSUES, PRESETS_REPO, SEVERITIES, UPLOAD, downloadPath, filePath } from './presets.mjs';
import { PERIODS } from './preset-stats.mjs';

const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';
const SORTS = ['hot', 'best', 'new'];
const PERIOD_NAMES = [...Object.keys(PERIODS), 'all'];

/** Plain text of a template: {placeholders} and {n|…} counts filled. */
const plain = (t, template, values = {}) => fill(template, { _lang: t.lang, ...values });
/**
 * HTML of a template: **bold** and `code` (md), then the values, escaped. Values are filled after md, so text from a
 * preset (its title, its author) can never become markup or a link.
 */
const html = (t, template, values = {}) => fill(md(template), {
  _lang: t.lang,
  ...Object.fromEntries(Object.entries(values).map(([k, v]) => [k, typeof v === 'number' ? v : escape(v)])),
});

/** The download card at the bottom (the nav's Download button points at it), worded like the home page's. */
const download = t => downloadCard(t, { title: t.download.title, text: fill(t.download.text, vars(t.lang)), button: t.download.button });

const formatName = (id, lang) => (FORMATS[id] ? label(id, lang) : id.toUpperCase());
const languageName = (code, t) => {
  try { return new Intl.DisplayNames([t.htmlLang], { type: 'language' }).of(code) ?? code; } catch { return code; }
};
const date = (iso, t) => (iso ? new Intl.DateTimeFormat(t.htmlLang, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(iso)) : '');
const number = (n, t) => new Intl.NumberFormat(t.htmlLang).format(n);
/** lang="…" for a preset's own texts (the first language its author named), when it differs from the page's. */
const textLang = (p, t) => (p.languages[0] && p.languages[0].toLowerCase() !== t.htmlLang.toLowerCase() ? ` lang="${escape(p.languages[0])}"` : '');
const authorUrl = p => `https://github.com/${p.author}`;
const discussionUrl = p => (p.discussion ? `${PRESETS_REPO}/discussions/${p.discussion}` : null);

/** Likes and downloads, as small icons with the count (the full wording for screen readers and on hover). */
function statLine(t, p, { comments = false } = {}) {
  const s = p.stats;
  const item = (name, n, template) => {
    const words = plain(t, template, { n });
    return `<span class="preset-stat" title="${escape(words)}">${icon(name)}<span aria-hidden="true">${number(n, t)}</span><span class="sr-only">${escape(words)}</span></span>`;
  };
  return `<p class="preset-stats">${item('thumb', s.likes, t.presets.likes)}${item('download', s.downloads, t.presets.downloads)}${comments ? item('comment', s.comments, t.presets.comments) : ''}</p>`;
}

/** The most serious severity among a preset's warnings, or null. */
const worst = p => SEVERITIES.find(s => p.warnings?.some(w => w.severity === s)) ?? null;

/** One plain sentence per warning; a code this site doesn't know yet is worded by its severity. */
const warningText = (t, w) => t.presets.warnings[w.code] ?? t.presets.warnGeneric[w.severity];

/**
 * The warning box above the install steps: high in red, medium in amber, info neutral; the box takes the colour of
 * the most serious one. Nothing when the preset has no warnings.
 */
function warningBox(t, p) {
  const level = worst(p);
  if (!level) return '';
  const texts = new Set();
  const items = p.warnings.filter(w => !texts.has(warningText(t, w)) && texts.add(warningText(t, w)));
  return `<div class="preset-warnings is-${level}" id="warnings" role="note" aria-labelledby="warnings-title">
        <h2 id="warnings-title">${icon(level === 'info' ? 'info' : 'alert')}<span>${escape(t.presets.warnTitle)}</span></h2>
        <ul>${items.map(w => `<li class="is-${w.severity}" data-warning="${escape(w.code)}">${icon(w.severity === 'info' ? 'info' : 'alert')}<span>${escape(warningText(t, w))}</span></li>`).join('')}</ul>
      </div>`;
}

const tagList = p => (p.tags.length ? `<ul class="preset-tags">${p.tags.map(tag => `<li class="tag">${escape(tag)}</li>`).join('')}</ul>` : '');

function card(t, p) {
  const formats = [...new Set([...p.formats.from, ...p.formats.to])];
  const search = [p.title, p.author, p.description, ...p.tags].join(' ').toLowerCase();
  const data = {
    id: p.id, hot: p.stats.hot, downloads: p.stats.downloads, created: p.created ?? '',
    best: PERIOD_NAMES.map(name => p.stats.best[name] ?? 0).join(','),
    kinds: p.kinds.join(' '), formats: formats.join(' '), tags: p.tags.join(' '), langs: p.languages.join(' '),
    search,
  };
  return `<li class="preset-card" ${Object.entries(data).map(([k, v]) => `data-${k}="${escape(v)}"`).join(' ')}>
        <a class="preset-card-link" href="${paths.preset(t, p.id)}">
          <span class="preset-thumb"><img src="${filePath(p.thumb)}" alt="" width="480" height="300" loading="lazy" decoding="async">${worst(p) === 'high' ? `<span class="preset-badge">${icon('alert')}<span>${escape(t.presets.warnBadge)}</span></span>` : ''}</span>
          <span class="preset-card-body">
            <strong class="preset-card-title"${textLang(p, t)}>${escape(p.title)}</strong>
            <span class="preset-by">${html(t, t.presets.by, { author: p.author })}</span>
          </span>
        </a>
        ${statLine(t, p)}
        ${tagList(p)}
      </li>`;
}

const select = (name, labelText, options, t) => `<label class="gallery-field"><span>${escape(labelText)}</span>
          <select data-filter="${name}"><option value="">${escape(t.presets.any)}</option>${options.map(([value, text]) => `<option value="${escape(value)}">${escape(text)}</option>`).join('')}</select></label>`;

function tools(t, presets) {
  const g = t.presets;
  const unique = list => [...new Set(list)].sort();
  const kinds = unique(presets.flatMap(p => p.kinds)).map(k => [k, g.kinds[k] ?? k]);
  const formats = unique(presets.flatMap(p => [...p.formats.from, ...p.formats.to])).map(f => [f, formatName(f, t.lang)])
    .sort((a, b) => a[1].localeCompare(b[1]));
  const tags = unique(presets.flatMap(p => p.tags)).map(tag => [tag, tag]);
  const langs = unique(presets.flatMap(p => p.languages)).map(l => [l, languageName(l, t)]);
  return `<div class="gallery-tools" data-gallery-tools hidden>
        <div class="gallery-sort" role="group" aria-label="${escape(g.sortLabel)}">
          ${SORTS.map(s => `<button type="button" class="pill" data-sort="${s}" aria-pressed="${s === 'hot'}">${escape(g.sort[s])}</button>`).join('')}
        </div>
        <label class="gallery-field" data-period-field hidden><span>${escape(g.periodLabel)}</span>
          <select data-period>${PERIOD_NAMES.map(name => `<option value="${name}"${name === 'week' ? ' selected' : ''}>${escape(g.periods[name])}</option>`).join('')}</select></label>
        <label class="gallery-field gallery-search"><span class="sr-only">${escape(g.searchLabel)}</span>${icon('search')}
          <input type="search" data-search placeholder="${escape(g.searchPlaceholder)}" autocomplete="off"></label>
        ${kinds.length > 1 ? select('kinds', g.filterKind, kinds, t) : ''}
        ${formats.length > 1 ? select('formats', g.filterFormat, formats, t) : ''}
        ${tags.length > 1 ? select('tags', g.filterTag, tags, t) : ''}
        ${langs.length > 1 ? select('langs', g.filterLanguage, langs, t) : ''}
        <button type="button" class="gallery-clear" data-clear hidden>${escape(g.clear)}</button>
      </div>`;
}

function guide(t) {
  const g = t.presets;
  const list = items => `<ul class="checks">${items.map(item => `<li>${icon('check')}<span>${md(item)}</span></li>`).join('')}</ul>`;
  return `<section class="section section-tight" id="guide">
    <header class="section-head" data-reveal><h2>${escape(g.guideTitle)}</h2><p>${escape(g.guideLead)}</p></header>
    <ol class="steps">
      ${g.guideSteps.map((s, i) => `<li class="step" data-reveal style="--i:${i}"><span class="step-number">${i + 1}</span><h3>${escape(s.title)}</h3><p>${html(t, s.text, { upload: g.upload })}</p></li>`).join('')}
    </ol>
    <div class="cta gallery-guide-cta" data-reveal><a class="btn btn-primary btn-large" href="${UPLOAD}" rel="noopener">${icon('upload')}<span>${escape(g.upload)}</span></a></div>
    <div class="gallery-rules">
      <div class="details-copy" data-reveal><h3>${escape(g.allowedTitle)}</h3>${list(g.allowed)}</div>
      <div class="details-copy gallery-never" data-reveal><h3>${escape(g.notAllowedTitle)}</h3>${list(g.notAllowed)}</div>
      <div class="details-copy" data-reveal id="cc0"><h3>${escape(g.ccTitle)}</h3><p>${escape(g.ccText)}</p><p><a href="${CC0}" rel="noopener">${escape(g.licenseLink)}</a></p></div>
      <div class="details-copy" data-reveal id="removal"><h3>${escape(g.removalTitle)}</h3><p>${escape(g.removalText)}</p><p><a href="${ISSUES}" rel="noopener">${escape(g.removalLink)}</a></p></div>
    </div>
  </section>`;
}

export function renderGalleryPage(t, languages, assets, gallery) {
  const g = t.presets;
  const { presets } = gallery;
  const alternates = alternatesOf(languages, paths.presets);
  const url = SITE + alternates[t.lang];
  const crumbs = breadcrumbs(t, [
    { name: t.common.home, path: paths.home(t) },
    { name: g.crumb, path: alternates[t.lang] },
  ]);
  const list = presets.length
    ? `${tools(t, presets)}
      <p class="gallery-count" data-count data-template="${escape(g.count)}" aria-live="polite">${escape(plain(t, g.count, { n: presets.length }))}</p>
      <ul class="preset-grid" data-gallery>
      ${presets.map(p => card(t, p)).join('\n      ')}
      </ul>
      <p class="gallery-empty" data-no-match hidden>${escape(g.noMatch)}</p>
      <p class="gallery-note muted">${escape(g.statsNote)}</p>`
    : `<div class="gallery-empty gallery-first" data-reveal><p>${escape(g.empty)}</p>
        <a class="btn btn-primary" href="${UPLOAD}" rel="noopener">${icon('upload')}<span>${escape(g.upload)}</span></a></div>`;

  const main = `
  <section class="page-hero page-hero-wide">
    <div class="page-hero-copy">
      ${crumbs.html}
      <h1>${escape(g.h1)}</h1>
      <p class="lead">${escape(g.lead)}</p>
      <div class="cta">
        <a class="btn btn-primary btn-large" href="${UPLOAD}" rel="noopener">${icon('upload')}<span>${escape(g.upload)}</span></a>
        <a class="btn btn-ghost btn-large gallery-guide-link" href="#guide">${icon('chevron')}<span>${escape(g.guideButton)}</span></a>
      </div>
    </div>
  </section>

  <section class="section section-tight preset-gallery" id="presets" data-gallery-root>
    ${list}
  </section>

  ${guide(t)}

  ${download(t)}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: g.title,
      description: g.description,
      url,
      inLanguage: t.htmlLang,
      about: { '@id': `${SITE}/#app` },
      license: CC0,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: presets.length,
        itemListElement: presets.slice(0, 100).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + paths.preset(t, p.id), name: p.title })),
      },
    },
    crumbs.ld,
  ];
  return renderDocument({
    t, languages, assets, alternates, nav: 'presets',
    title: g.title, description: g.description, jsonLd, main,
    scripts: presets.length ? `<script type="module" src="/assets/${assets.gallery}"></script>` : '',
  });
}

/* ───────── One preset ───────── */

/** A preset file's object with its keys camelCased (Filee writes camelCase; PascalCase is read too). */
const camel = value => (value && typeof value === 'object' && !Array.isArray(value)
  ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k[0].toLowerCase() + k.slice(1), v])) : {});
const enumName = value => String(value ?? '').toLowerCase();
const LOSSY = ['jpg', 'jpeg', 'webp', 'avif', 'heic', 'heif', 'jxl'];
const positive = n => Number.isFinite(n) && n > 0;

/** The main options of one preset of the file, as short phrases. */
export function describeOptions(t, raw) {
  const o = t.presets.options;
  const p = camel(raw), image = camel(p.image), pdf = camel(p.pdf), media = camel(p.media);
  const kind = enumName(p.kind || 'convert');
  if (kind === 'group') return [plain(t, o.group, { n: Array.isArray(p.subPresetIds) ? p.subPresetIds.length : 0 })];
  if (kind === 'tool') return [o.tool];
  const target = enumName(p.targetFormat);
  const cat = FORMATS[target]?.cat;
  const out = [];
  if (LOSSY.includes(target) && positive(image.quality)) out.push(plain(t, o.quality, { n: image.quality }));
  const resize = enumName(image.resize);
  const custom = camel(image.customSize);
  if (resize === 'longedge' && positive(image.longEdge)) out.push(plain(t, o.longEdge, { n: image.longEdge }));
  else if (resize === 'width' && positive(image.width)) out.push(plain(t, o.width, { n: image.width }));
  else if (resize === 'percent' && positive(image.resizePercent)) out.push(plain(t, o.percent, { n: image.resizePercent }));
  else if (positive(custom.width) && positive(custom.height)) out.push(plain(t, o.customSize, { w: custom.width, h: custom.height }));
  if (positive(image.maxSizeMb)) out.push(plain(t, o.maxSize, { n: image.maxSizeMb }));
  if (image.grayscale === true) out.push(o.grayscale);
  if (image.removeBackground === true) out.push(o.removeBackground);
  if (image.keepMetadata === false || pdf.removeMetadata === true) out.push(o.stripMetadata);
  if (pdf.mergeIntoSingle === true) out.push(o.mergePdf);
  if (pdf.compression && enumName(pdf.compression) !== 'none') out.push(o.compressPdf);
  if (pdf.ocr === true) out.push(o.ocr);
  if (pdf.pageNumbers === true) out.push(o.pageNumbers);
  if (cat === 'video' || cat === 'audio') {
    const quality = { high: o.mediaHigh, balanced: o.mediaBalanced, small: o.mediaSmall }[enumName(media.quality)];
    if (quality) out.push(quality);
    if (positive(media.maxHeight)) out.push(plain(t, o.maxHeight, { n: media.maxHeight }));
    if (positive(media.audioBitrateKbps)) out.push(plain(t, o.audioBitrate, { n: media.audioBitrateKbps }));
  }
  if (p.askCompression === true) out.push(o.askCompression);
  return out.length ? out : [t.presets.defaults];
}

/** Rows of the "What it does" table: one per preset in the file. */
function presetRows(t, bundle) {
  const g = t.presets;
  const list = Array.isArray(bundle?.presets ?? bundle?.Presets) ? (bundle.presets ?? bundle.Presets) : [];
  return list.slice(0, 20).map(raw => {
    const p = camel(raw);
    const kind = enumName(p.kind || 'convert');
    const target = enumName(p.targetFormat);
    const makes = kind === 'convert' && FORMAT_ID.test(target) ? formatName(target, t.lang) : '–';
    const name = [p.name, p.shortName].find(n => typeof n === 'string' && n.trim()) ?? makes;
    return `<tr><th scope="row">${escape(String(name).slice(0, 80))}</th><td data-label="${escape(g.colKind)}">${escape(g.presetKinds[kind] ?? kind)}</td><td data-label="${escape(g.colMakes)}">${escape(makes)}</td><td data-label="${escape(g.colOptions)}">${describeOptions(t, raw).map(escape).join(' · ')}</td></tr>`;
  });
}
const FORMAT_ID = /^[a-z0-9]{1,12}$/;

function toolbarLine(t, bundle) {
  const profile = camel((bundle?.profiles ?? bundle?.Profiles)?.[0]);
  if (!profile.name && !profile.nameKey) return '';
  const slices = Array.isArray(profile.presetIds) ? profile.presetIds.length : 0;
  return `<p class="preset-toolbar">${icon('donut')}<span>${html(t, t.presets.toolbarRow, { name: String(profile.name || profile.nameKey).slice(0, 80), n: slices })}</span></p>`;
}

export function renderPresetPage(t, languages, assets, p) {
  const g = t.presets;
  const alternates = alternatesOf(languages, l => paths.preset(l, p.id));
  const url = SITE + alternates[t.lang];
  const crumbs = breadcrumbs(t, [
    { name: t.common.home, path: paths.home(t) },
    { name: g.crumb, path: paths.presets(t) },
    { name: p.title, path: alternates[t.lang] },
  ]);
  const own = textLang(p, t);
  const images = p.images.map((path, i) => `<figure class="preset-figure${i === 0 ? ' is-cover' : ''}"><img src="${filePath(path)}" alt="${escape(plain(t, g.imageAlt, { title: p.title, n: i + 1, total: p.images.length }))}"${i ? ' loading="lazy"' : ''} decoding="async"></figure>`).join('');
  const comments = discussionUrl(p);
  const formats = (label, ids) => (ids.length ? `<p class="preset-formats"><b>${escape(label)}</b> ${ids.map(id => `<span class="tag">${escape(formatName(id, t.lang))}</span>`).join(' ')}</p>` : '');
  const rows = presetRows(t, p.bundle);

  const main = `
  <section class="page-hero page-hero-wide preset-hero">
    <div class="page-hero-copy">
      ${crumbs.html}
      <h1${own}>${escape(p.title)}</h1>
      <p class="preset-meta"><a href="${authorUrl(p)}" rel="ugc noopener">${html(t, g.sharedBy, { author: p.author })}</a>${p.updated ? ` · <span>${escape(plain(t, g.updated, { date: date(p.updated, t) }))}</span>` : ''}</p>
      ${statLine(t, p, { comments: Boolean(comments) })}
      ${tagList(p)}
    </div>
  </section>

  <section class="section section-tight preset-detail">
    <div class="preset-images">${images}</div>
    <div class="preset-side">
      ${warningBox(t, p)}
      <div class="details-copy preset-install" id="install">
        <h2>${escape(g.installTitle)}</h2>
        <ol class="preset-steps">${g.installSteps.map(s => `<li>${html(t, s, { title: p.title })}</li>`).join('')}</ol>
        <a class="btn btn-primary" href="${downloadPath(p.id)}" download="${escape(p.id)}.json">${icon('download')}<span>${escape(g.downloadButton)}</span></a>
        <p class="muted preset-note">${md(g.downloadNote)}</p>
        <p class="muted preset-sha"><abbr title="SHA-256">SHA-256</abbr> <code>${escape(p.sha256)}</code></p>
        ${p.minVersion ? `<p class="preset-note">${escape(plain(t, g.minVersion, { version: p.minVersion }))}</p>` : ''}
      </div>
      ${comments ? `<a class="btn btn-ghost preset-comments" href="${comments}" rel="noopener">${icon('comment')}<span>${escape(g.commentsButton)}</span></a>` : ''}
    </div>
  </section>

  <section class="section section-tight">
    <div class="details-copy" id="about">
      <h2>${escape(g.aboutTitle)}</h2>
      <p class="preset-description"${own}>${escape(p.description).replaceAll('\n', '<br>')}</p>
      ${formats(g.worksOn, p.formats.from)}
      ${formats(g.makes, p.formats.to)}
    </div>
  </section>

  ${rows.length || toolbarLine(t, p.bundle) ? `<section class="section section-tight">
    <div class="details-copy" id="what">
      <h2>${escape(g.whatTitle)}</h2>
      ${rows.length ? `<table class="engine-table preset-table">
        <thead><tr><th scope="col">${escape(g.colPreset)}</th><th scope="col">${escape(g.colKind)}</th><th scope="col">${escape(g.colMakes)}</th><th scope="col">${escape(g.colOptions)}</th></tr></thead>
        <tbody>${rows.join('')}</tbody>
      </table>` : ''}
      ${toolbarLine(t, p.bundle)}
    </div>
  </section>` : ''}

  <section class="section section-tight">
    <div class="details-copy preset-license" id="license">
      <p>${html(t, g.license, { author: p.author })} <a href="${CC0}" rel="noopener">${escape(g.licenseLink)}</a></p>
      <p class="muted">${md(g.report.replace('{removal}', ISSUES))}</p>
      <p><a class="preset-back" href="${paths.presets(t)}">${escape(g.back)}</a></p>
    </div>
  </section>

  ${download(t)}`;

  const work = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.title,
    description: p.description,
    url,
    ...(p.languages[0] ? { inLanguage: p.languages[0] } : {}),
    author: { '@type': 'Person', name: p.author, url: authorUrl(p) },
    license: CC0,
    image: p.images.map(path => SITE + filePath(path)),
    ...(p.created ? { dateCreated: p.created } : {}),
    ...(p.updated ? { dateModified: p.updated } : {}),
    isPartOf: { '@type': 'CollectionPage', url: SITE + paths.presets(t) },
    ...(comments ? { discussionUrl: comments } : {}),
    interactionStatistic: [
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: p.stats.likes },
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/DownloadAction', userInteractionCount: p.stats.downloads },
    ],
  };
  return renderDocument({
    t, languages, assets, alternates, nav: 'presets',
    title: plain(t, g.detailTitle, { title: p.title, author: p.author }),
    description: plain(t, g.detailDescription, { title: p.title, author: p.author }),
    image: { url: SITE + filePath(p.images[0]), alt: plain(t, g.imageAlt, { title: p.title, n: 1, total: p.images.length }) },
    jsonLd: [work, crumbs.ld], main,
  });
}
