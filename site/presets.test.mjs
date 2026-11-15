// Tests of the preset gallery: rankings (Hot, Best, New), index.json entries, the public index and the Worker's download
// counter. Run: node --test presets.test.mjs (npm run check runs it too).

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HOT, NO_STATS, presetStats, rank, utcDay } from './src/preset-stats.mjs';
import { readFileSync } from 'node:fs';
import { LANGUAGES } from './src/languages.mjs';
import { renderGalleryPage, renderPresetPage } from './src/presets-page.mjs';
import { checkEntry, checkWarnings, imagesFor, langKey, publicIndex, shownFor, thumbFor } from './src/presets.mjs';
import worker, { LIMIT, allow } from './worker/index.mjs';

const NOW = Date.parse('2026-11-15T12:00:00Z');
const hoursAgo = h => new Date(NOW - h * 3_600_000).toISOString();
const daysAgo = d => hoursAgo(d * 24);

test('a like weighs HOT.like now and half as much one half-life later', () => {
  const fresh = presetStats({ now: NOW, likes: [hoursAgo(0)] });
  const old = presetStats({ now: NOW, likes: [hoursAgo(HOT.halfLifeHours)] });
  assert.equal(fresh.hot, HOT.like);
  assert.equal(old.hot, HOT.like / 2);
});

test('downloads count per day from the middle of the day, with their own weight', () => {
  const today = utcDay(NOW); // NOW is midday, so today's downloads have age 0
  const s = presetStats({ now: NOW, downloads: { [today]: 4, '2026-11-12': 2 } });
  assert.equal(s.downloads, 6);
  assert.equal(s.hot, Math.round((4 * HOT.download + 2 * HOT.download * 0.5) * 10_000) / 10_000);
});

test('publication counts once, decaying like the rest', () => {
  assert.equal(presetStats({ now: NOW, created: hoursAgo(0) }).hot, HOT.created);
  assert.equal(presetStats({ now: NOW, created: hoursAgo(2 * HOT.halfLifeHours) }).hot, HOT.created / 4);
});

test('a date a little in the future counts as now, never more', () => {
  assert.equal(presetStats({ now: NOW, likes: [hoursAgo(-1)] }).hot, HOT.like);
});

test('Best counts the likes of each period', () => {
  const likes = [hoursAgo(1), daysAgo(3), daysAgo(20), daysAgo(200), daysAgo(800)];
  const s = presetStats({ now: NOW, likes });
  assert.deepEqual(s.best, { day: 1, week: 2, month: 3, year: 4, all: 5 });
  assert.equal(s.likes, 5);
});

test('totals reported by the sources win over what was read', () => {
  const s = presetStats({ now: NOW, likes: [hoursAgo(1)], likeTotal: 140, downloads: { '2026-11-15': 3 }, downloadTotal: 900, comments: 7 });
  assert.equal(s.likes, 140);
  assert.equal(s.best.all, 140);
  assert.equal(s.downloads, 900);
  assert.equal(s.comments, 7);
});

test('bad input is ignored, not thrown', () => {
  const s = presetStats({ now: NOW, likes: ['not a date'], downloads: { yesterday: 5, '2026-11-14': -1, '2026-11-13': 'x' } });
  assert.deepEqual(s, { ...NO_STATS, best: { ...NO_STATS.best } });
});

test('rank: Hot, Best of a period and New, with stable ties', () => {
  const p = (id, hot, week, all, downloads, created) => ({ id, created, stats: { hot, downloads, best: { day: 0, week, month: week, year: all, all } } });
  const presets = [
    p('a', 1, 5, 5, 10, '2026-11-01T00:00:00Z'),
    p('b', 9, 1, 50, 0, '2026-10-01T00:00:00Z'),
    p('c', 9, 1, 50, 3, '2026-11-10T00:00:00Z'),
    p('d', 0, 0, 0, 0, '2026-11-14T00:00:00Z'),
  ];
  assert.deepEqual(rank(presets, 'hot').map(x => x.id), ['c', 'b', 'a', 'd']);
  assert.deepEqual(rank(presets, 'best', 'week').map(x => x.id), ['a', 'c', 'b', 'd']);
  assert.deepEqual(rank(presets, 'best', 'all').map(x => x.id), ['c', 'b', 'a', 'd']);
  assert.deepEqual(rank(presets, 'new').map(x => x.id), ['d', 'c', 'a', 'b']);
  assert.equal(presets[0].id, 'a', 'rank returns a new array');
});

