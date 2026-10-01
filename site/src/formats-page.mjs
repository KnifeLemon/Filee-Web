// The format catalog (/formats/, /ko/formats/, /zh-cn/formats/): every category, every format, what it converts to,
// which engine does it, and links to the conversion guides. Generated entirely from catalog.mjs.

import { CATEGORIES, ENGINES, FORMATS, OPTIONS, PAIRS, BUILT_IN_ENGINES, L, fill, label, pairSlug, sizeText, stats, vars } from './catalog.mjs';
import { SITE, alternatesOf, breadcrumbs, downloadCard, engineBadge, escape, icon, pairLinks, paths, renderDocument } from './layout.mjs';

/** A format chip with its extensions (and maker) as a tooltip. */
function chip(id, lang, full = false) {
  const f = FORMATS[id];
  const ext = f.ext.map(e => `.${e}`).join(' ');
  const title = f.brand ? `${f.brand} — ${ext}` : ext;
  return `<span class="fmt" title="${escape(title)}">${escape(full ? f.display ?? label(id, lang) : label(id, lang))}</span>`;
}

function routeRow(t, route) {
  const from = route.fromText
    ? `<span class="fmt fmt-any">${escape(L(route.fromText, t.lang))}</span>`
    : `${route.label ? `<strong class="route-label">${escape(L(route.label, t.lang))}</strong>` : ''}${route.from.map(id => chip(id, t.lang, true)).join('')}`;
  const extras = (route.extras ?? []).map(key => `<span class="extra">${escape(L(OPTIONS[key].short, t.lang))}</span>`).join('');
  const to = route.to.map(id => chip(id, t.lang)).join('');
  const note = route.note ? `<p class="route-note">${escape(L(route.note, t.lang))}</p>` : '';
  const via = route.via ? `<span class="via">${escape(route.via)}</span>` : '';
  return `<tr>
          <td class="route-from" data-label="${escape(t.catalog.from)}">${from}${note}</td>
          <td class="arrow" aria-hidden="true">${icon('arrow')}</td>
          <td class="route-to" data-label="${escape(t.catalog.to)}">${to}${extras ? `<span class="extras">${extras}</span>` : ''}</td>
          <td class="route-engine" data-label="${escape(t.catalog.engine)}">${engineBadge(t, route.engine, ENGINES)}${via}</td>
        </tr>`;
}

function categorySection(t, c) {
  const guides = PAIRS.filter(p => FORMATS[p.from].cat === c.id);
  return `<section class="cat-section" id="${c.id}" style="--cat:${c.color}" data-reveal>
    <header class="cat-head">
      ${icon(c.icon, 'cat-icon')}
      <div><h2>${escape(L(c.name, t.lang))}</h2><p class="cat-count">${escape(fill(t.formats.count, { n: c.formats.length }))}</p></div>
    </header>
    <p class="cat-intro">${escape(L(c.intro, t.lang))}</p>
    <div class="format-table route-table">
      <table>
        <thead><tr><th scope="col">${escape(t.catalog.from)}</th><th aria-hidden="true"></th><th scope="col">${escape(t.catalog.to)}</th><th scope="col">${escape(t.catalog.engine)}</th></tr></thead>
        <tbody>
        ${c.routes.map(r => routeRow(t, r)).join('')}
        </tbody>
      </table>
    </div>
    ${guides.length ? `<div class="cat-guides"><h3>${escape(t.catalog.guides)}</h3>${pairLinks(t, guides)}</div>` : ''}
  </section>`;
}

export function renderFormatsPage(t, languages, assets) {
  const v = vars(t.lang);
  const f = text => fill(text, v);
  const s = stats();
  const alternates = alternatesOf(languages, paths.formats);
  const crumbs = breadcrumbs(t, [
    { name: t.common.home, path: paths.home(t) },
    { name: t.catalog.crumb, path: paths.formats(t) },
  ]);
  const engines = Object.values(ENGINES);

  const main = `
  <section class="page-hero page-hero-wide">
    ${crumbs.html}
    <h1>${escape(t.catalog.h1)}</h1>
    <p class="lead">${escape(f(t.catalog.lead))}</p>
    <ul class="stat-row">
      <li><b>${s.formatTotal}</b><span>${escape(t.catalog.stats.formats)}</span></li>
      <li><b>${s.categoryCount}</b><span>${escape(t.catalog.stats.categories)}</span></li>
      <li><b>${s.builtinTotal}</b><span>${escape(t.catalog.stats.builtin)}</span></li>
      <li><b>${s.pairCount}</b><span>${escape(t.catalog.stats.guides)}</span></li>
    </ul>
    <nav class="cat-index" aria-label="${escape(t.catalog.jump)}">
      ${CATEGORIES.map(c => `<a class="pill" href="#${c.id}" style="--cat:${c.color}">${icon(c.icon, 'pill-icon')}${escape(L(c.name, t.lang))} <small>${c.formats.length}</small></a>`).join('')}
    </nav>
  </section>

  <section class="section section-tight" id="engines">
    <div class="legend" data-reveal>
      <div class="legend-item">${engineBadge(t, 'builtin', ENGINES)}<p>${escape(f(t.catalog.legendBuiltIn))} <span class="muted">${escape(BUILT_IN_ENGINES.join(', '))}…</span></p></div>
      <div class="legend-item"><span class="tag tag-optional">${escape(t.common.optional)}</span><p>${escape(t.catalog.legendOptional)}</p></div>
      <table class="engine-table">
        <thead><tr><th scope="col">${escape(t.catalog.engineCols[0])}</th><th scope="col">${escape(t.catalog.engineCols[1])}</th><th scope="col">${escape(t.catalog.engineCols[2])}</th></tr></thead>
        <tbody>${engines.map(e => `<tr><th scope="row"><a href="${e.url}" rel="noopener">${escape(e.name)}</a></th><td>${escape(L(e.for, t.lang))}</td><td>${escape(sizeText(e.sizeMB, t.lang) || '–')}</td></tr>`).join('')}</tbody>
      </table>
    </div>
  </section>

  <div class="catalog">
    ${CATEGORIES.map(c => categorySection(t, c)).join('\n    ')}
  </div>

  ${downloadCard(t, { title: t.catalog.ctaTitle, text: f(t.catalog.ctaText), button: t.download.button })}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: f(t.catalog.title),
      description: f(t.catalog.description),
      url: SITE + alternates[t.lang],
      inLanguage: t.htmlLang,
      about: { '@id': `${SITE}/#app` },
      mainEntity: {
        '@type': 'ItemList',
        name: t.catalog.guides,
        numberOfItems: PAIRS.length,
        itemListElement: PAIRS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + paths.convert(t, pairSlug(p)) })),
      },
    },
    crumbs.ld,
  ];

  return renderDocument({
    t, languages, assets, alternates, nav: 'formats',
    title: f(t.catalog.title), description: f(t.catalog.description),
    jsonLd, main,
  });
}
