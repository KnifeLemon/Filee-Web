// Conversion guides (/convert/heic-to-jpg/, /ko/convert/heic-to-jpg/, /pl/convert/heic-to-jpg/, …): one page per PAIRS entry and language.
// Every fact on the page (engine, options, format descriptions, other targets) comes from catalog.mjs; the sentence
// templates come from i18n/<lang>.json → convert.

import {
  CATEGORY, ENGINES, FORMATS, OPTIONS, PAIR, PAIRS, L, fill, label, pairSlug, particles, routeFor, sizeParen, sizeText, targetsOf, vars,
} from './catalog.mjs';
import {
  SITE, alternatesOf, breadcrumbs, downloadCard, engineBadge, escape, fileIcon, icon, pairLinks, paths, renderDocument,
} from './layout.mjs';

/** Pair-specific placeholders: {from}, {to}, Korean particles ({fromEul} → "HEIC를", {toRo} → "JPG로"), engine. */
export function pairVars(lang, pair) {
  const route = routeFor(pair.from, pair.to);
  const from = label(pair.from, lang), to = label(pair.to, lang);
  const pf = particles(pair.from), pt = particles(pair.to);
  const engine = ENGINES[route.engine];
  const size = engine ? sizeText(engine.sizeMB, lang) : '';
  return {
    from, to,
    fromEul: from + pf.eul, fromRo: from + pf.ro, fromEun: from + pf.eun, fromWa: from + pf.wa,
    toEul: to + pt.eul, toRo: to + pt.ro,
    engine: engine?.name ?? '', size, sizeParen: engine ? sizeParen(engine.sizeMB, lang) : '',
    category: L(CATEGORY[FORMATS[pair.from].cat].plain, lang),
  };
}

/** Title and description of a conversion page (also used by llms.txt). */
export function pairMeta(t, pair) {
  const route = routeFor(pair.from, pair.to);
  const v = { ...vars(t.lang), ...pairVars(t.lang, pair) };
  const c = t.convert;
  const engineShort = fill(route.engine === 'builtin' ? c.descBuiltIn : c.descOptional, v);
  return {
    title: fill(c.title, v),
    description: fill(c.description, { ...v, engineShort }),
    h1: fill(c.h1, v),
    lead: fill(c.lead, v),
  };
}

function aboutCard(t, id, v) {
  const f = FORMATS[id];
  const cat = CATEGORY[f.cat];
  return `<article class="about-card" data-reveal>
      <header>${fileIcon(id, t.lang)}<div><h3>${escape(label(id, t.lang))}</h3>${L(f.name, t.lang) === label(id, t.lang) ? '' : `<p class="muted">${escape(L(f.name, t.lang))}</p>`}</div></header>
      <p>${escape(L(f.about, t.lang))}</p>
      <p class="about-ext"><span>${escape(t.convert.aboutExt)}</span> ${f.ext.slice(0, 12).map(e => `<code>.${escape(e)}</code>`).join(' ')}${f.ext.length > 12 ? ' …' : ''}</p>
      <p class="more-link"><a href="${paths.formats(t)}#${cat.id}">${escape(fill(t.convert.aboutMore, { ...v, category: L(cat.plain, t.lang) }))} ${icon('arrow')}</a></p>
    </article>`;
}

/** Other targets of the source format, linked when a guide exists. */
function otherTargets(t, pair) {
  const items = targetsOf(pair.from).filter(x => x.to !== pair.to);
  if (!items.length) return '';
  const own = routeFor(pair.from, pair.to).engine;
  return `<ul class="fmt-list">${items.map(({ to, engine }) => {
    const slug = `${pair.from}-to-${to}`;
    // Name the engine only where it differs from this page's (every video target needs FFmpeg, for example).
    const text = label(to, t.lang) + (engine === 'builtin' || engine === own ? '' : ` · ${ENGINES[engine].name}`);
    return `<li>${PAIR[slug] ? `<a class="fmt fmt-link" href="${paths.convert(t, slug)}">${escape(text)}</a>` : `<span class="fmt">${escape(text)}</span>`}</li>`;
  }).join('')}</ul>`;
}