const ENTRY = {
  id: 'instagram-jpg', title: 'Instagram-ready JPG', description: 'Resizes photos to 1080 px for Instagram.', author: 'someone',
  tags: ['images', 'Social', 'social'], languages: ['en'], kinds: ['convert'], formats: { from: ['jpg', 'heic'], to: ['jpg'] },
  minVersion: '2.5.0', created: '2026-11-15T00:00:00Z', updated: '2026-11-15T00:00:00Z', discussion: 12, license: 'CC0-1.0',
  images: ['presets/instagram-jpg/images/1.webp'], thumb: 'presets/instagram-jpg/images/1-thumb.webp',
  preset: 'presets/instagram-jpg/preset.json', sha256: 'a'.repeat(64),
};

test('checkEntry keeps a good entry and cleans its lists', () => {
  const { entry, error } = checkEntry(ENTRY);
  assert.equal(error, undefined);
  assert.deepEqual(entry.tags, ['images', 'social']);
  assert.equal(entry.thumb, ENTRY.thumb);
});

test('checkEntry refuses paths outside the preset folder, reserved and bad ids', () => {
  const bad = patch => checkEntry({ ...ENTRY, ...patch }).error;
  assert.ok(bad({ id: 'files' }));
  assert.ok(bad({ id: 'Bad Id' }));
  assert.ok(bad({ preset: 'presets/other/preset.json' }));
  assert.ok(bad({ images: ['presets/instagram-jpg/../../x.webp'] }));
  assert.ok(bad({ images: ['https://example.com/x.webp'] }));
  assert.ok(bad({ author: 'not a login!' }));
  assert.ok(bad({ sha256: 'xyz' }));
  // A thumbnail elsewhere falls back to the cover.
  assert.equal(checkEntry({ ...ENTRY, thumb: '/etc/passwd.png' }).entry.thumb, ENTRY.images[0]);
});

test('publicIndex: paths relative to the index, a download link, no bundle', () => {
  const { entry } = checkEntry(ENTRY);
  const index = publicIndex({ generated: 'now', presets: [{ ...entry, bundle: { presets: [] }, stats: NO_STATS }] }, 'https://filee.sh');
  const [p] = index.presets;
  assert.equal(index.version, 1);
  assert.equal(p.preset, 'files/presets/instagram-jpg/preset.json');
  assert.equal(new URL(p.thumb, 'https://filee.sh/presets/index.json').href, 'https://filee.sh/presets/files/presets/instagram-jpg/images/1-thumb.webp');
  assert.equal(p.download, 'https://filee.sh/presets/download/instagram-jpg');
  assert.equal(p.bundle, undefined);
});

test('checkWarnings keeps known and unknown codes, drops bad ones, most serious first', () => {
  const warnings = checkWarnings([
    { code: 'strips_metadata', severity: 'info' },
    { code: 'replaces_original', severity: 'high' },
    { code: 'future_thing', severity: 'medium' },
    { code: 'replaces_original', severity: 'high' },
    { code: 'Bad Code', severity: 'high' },
    { code: 'no_severity' },
    { code: 'odd', severity: 'critical' },
  ]);
  assert.deepEqual(warnings, [
    { code: 'replaces_original', severity: 'high' },
    { code: 'future_thing', severity: 'medium' },
    { code: 'strips_metadata', severity: 'info' },
  ]);
  assert.deepEqual(checkWarnings('nope'), []);
  assert.deepEqual(checkEntry(ENTRY).entry.warnings, []);
});

/** Every language with its texts, as build.mjs loads them. */
const languages = LANGUAGES.map(l => ({ ...JSON.parse(readFileSync(new URL(`./i18n/${l.lang}.json`, import.meta.url), 'utf8')), ...l }));
const assets = { css: 'styles.css', js: 'main.js', gallery: 'gallery.js', supporters: { sponsors: [], backers: [] } };
const warned = warnings => ({ ...checkEntry({ ...ENTRY, warnings }).entry, bundle: { presets: [] }, stats: NO_STATS });

