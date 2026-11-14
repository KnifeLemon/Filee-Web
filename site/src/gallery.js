// The preset gallery's tabs, filters and search (/presets/ only; presets-page.mjs adds this script there). The cards
// are rendered in Hot order with their numbers in data-* attributes; this sorts and filters them in place, with the
// same ranking as the build (preset-stats.mjs), and keeps the choice in the address (?sort=best&period=week&q=…),
// so a filtered view can be shared. Without JavaScript the tools stay hidden and the list stays in Hot order.

import { rank } from './preset-stats.mjs';

const root = document.querySelector('[data-gallery-root]');
const list = root?.querySelector('[data-gallery]');

if (root && list) {
  const tools = root.querySelector('[data-gallery-tools]');
  const sortButtons = [...root.querySelectorAll('[data-sort]')];
  const periodField = root.querySelector('[data-period-field]');
  const period = root.querySelector('[data-period]');
  const search = root.querySelector('[data-search]');
  const filters = [...root.querySelectorAll('[data-filter]')];
  const clear = root.querySelector('[data-clear]');
  const count = root.querySelector('[data-count]');
  const noMatch = root.querySelector('[data-no-match]');
  const PERIODS = ['day', 'week', 'month', 'year', 'all'];
  const plural = new Intl.PluralRules(document.documentElement.lang);

  const cards = [...list.children].map(el => {
    const d = el.dataset;
    const best = d.best.split(',').map(Number);
    return {
      el, id: d.id, created: d.created,
      stats: { hot: Number(d.hot), downloads: Number(d.downloads), best: Object.fromEntries(PERIODS.map((p, i) => [p, best[i] || 0])) },
      words: { kinds: d.kinds.split(' '), formats: d.formats.split(' '), tags: d.tags.split(' '), langs: d.langs.split(' ') },
      search: d.search,
    };
  });

  /** "{n|one:# preset|other:# presets}" for n, by the page language's plural rules. */
  const countText = n => count.dataset.template.replace(/\{n\|([^{}]*)\}/, (_, spec) => {
    const forms = Object.fromEntries(spec.split('|').map(part => [part.slice(0, part.indexOf(':')), part.slice(part.indexOf(':') + 1)]));
    return (forms[plural.select(n)] ?? forms.other).replaceAll('#', n);
  });

  const state = { sort: 'hot', period: 'week', q: '', kinds: '', formats: '', tags: '', langs: '' };
  const params = new URLSearchParams(location.search);
  if (['hot', 'best', 'new'].includes(params.get('sort'))) state.sort = params.get('sort');
  if (PERIODS.includes(params.get('period'))) state.period = params.get('period');
  state.q = (params.get('q') ?? '').slice(0, 100);
  for (const select of filters) {
    const value = params.get(select.dataset.filter) ?? '';
    if ([...select.options].some(o => o.value === value)) state[select.dataset.filter] = value;
  }

  function apply({ remember = true } = {}) {
    for (const b of sortButtons) b.setAttribute('aria-pressed', String(b.dataset.sort === state.sort));
    periodField.hidden = state.sort !== 'best';
    period.value = state.period;
    search.value = state.q;
    for (const select of filters) select.value = state[select.dataset.filter];

    const terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    const shown = cards.filter(c => terms.every(term => c.search.includes(term))
      && filters.every(s => !state[s.dataset.filter] || c.words[s.dataset.filter].includes(state[s.dataset.filter])));
    const order = rank(shown, state.sort, state.period);
    const hidden = new Set(cards);
    for (const c of order) { hidden.delete(c); c.el.hidden = false; list.append(c.el); }
    for (const c of hidden) c.el.hidden = true;

    count.textContent = countText(order.length);
    noMatch.hidden = order.length > 0;
    clear.hidden = !state.q && filters.every(s => !state[s.dataset.filter]);

    if (remember) {
      const query = new URLSearchParams();
      if (state.sort !== 'hot') query.set('sort', state.sort);
      if (state.sort === 'best' && state.period !== 'week') query.set('period', state.period);
      if (state.q) query.set('q', state.q);
      for (const s of filters) if (state[s.dataset.filter]) query.set(s.dataset.filter, state[s.dataset.filter]);
      const next = `${location.pathname}${query.toString() ? `?${query}` : ''}${location.hash}`;
      if (next !== `${location.pathname}${location.search}${location.hash}`) history.replaceState(null, '', next);
    }
  }

  for (const b of sortButtons) b.addEventListener('click', () => { state.sort = b.dataset.sort; apply(); });
  period.addEventListener('change', () => { state.period = period.value; apply(); });
  let typing;
  search.addEventListener('input', () => {
    clearTimeout(typing);
    typing = setTimeout(() => { state.q = search.value.slice(0, 100); apply(); }, 120);
  });
  for (const select of filters) select.addEventListener('change', () => { state[select.dataset.filter] = select.value; apply(); });
  clear.addEventListener('click', () => {
    state.q = '';
    for (const s of filters) state[s.dataset.filter] = '';
    apply();
    search.focus();
  });

  tools.hidden = false;
  apply({ remember: false });
}