export function renderConvertPage(t, languages, assets, pair) {
  const slug = pairSlug(pair);
  const route = routeFor(pair.from, pair.to);
  const v = { ...vars(t.lang), ...pairVars(t.lang, pair) };
  const f = text => fill(text, v);
  const c = t.convert;
  const meta = pairMeta(t, pair);
  const alternates = alternatesOf(languages, l => paths.convert(l, slug));
  const url = SITE + alternates[t.lang];
  const crumbs = breadcrumbs(t, [
    { name: t.common.home, path: paths.home(t) },
    { name: t.catalog.crumb, path: paths.formats(t) },
    { name: f(c.crumb), path: alternates[t.lang] },
  ]);

  const steps = c.steps.map((s, i) => ({
    title: f(s.title),
    text: f(s.text) + (i === 0 && route.engine !== 'builtin' ? ` ${f(c.stepEngine)}` : ''),
  }));

  const points = [
    route.engine === 'builtin' ? f(c.points.builtIn) : f(c.points.optional),
    ...(route.via ? [f(fill(c.points.via, { via: route.via }))] : []),
    ...pair.options.map(key => L(OPTIONS[key].long, t.lang)),
    f(c.points.batch),
    f(c.points.local),
    f(c.points.output),
  ];

  const sameSource = PAIRS.filter(p => p !== pair && p.from === pair.from);
  const sameTarget = PAIRS.filter(p => p !== pair && p.to === pair.to && p.from !== pair.from).slice(0, 10);
  const sameCategory = PAIRS.filter(p => p !== pair && !sameSource.includes(p) && !sameTarget.includes(p)
    && FORMATS[p.from].cat === FORMATS[pair.from].cat).slice(0, 8);

  const main = `
  <section class="page-hero">
    <div class="page-hero-copy">
      ${crumbs.html}
      <p class="tags">${engineBadge(t, route.engine, ENGINES)}<span class="tag">${escape(t.common.free)}</span><span class="tag">${escape(t.common.offline)}</span><span class="tag">${escape(t.common.batch)}</span></p>
      <h1>${escape(meta.h1)}</h1>
      <p class="lead">${escape(meta.lead)}</p>
      <div class="cta">
        <a class="btn btn-primary btn-large" href="#download">${icon('windows')}<span>${escape(t.hero.download)}</span></a>
        <a class="btn btn-ghost btn-large" href="#how">${escape(c.howButton)}</a>
      </div>
    </div>
    <div class="pair-visual" aria-hidden="true">
      ${fileIcon(pair.from, t.lang, 'file-icon-lg')}
      <span class="pair-arrow">${icon('arrow')}</span>
      ${fileIcon(pair.to, t.lang, 'file-icon-lg')}
    </div>
  </section>

  <section class="section section-tight" id="how">
    <header class="section-head" data-reveal><h2>${escape(f(c.howTitle))}</h2></header>
    <ol class="steps">
      ${steps.map((s, i) => `<li class="step" id="step-${i + 1}" data-reveal style="--i:${i}"><span class="step-number">${i + 1}</span><h3>${escape(s.title)}</h3><p>${escape(s.text)}</p></li>`).join('')}
    </ol>
  </section>

  <section class="section section-tight" id="details">
    <div class="details-grid">
      <div class="details-copy" data-reveal>
        <h2>${escape(f(c.whatTitle))}</h2>
        <p class="tip">${escape(L(pair.tip, t.lang))}</p>
        <ul class="checks">${points.map(p => `<li>${icon('check')}<span>${escape(p)}</span></li>`).join('')}</ul>
      </div>
      <div class="details-side" data-reveal>
        <h3>${escape(f(c.alsoTo))}</h3>
        ${otherTargets(t, pair)}
      </div>
    </div>
  </section>

  <section class="section section-tight" id="about">
    <header class="section-head" data-reveal><h2>${escape(f(c.aboutTitle))}</h2></header>
    <div class="about-grid">
      ${aboutCard(t, pair.from, v)}
      ${aboutCard(t, pair.to, v)}
    </div>
  </section>

  <section class="section section-tight" id="related">
    <header class="section-head" data-reveal><h2>${escape(c.relatedTitle)}</h2></header>
    <div class="related" data-reveal>
      ${sameSource.length ? `<div><h3>${escape(f(c.sameSource))}</h3>${pairLinks(t, sameSource)}</div>` : ''}
      ${sameTarget.length ? `<div><h3>${escape(f(c.sameTarget))}</h3>${pairLinks(t, sameTarget)}</div>` : ''}
      ${sameCategory.length ? `<div><h3>${escape(f(c.sameCategory))}</h3>${pairLinks(t, sameCategory)}</div>` : ''}
      <p class="more-link"><a href="${paths.formats(t)}">${escape(f(t.formats.catalog))} ${icon('arrow')}</a></p>
    </div>
  </section>

  ${downloadCard(t, { title: f(c.ctaTitle), text: f(c.ctaText), button: t.download.button })}`;

  const howTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: f(c.howTitle),
    description: meta.lead,
    inLanguage: t.htmlLang,
    tool: [{ '@type': 'HowToTool', name: 'Filee' }],
    step: steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.title, text: s.text, url: `${url}#step-${i + 1}` })),
  };

  return renderDocument({
    t, languages, assets, alternates,
    title: meta.title, description: meta.description,
    jsonLd: [howTo, crumbs.ld],
    main,
  });
}