test('every language words every known warning code and every severity', () => {
  // The validator's codes (Filee-Presets; codes are only ever added, never renamed).
  const codes = ['replaces_original', 'moves_original', 'overwrites_existing', 'copies_to_folder', 'edits_metadata', 'fixed_edits', 'strips_metadata', 'uses_translate_model'];
  assert.deepEqual(Object.keys(languages[0].presets.warnings).sort(), [...codes].sort());
  for (const l of languages) {
    for (const code of codes) assert.ok(l.presets.warnings[code]?.trim(), `${l.lang}: ${code}`);
    for (const severity of ['high', 'medium', 'info']) assert.ok(l.presets.warnGeneric[severity]?.trim(), `${l.lang}: ${severity}`);
  }
});

test('a preset page shows its warnings above the install steps and the download link', () => {
  const html = renderPresetPage(languages[0], languages, assets, warned([{ code: 'replaces_original', severity: 'high' }, { code: 'brand_new', severity: 'info' }]));
  const box = html.indexOf('class="preset-warnings is-high"');
  assert.ok(box > 0, 'warning box');
  assert.ok(box < html.indexOf('id="install"') && box < html.indexOf('/presets/download/'), 'above install and download');
  assert.ok(html.includes(languages[0].presets.warnings.replaces_original));
  assert.ok(html.includes(languages[0].presets.warnGeneric.info), 'an unknown code is worded by its severity');
  const plain = renderPresetPage(languages[0], languages, assets, warned([]));
  assert.ok(!plain.includes('preset-warnings'), 'no box without warnings');
});

test('gallery cards badge high-severity presets only', () => {
  const gallery = presets => ({ presets: presets.map((p, i) => ({ ...p, id: `p${i}-x` })) });
  const high = renderGalleryPage(languages[0], languages, assets, gallery([warned([{ code: 'moves_original', severity: 'high' }])]));
  const medium = renderGalleryPage(languages[0], languages, assets, gallery([warned([{ code: 'edits_metadata', severity: 'medium' }])]));
  assert.ok(high.includes('class="preset-badge"'));
  assert.ok(!medium.includes('class="preset-badge"'));
});

test('per-language pictures: checked, mirrored paths rewritten, picked by the page language', () => {
  const dir = 'presets/instagram-jpg/images';
  const { entry } = checkEntry({
    ...ENTRY,
    // The Korean page uses the ko pictures only because the preset supports Korean (it has a Korean title).
    titleByLang: { ko: '인스타그램용 JPG' },
    imagesByLang: { ko: [`${dir}/ko/1.webp`, `${dir}/2.webp`], 'zh-CN': [`${dir}/zh-CN/1.webp`], pt: [`${dir}/pt/1.webp`], bad: [`${dir}/../../x.webp`], 'x y': [`${dir}/1.webp`] },
    thumbByLang: { ko: `${dir}/ko/1-thumb.webp`, ja: 'https://example.com/t.webp' },
  });
  assert.deepEqual(Object.keys(entry.imagesByLang), ['ko', 'zh-CN', 'pt']);
  assert.deepEqual(entry.thumbByLang, { ko: `${dir}/ko/1-thumb.webp` });
  assert.deepEqual(imagesFor(entry, 'ko'), [`${dir}/ko/1.webp`, `${dir}/2.webp`]);
  assert.deepEqual(imagesFor(entry, 'zh-CN'), [`${dir}/zh-CN/1.webp`]);
  assert.deepEqual(imagesFor(entry, 'pt-PT'), [`${dir}/pt/1.webp`], 'base language when no exact set');
  assert.deepEqual(imagesFor(entry, 'en'), entry.images, 'default set otherwise');
  assert.equal(thumbFor(entry, 'ko'), `${dir}/ko/1-thumb.webp`);
  assert.equal(thumbFor(entry, 'ja'), entry.thumb);
  assert.equal(langKey({ 'BN-bd': [] }, 'bn-BD'), 'BN-bd', 'codes match without regard to case');

  const [p] = publicIndex({ generated: 'now', presets: [{ ...entry, bundle: {}, stats: NO_STATS }] }, 'https://filee.sh').presets;
  assert.deepEqual(p.imagesByLang.ko, [`files/${dir}/ko/1.webp`, `files/${dir}/2.webp`]);
  assert.equal(p.thumbByLang.ko, `files/${dir}/ko/1-thumb.webp`);

  const preset = { ...entry, bundle: { presets: [] }, stats: NO_STATS };
  const ko = languages.find(l => l.lang === 'ko');
  const koPage = renderPresetPage(ko, languages, assets, preset);
  assert.ok(koPage.includes(`/presets/files/${dir}/ko/1.webp`));
  assert.ok(!koPage.includes(`/presets/files/${dir}/1.webp"`), 'not the default cover on the Korean page');
  const enPage = renderPresetPage(languages[0], languages, assets, preset);
  assert.ok(enPage.includes(`/presets/files/${dir}/1.webp`) && !enPage.includes(`${dir}/ko/`));
  const koGallery = renderGalleryPage(ko, languages, assets, { presets: [preset] });
  assert.ok(koGallery.includes(`/presets/files/${dir}/ko/1-thumb.webp`));
});

