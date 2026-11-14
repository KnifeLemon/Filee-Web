// Rankings of the preset gallery, computed at build time from the likes (👍 reactions on each preset's GitHub
// discussion, with their dates) and the download counters (one count per preset per day, kept by the Worker).
// Pure functions, no I/O: presets.test.mjs runs them.
//
// Hot is a time-decayed score: every like and every download counts with a weight that halves every
// HOT.halfLifeHours, and the preset's publication counts once as a few likes, so a new preset shows up near the top
// for a few days before it has to earn its place:
//
//   hot = Σ likes      HOT.like     · 2^(−age / halfLife)
//       + Σ days  n_d · HOT.download · 2^(−age_d / halfLife)      (age_d: from the middle of that UTC day)
//       +             HOT.created  · 2^(−age_created / halfLife)
//
// A like weighs more than a download: it is a deliberate vote, while downloads are cheap to repeat. Ages are never
// negative (a clock a little ahead counts as "now").
// Best is the number of likes received in the last day / 7 days / 30 days / 365 days / ever.

export const HOT = { halfLifeHours: 72, like: 5, download: 1, created: 3 };
export const PERIODS = { day: 1, week: 7, month: 30, year: 365 };

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const time = value => {
  const t = typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(t) ? t : null;
};
const decay = (now, at) => 2 ** (-Math.max(0, now - at) / (HOT.halfLifeHours * HOUR));
const round = n => Math.round(n * 10_000) / 10_000;

/** 'YYYY-MM-DD' of a time, in UTC (the Worker's counter days). */
export const utcDay = t => new Date(t).toISOString().slice(0, 10);

/**
 * The stats of one preset.
 * likes: the creation dates (ISO strings) of its 👍 reactions; likeTotal: their total count when GitHub reported more
 * than were read (defaults to likes.length). comments: the discussion's comment count. downloads: { 'YYYY-MM-DD': n }
 * per UTC day (any period); downloadTotal: the all-time total when known (defaults to the sum of downloads).
 */
export function presetStats({ now, created, likes = [], likeTotal, comments = 0, downloads = {}, downloadTotal }) {
  const at = time(now) ?? Date.now();
  const likeTimes = likes.map(time).filter(t => t != null);
  const days = Object.entries(downloads)
    .filter(([day, n]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(n) && n > 0)
    .map(([day, n]) => [Date.parse(`${day}T12:00:00Z`), n]);
  let hot = likeTimes.reduce((sum, t) => sum + HOT.like * decay(at, t), 0)
    + days.reduce((sum, [t, n]) => sum + n * HOT.download * decay(at, t), 0);
  const published = time(created);
  if (published != null) hot += HOT.created * decay(at, published);
  const within = days => likeTimes.filter(t => t > at - days * DAY && t <= at + HOUR).length;
  const all = Math.max(likeTotal ?? 0, likeTimes.length);
  return {
    likes: all,
    comments: Math.max(0, Math.trunc(comments) || 0),
    downloads: Math.max(downloadTotal ?? 0, days.reduce((sum, [, n]) => sum + n, 0)),
    hot: round(hot),
    best: { ...Object.fromEntries(Object.entries(PERIODS).map(([name, length]) => [name, within(length)])), all },
  };
}

/** Zero stats, for a preset whose likes and downloads couldn't be read. */
export const NO_STATS = Object.freeze({ likes: 0, comments: 0, downloads: 0, hot: 0, best: { day: 0, week: 0, month: 0, year: 0, all: 0 } });

/**
 * Sorts presets (each with stats and created) for a tab: 'hot', 'new', or 'best' with a period. Ties fall back to
 * downloads, then to the newer preset, then to the id, so the order is stable. Returns a new array.
 */
export function rank(presets, sort = 'hot', period = 'all') {
  const created = p => time(p.created) ?? 0;
  const key = {
    hot: p => [p.stats.hot, p.stats.downloads],
    best: p => [p.stats.best[period] ?? 0, p.stats.downloads],
    new: () => [],
  }[sort] ?? (p => [p.stats.hot]);
  return [...presets].sort((a, b) => {
    const ka = key(a), kb = key(b);
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i];
    return created(b) - created(a) || a.id.localeCompare(b.id);
  });
}