test('language fields: main language, translations and the supported languages', () => {
  const { entry } = checkEntry({ ...ENTRY, language: 'en', titleByLang: { ko: '인스타그램용 JPG', ja: '', 'x y': 'bad', en: 'same as main' }, descriptionByLang: { ko: '사진을 1080px로 줄여요.' } });
  assert.equal(entry.language, 'en');
  assert.deepEqual(entry.titleByLang, { ko: '인스타그램용 JPG' });
  assert.deepEqual(entry.languages, ['en', 'ko']);
  // Old entries: languages[0] is the main language.
  assert.equal(checkEntry({ ...ENTRY, languages: ['ja'] }).entry.language, 'ja');
  assert.equal(checkEntry({ ...ENTRY, languages: undefined }).entry.language, 'en');
});

test('shownFor: translated texts when supported, main texts and default pictures otherwise', () => {
  const dir = 'presets/instagram-jpg/images';
  const { entry } = checkEntry({
    ...ENTRY, language: 'en',
    titleByLang: { ko: '인스타그램용 JPG', pt: 'JPG para Instagram' }, descriptionByLang: { ko: '사진을 1080px로 줄여요.' },
    imagesByLang: { ko: [`${dir}/ko/1.webp`], ja: [`${dir}/ja/1.webp`] },
  });
  const ko = shownFor(entry, 'ko');
  assert.deepEqual([ko.supported, ko.lang, ko.title, ko.description, ko.images[0]], [true, 'ko', '인스타그램용 JPG', '사진을 1080px로 줄여요.', `${dir}/ko/1.webp`]);
  const ptPT = shownFor(entry, 'pt-PT');
  assert.deepEqual([ptPT.supported, ptPT.title, ptPT.description, ptPT.descriptionLang], [true, 'JPG para Instagram', ENTRY.description, 'en'], 'base language; description falls back to the main one');
  const ja = shownFor(entry, 'ja');
  assert.deepEqual([ja.supported, ja.lang, ja.title, ja.images], [false, 'en', ENTRY.title, entry.images], 'not supported: main texts and default pictures, even with a ja picture set');
  assert.equal(shownFor(entry, 'en').supported, true);
});

test('rank puts the presets that pass first ahead in every sort', () => {
  const p = (id, hot, ok) => ({ id, created: '2026-11-01T00:00:00Z', ok, stats: { hot, downloads: 0, best: { all: hot } } });
  const list = [p('a', 9, false), p('b', 1, true), p('c', 5, true)];
  assert.deepEqual(rank(list, 'hot', 'all', x => x.ok).map(x => x.id), ['c', 'b', 'a']);
  assert.deepEqual(rank(list, 'best', 'all', x => x.ok).map(x => x.id), ['c', 'b', 'a']);
  assert.deepEqual(rank(list, 'hot').map(x => x.id), ['a', 'c', 'b'], 'without it, by score only');
});

test('pages: translated title in its language, otherwise the main text with a language badge; supported first', () => {
  const make = (id, hot, patch) => ({ ...checkEntry({ ...ENTRY, language: 'en', ...patch }).entry, id, bundle: { presets: [] }, stats: { ...NO_STATS, hot } });
  const translated = make('translated-one', 1, { titleByLang: { ko: '번역된 프리셋' } });
  const english = make('english-only', 9, {});
  const ko = languages.find(l => l.lang === 'ko');

  const koPage = renderPresetPage(ko, languages, assets, translated);
  assert.ok(koPage.includes('<h1>번역된 프리셋</h1>'));
  assert.ok(!koPage.includes('class="preset-lang'), 'no badge when supported');
  assert.ok(koPage.includes('<title>번역된 프리셋'), 'title tag in the page language');

  const otherPage = renderPresetPage(ko, languages, assets, english);
  assert.ok(otherPage.includes(`<h1 lang="en">${ENTRY.title}</h1>`));
  assert.match(otherPage, /class="preset-lang preset-lang-hero" lang="en">.*<span>English<\/span>/);
  assert.ok(otherPage.includes('"inLanguage":"en"'));

  const gallery = renderGalleryPage(ko, languages, assets, { presets: [english, translated] });
  assert.ok(gallery.indexOf('data-id="translated-one"') < gallery.indexOf('data-id="english-only"'), 'supported first despite a lower score');
  assert.ok(gallery.includes('data-only-mine'), 'the "Only in my language" toggle');
  assert.ok(!gallery.includes('data-filter="langs"'), 'no language filter any more');
  assert.match(gallery, /data-id="english-only"[^>]*data-supported="0"/);
  assert.ok(gallery.includes(`data-search="${ENTRY.title.toLowerCase()}`) || gallery.toLowerCase().includes(ENTRY.title.toLowerCase()));
  const en = renderGalleryPage(languages[0], languages, assets, { presets: [english, translated] });
  assert.ok(!en.includes('class="preset-lang"'), 'English pages need no badge for English presets');
});

/* ───────── Worker ───────── */

test('allow caps counting per preset per minute', () => {
  const seen = new Map();
  for (let i = 0; i < LIMIT; i++) assert.equal(allow('x', NOW, seen), true);
  assert.equal(allow('x', NOW, seen), false);
  assert.equal(allow('y', NOW, seen), true, 'other presets have their own cap');
  assert.equal(allow('x', NOW + 60_000, seen), true, 'the next minute counts again');
});

function fakeEnv({ files = { '/presets/files/presets/instagram-jpg/preset.json': '{"presets":[]}' } } = {}) {
  const runs = [];
  const assets = [];
  const env = {
    ASSETS: {
      async fetch(request) {
        const path = new URL(request.url).pathname;
        assets.push(path);
        return path in files ? new Response(files[path], { status: 200 }) : new Response('<h1>404</h1>', { status: 404 });
      },
    },
    DB: { prepare: sql => ({ bind: (...args) => ({ run: async () => runs.push([sql, args]) }), run: async () => runs.push([sql, []]) }) },
  };
  const waits = [];
  const ctx = { waitUntil: promise => waits.push(promise) };
  return { env, ctx, runs, assets, settle: () => Promise.all(waits) };
}

test('Worker: a download serves the file and counts one for today', async () => {
  const { env, ctx, runs, settle } = fakeEnv();
  const response = await worker.fetch(new Request('https://filee.sh/presets/download/instagram-jpg'), env, ctx);
  await settle();
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '{"presets":[]}');
  assert.match(response.headers.get('Content-Disposition'), /attachment; filename="instagram-jpg.json"/);
  const insert = runs.find(([sql]) => sql.startsWith('INSERT'));
  assert.ok(insert, 'counted');
  assert.equal(insert[1][0], 'instagram-jpg');
  assert.match(insert[1][1], /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(insert[1].length, 2, 'nothing about the visitor is stored');
});

test('Worker: unknown presets get the 404 page and are not counted', async () => {
  const { env, ctx, runs, settle } = fakeEnv();
  const response = await worker.fetch(new Request('https://filee.sh/presets/download/no-such-preset'), env, ctx);
  await settle();
  assert.equal(response.status, 404);
  assert.equal(runs.length, 0);
});

test('Worker: HEAD is served without counting; POST is refused; other paths go to the assets', async () => {
  const { env, ctx, runs, assets, settle } = fakeEnv();
  assert.equal((await worker.fetch(new Request('https://filee.sh/presets/download/instagram-jpg', { method: 'HEAD' }), env, ctx)).status, 200);
  assert.equal((await worker.fetch(new Request('https://filee.sh/presets/download/instagram-jpg', { method: 'POST' }), env, ctx)).status, 405);
  await worker.fetch(new Request('https://filee.sh/presets/download/../../etc'), env, ctx);
  await worker.fetch(new Request('https://filee.sh/formats/'), env, ctx);
  await settle();
  assert.equal(runs.length, 0);
  assert.ok(assets.includes('/formats/'));
});

test('Worker: without a D1 binding the download still works', async () => {
  const { env, ctx } = fakeEnv();
  delete env.DB;
  const response = await worker.fetch(new Request('https://filee.sh/presets/download/instagram-jpg'), env, ctx);
  assert.equal(response.status, 200);
});
