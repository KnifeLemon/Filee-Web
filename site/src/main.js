// filee.sh interactions: the drag & drop demo (home page), scroll reveals, lazy video, the feature showcase, GitHub
// release info and the real installer link, the language suggestion and card tilt. No dependencies but GSAP, which
// only the showcase loads (vendor/, see build.mjs); without JavaScript every page is still complete and readable,
// and download buttons lead to the latest release page.

import { DOWNLOAD_TARGETS, downloadChoice, releaseSummary } from './downloads.mjs';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const readJson = id => {
  const node = document.getElementById(id);
  try { return node ? JSON.parse(node.textContent) : null; } catch { return null; }
};
/** Demo files and donuts (home page only). */
const data = readJson('demo-data');
/** This page's language and its address in every language. */
const page = readJson('page-data') ?? { lang: document.documentElement.lang, langs: [] };

/* ───────── Drag & drop demo ───────── */

const SVG = 'http://www.w3.org/2000/svg';
const VIEW = 220;                 // viewBox size of the donut
const R_OUT = 96, R_IN = 40;      // ring radii in viewBox units
const R_LABEL = (R_OUT + R_IN) / 2;
const POP = 7;                    // how far a hovered segment moves outwards
const DRAG_THRESHOLD = 6;         // px before a press becomes a drag (like SM_CXDRAG)

function svg(tag, attrs, parent) {
  const node = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  parent?.append(node);
  return node;
}

/** Annular sector between angles a0 and a1 (radians, clockwise from 3 o'clock). */
function sectorPath(a0, a1) {
  const point = (r, a) => `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${point(R_OUT, a0)}A${R_OUT} ${R_OUT} 0 ${large} 1 ${point(R_OUT, a1)}`
    + `L${point(R_IN, a1)}A${R_IN} ${R_IN} 0 ${large} 0 ${point(R_IN, a0)}Z`;
}

/** Rough text width in em: CJK glyphs are square, Latin ones about half as wide. */
const emWidth = text => [...text].reduce((w, ch) =>
  w + (/[ᄀ-ᇿ⺀-鿿가-힯＀-￯]/.test(ch) ? 1 : ch === ' ' ? 0.3 : 0.56), 0);

/** Splits text into one or two balanced lines that fit maxEm (words for spaced scripts, glyphs for Chinese). */
function balanceLines(text, maxEm) {
  if (emWidth(text) <= maxEm) return [text];
  const spaced = text.includes(' ');
  const parts = spaced ? text.split(' ') : [...text];
  const join = list => list.join(spaced ? ' ' : '');
  let best = [text], bestWidth = Infinity;
  for (let k = 1; k < parts.length; k++) {
    const lines = [join(parts.slice(0, k)), join(parts.slice(k))];
    const width = Math.max(...lines.map(emWidth));
    if (width < bestWidth) { best = lines; bestWidth = width; }
  }
  return best;
}

/** The radial menu: equal segments around a hole, the first one centred at 12 o'clock (same maths as the app). */
class Donut {
  constructor(host) {
    this.host = host;
    this.node = Object.assign(document.createElement('div'), { className: 'donut' });
    this.node.setAttribute('aria-hidden', 'true');
    this.svg = svg('svg', { viewBox: `${-VIEW / 2} ${-VIEW / 2} ${VIEW} ${VIEW}` }, this.node);
    host.append(this.node);
    this.segments = [];
  }

  build(profile) {
    const formats = data.donuts[profile];
    const span = (2 * Math.PI) / formats.length;
    this.svg.replaceChildren();
    svg('circle', { class: 'backing', r: R_OUT - 1 }, this.svg); // nothing underneath shows through the seams
    this.segments = formats.map(([label, sub], i) => {
      const mid = -Math.PI / 2 + i * span;
      const group = svg('g', { class: 'seg' }, this.svg);
      group.style.setProperty('--dx', `${(Math.cos(mid) * POP).toFixed(2)}px`);
      group.style.setProperty('--dy', `${(Math.sin(mid) * POP).toFixed(2)}px`);
      svg('path', { d: sectorPath(mid - span / 2, mid + span / 2) }, group);
      const x = (Math.cos(mid) * R_LABEL).toFixed(2), y = Math.sin(mid) * R_LABEL;
      svg('text', { x, y: (sub ? y - 4.5 : y).toFixed(2) }, group).textContent = label;
      if (sub) svg('text', { x, y: (y + 7).toFixed(2), class: 'sub' }, group).textContent = sub;
      return { label, full: sub ? `${label} ${sub}` : label, ext: label.toLowerCase(), group };
    });
    svg('circle', { class: 'hub', r: R_IN - 3 }, this.svg);
    this.title = svg('text', { class: 'hub-title' }, this.svg);
    this.title.textContent = data.center[profile];
    this.hint = svg('text', { class: 'hub-hint' }, this.svg);
    this.setHint(data.close);
  }

  setHint(text) {
    const lines = balanceLines(text, 9);
    this.title.setAttribute('y', lines.length > 1 ? -5 : -2);
    this.hint.replaceChildren(...lines.map((line, i) => {
      const span = svg('tspan', { x: 0, y: (lines.length > 1 ? 7 : 10) + i * 8 });
      span.textContent = line;
      return span;
    }));
  }

  highlight(index) {
    this.segments.forEach((s, i) => s.group.classList.toggle('is-hover', i === index));
    this.setHint(index >= 0 ? `→ ${this.segments[index].full}` : data.close);
  }

  /** Opens centred on client point (x, y), kept inside the viewport horizontally. */
  openAt(x, y) {
    clearTimeout(this.closing);
    const box = this.host.getBoundingClientRect();
    const half = this.node.offsetWidth / 2;
    const cx = Math.min(Math.max(x, half + 8), innerWidth - half - 8);
    this.local = { x: cx - box.left, y: y - box.top };
    this.node.style.left = `${this.local.x}px`;
    this.node.style.top = `${this.local.y}px`;
    this.node.classList.remove('is-collapsing', 'is-open');
    void this.node.offsetWidth; // restart the pop-in transition
    this.node.classList.add('is-open');
  }

  close(animated) {
    const node = this.node;
    if (!node.classList.contains('is-open')) return;
    if (!animated || reduceMotion) { node.classList.remove('is-open', 'is-collapsing'); return; }
    node.classList.add('is-collapsing');
    this.closing = setTimeout(() => node.classList.remove('is-open', 'is-collapsing'), 360);
  }

  get isOpen() { return this.node.classList.contains('is-open') && !this.node.classList.contains('is-collapsing'); }

  center() {
    const r = this.node.getBoundingClientRect(); // scaling happens around the centre, so this is stable mid-animation
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  get scale() { return this.node.offsetWidth / VIEW; }

  /** Segment index under client point (x, y); -1 for the hole (cancel) and far outside the ring. */
  hitTest(x, y) {
    if (!this.isOpen) return -1;
    const c = this.center();
    const dx = (x - c.x) / this.scale, dy = (y - c.y) / this.scale;
    const dist = Math.hypot(dx, dy);
    if (dist < R_IN || dist > R_OUT + 36) return -1;
    const n = this.segments.length, span = (2 * Math.PI) / n;
    return ((Math.round((Math.atan2(dy, dx) + Math.PI / 2) / span) % n) + n) % n;
  }

  /** Demo-local position of segment i's label (used by the autoplay). */
  segmentPoint(i) {
    const n = this.segments.length, a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return { x: this.local.x + Math.cos(a) * R_LABEL * this.scale, y: this.local.y + Math.sin(a) * R_LABEL * this.scale };
  }
}

const CURSOR = '<svg class="cursor" viewBox="0 0 24 24"><path d="M5 2.5v17l4.4-4.1 2.9 6.6 3-1.3-2.9-6.5 6.1-.4z" fill="#fff" stroke="#1c1b22" stroke-width="1.4" stroke-linejoin="round"/></svg>';

function setupDemo() {
  const demo = document.querySelector('[data-demo]');
  if (!demo || !data) return;
  const files = [...demo.querySelectorAll('.file')];
  const results = demo.querySelector('.demo-results');
  const hint = demo.querySelector('[data-hint]');
  if (matchMedia('(pointer: coarse)').matches) {
    hint.textContent = data.hintTouch;
    demo.classList.add('is-touch');
  }
  const hintText = hint.textContent;
  const status = Object.assign(document.createElement('p'), { className: 'sr-only' });
  status.setAttribute('role', 'status');
  demo.append(status);

  const donut = new Donut(demo);
  const produced = new Set();
  let session = null;   // { index, mode: 'drag' | 'click' | 'keys', hover, auto }
  let pending = null;   // a press that hasn't moved far enough to be a drag yet
  let ghost = null;
  let suppressClick = false;
  let swallowClicksUntil = 0;
  let hintTimer = 0;
  let auto = null;
  let touched = false;

  const flashHint = text => {
    hint.textContent = text;
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => { hint.textContent = hintText; }, 1500);
  };

  const setHover = index => {
    if (!session || session.hover === index) return;
    session.hover = index;
    donut.highlight(index);
    if (session.mode === 'keys') status.textContent = index >= 0 ? donut.segments[index].full : data.close;
  };

  function createGhost(button, withCursor = false) {
    const node = Object.assign(document.createElement('div'), { className: 'ghost' });
    node.setAttribute('aria-hidden', 'true');
    node.append(button.querySelector('.file-icon').cloneNode(true));
    if (withCursor) node.insertAdjacentHTML('beforeend', CURSOR);
    document.body.append(node);
    return node;
  }

  const moveGhost = (x, y) => { if (ghost) ghost.style.translate = `${x}px ${y}px`; };

  function open(index, x, y, mode) {
    close(false);
    session = { index, mode, hover: -1, auto: false };
    donut.build(data.files[index].profile);
    donut.openAt(x, y);
    files[index].classList.toggle('is-dragging', mode === 'drag');
    demo.classList.toggle('is-dragging', mode === 'drag');
  }

  function close(animated) {
    if (!session) return;
    files[session.index].classList.remove('is-dragging');
    demo.classList.remove('is-dragging');
    donut.close(animated);
    ghost?.remove();
    ghost = null;
    session = null;
  }

  /** Release: convert when over a segment, cancel anywhere else (the hole, outside the ring). */
  function finish(x, y) {
    if (!session) return;
    const { index, hover } = session;
    const target = hover >= 0 ? donut.segments[hover] : null;
    const at = x === undefined ? donut.center() : { x, y };
    close(true);
    if (target) convert(index, target, at.x, at.y);
    else flashHint(data.cancelled);
  }

  function convert(index, target, x, y) {
    const source = data.files[index].name;
    const base = source.replace(/\.[^.]+$/, '');
    let name = `${base}.${target.ext}`;
    for (let n = 1; produced.has(name) || name === source; n++) name = `${base} (${n}).${target.ext}`;
    produced.add(name);
    progressRing(demo, x, y).then(() => {
      results.querySelector('.demo-empty')?.remove();
      const item = document.createElement('li');
      const badge = document.createElement('b');
      badge.dataset.type = target.ext;
      badge.textContent = target.label;
      item.append(badge, name);
      results.append(item);
      while (results.children.length > 6) results.firstElementChild.remove();
      status.textContent = `${data.done}: ${name}`;
    });
  }

  // Pointer: press, move past the threshold → drag with a ghost; release over a segment → convert.
  files.forEach((button, index) => {
    button.addEventListener('pointerdown', e => {
      stopAuto();
      suppressClick = false;
      if (e.button !== 0 || session) return;
      pending = { index, id: e.pointerId, x: e.clientX, y: e.clientY };
      button.setPointerCapture(e.pointerId);
    });
    button.addEventListener('pointermove', e => {
      if (pending?.id !== e.pointerId) return;
      if (!session) {
        if (Math.hypot(e.clientX - pending.x, e.clientY - pending.y) < DRAG_THRESHOLD) return;
        open(pending.index, e.clientX, e.clientY, 'drag');
        ghost = createGhost(button);
      }
      moveGhost(e.clientX, e.clientY);
      setHover(donut.hitTest(e.clientX, e.clientY));
    });
    const release = e => {
      if (pending?.id !== e.pointerId) return;
      pending = null;
      if (session?.mode !== 'drag') return;
      if (e.type === 'pointercancel') { close(true); return; }
      suppressClick = true;
      finish(e.clientX, e.clientY);
    };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);

    // A click (or Enter/Space) opens the donut in click mode, like the app's shortcut entry point.
    button.addEventListener('click', e => {
      if (suppressClick || performance.now() < swallowClicksUntil) { suppressClick = false; return; }
      stopAuto();
      const r = button.getBoundingClientRect();
      const keys = e.detail === 0;
      open(index, r.left + r.width / 2, r.top + r.height / 2, keys ? 'keys' : 'click');
      if (keys) setHover(0);
    });
  });

  // Click mode: hovering picks, the next press converts or cancels. Touch has no hover, so the press position decides.
  document.addEventListener('pointermove', e => {
    if (session?.mode === 'click') setHover(donut.hitTest(e.clientX, e.clientY));
  });
  document.addEventListener('pointerdown', e => {
    if (!session || session.mode === 'drag') return;
    e.stopPropagation(); // don't let the press also start a drag on a file under the donut
    swallowClicksUntil = performance.now() + 600;
    setHover(donut.hitTest(e.clientX, e.clientY));
    finish(e.clientX, e.clientY);
  }, true);

  document.addEventListener('keydown', e => {
    if (!session || session.auto) return;
    if (e.key === 'Escape') { e.preventDefault(); close(true); flashHint(data.cancelled); return; }
    if (session.mode === 'drag') return;
    const n = donut.segments.length;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setHover((session.hover + 1) % n); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setHover(session.hover <= 0 ? n - 1 : session.hover - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finish(); }
    else if (e.key === 'Tab') close(false);
  });

  // Autoplay once when the demo first comes into view, until the visitor touches it.
  demo.addEventListener('pointerdown', () => { touched = true; stopAuto(); }, true);
  demo.addEventListener('focusin', () => { touched = true; stopAuto(); });

  function stopAuto() {
    if (!auto) return;
    auto.stopped = true;
    auto = null;
    if (session?.auto) close(false);
  }

  async function autoplay() {
    const token = auto = { stopped: false };
    const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
    const wait = async ms => {
      const end = performance.now() + ms;
      while (performance.now() < end) { await frame(); if (token.stopped) throw token; }
    };
    const toClient = p => { const r = demo.getBoundingClientRect(); return { x: r.left + p.x, y: r.top + p.y }; };
    const file = files[0].getBoundingClientRect(), box = demo.getBoundingClientRect();
    let at = { x: file.left - box.left + file.width / 2, y: file.top - box.top + file.height * 0.4 };
    // Positions are demo-local so the path survives scrolling mid-animation.
    const glide = async (to, ms) => {
      const from = at, start = performance.now();
      for (;;) {
        await frame();
        if (token.stopped) throw token;
        const p = Math.min(1, (performance.now() - start) / ms), e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
        at = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e };
        const c = toClient(at);
        moveGhost(c.x, c.y);
        if (session) setHover(donut.hitTest(c.x, c.y));
        if (p === 1) return;
      }
    };
    try {
      const start = toClient(at);
      open(0, start.x, start.y, 'drag');
      session.auto = true;
      donut.node.classList.remove('is-open'); // appear on the first move, like a real drag
      ghost = createGhost(files[0], true);
      moveGhost(start.x, start.y);
      await wait(350);
      at = { x: at.x + 18, y: at.y + 22 };
      const opened = toClient(at);
      donut.openAt(opened.x, opened.y);
      await wait(450);
      await glide(donut.segmentPoint(1), 650);
      await wait(260);
      await glide(donut.segmentPoint(0), 520);
      await wait(520);
      const drop = toClient(at);
      session.auto = false;
      finish(drop.x, drop.y);
      auto = null;
    } catch (error) {
      if (error !== token) throw error;
    }
  }

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      setTimeout(() => { if (!touched && !session) autoplay(); }, 1300);
    }, { threshold: 0.6 });
    io.observe(demo);
  }
}

/** Progress ring at client point (x, y): counts to 100 %, turns into a check mark, then resolves. */
function progressRing(host, x, y) {
  const box = host.getBoundingClientRect();
  const ring = Object.assign(document.createElement('div'), { className: 'ring' });
  ring.setAttribute('aria-hidden', 'true');
  ring.style.left = `${x - box.left}px`;
  ring.style.top = `${y - box.top}px`;
  const circumference = 2 * Math.PI * 44;
  ring.innerHTML = `<svg viewBox="0 0 124 124"><circle class="disc" cx="62" cy="62" r="58"/><circle class="track" cx="62" cy="62" r="44"/>`
    + `<circle class="bar" cx="62" cy="62" r="44" stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${circumference.toFixed(2)}"/>`
    + `<circle class="ok" cx="62" cy="62" r="44"/><path class="tick" d="M42 63l13 13 27-28"/><text class="pct" x="62" y="62">0%</text></svg>`;
  host.append(ring);
  const bar = ring.querySelector('.bar'), pct = ring.querySelector('.pct');
  void ring.offsetWidth;
  ring.classList.add('is-visible');
  const duration = reduceMotion ? 1 : 1000, start = performance.now();
  return new Promise(resolve => {
    const step = now => {
      const p = Math.min(1, (now - start) / duration), eased = 1 - (1 - p) ** 2.2;
      bar.setAttribute('stroke-dashoffset', (circumference * (1 - eased)).toFixed(2));
      pct.textContent = `${Math.round(eased * 100)}%`;
      if (p < 1) { requestAnimationFrame(step); return; }
      ring.classList.add('is-done');
      setTimeout(() => {
        ring.classList.remove('is-visible');
        resolve();
        setTimeout(() => ring.remove(), 500);
      }, reduceMotion ? 250 : 750);
    };
    requestAnimationFrame(step);
  });
}

/* ───────── Page ───────── */

function setupReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) { items.forEach(el => el.classList.add('is-visible')); return; }
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
  items.forEach(el => io.observe(el));
}

/** The promo video loads only when scrolled to, plays while visible (muted) and pauses when it leaves. */
function setupVideo() {
  const video = document.querySelector('video.promo');
  if (!video || !('IntersectionObserver' in window)) { if (video) video.src = video.dataset.src; return; }
  let pausedByUser = false, pausingForScroll = false;
  video.addEventListener('pause', () => { if (!pausingForScroll) pausedByUser = true; pausingForScroll = false; });
  video.addEventListener('play', () => { pausedByUser = false; });
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      if (!video.src) { video.preload = 'auto'; video.src = video.dataset.src; }
      if (!reduceMotion && !pausedByUser) video.play().catch(() => {});
    } else if (!video.paused) {
      pausingForScroll = true;
      video.pause();
    }
  }, { threshold: 0.4 }).observe(video);
}

/* ───────── Showcase: feature clips with scroll motion ───────── */

/**
 * The home page's feature clips. Each video gets its source only when it scrolls into view (preload="none" until
 * then, the poster image above it), plays muted while visible and pauses when it leaves. Its button pauses and plays
 * it; with reduced motion nothing plays until that button is pressed. GSAP (served from this site, see build.mjs)
 * is loaded only when the section comes near and only without reduced motion.
 */
function setupShowcase() {
  const section = document.querySelector('[data-showcase]');
  if (!section) return;
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  const clips = new Map();
  for (const clip of section.querySelectorAll('[data-clip]')) {
    const video = clip.querySelector('video');
    const button = clip.querySelector('.clip-toggle');
    let wanted = !reduceMotion; // whether the clip should play while it is visible
    let visible = false;
    const sync = () => {
      const playing = !video.paused;
      clip.classList.toggle('is-playing', playing);
      button.setAttribute('aria-label', playing ? section.dataset.pause : section.dataset.play);
    };
    const play = () => {
      if (!video.getAttribute('src')) video.src = (dark && video.dataset.srcDark) || video.dataset.src;
      video.play().catch(() => {});
    };
    video.addEventListener('playing', () => clip.classList.add('is-started'));
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    button.addEventListener('click', () => {
      wanted = video.paused;
      if (wanted) play(); else video.pause();
    });
    button.hidden = false;
    clips.set(clip, isVisible => {
      visible = isVisible;
      if (visible && wanted) play();
      else if (!visible && !video.paused) video.pause();
    });
  }
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) clips.get(entry.target)?.(entry.isIntersecting);
  }, { threshold: 0.35 });
  clips.forEach((_, clip) => io.observe(clip));

  if (reduceMotion || !section.dataset.gsap) return;
  const near = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    near.disconnect();
    animateShowcase(section).catch(() => {});
  }, { rootMargin: '100% 0px' });
  near.observe(section);
}

const loadScript = src => new Promise((resolve, reject) => {
  const script = document.createElement('script');
  script.src = src;
  script.onload = resolve;
  script.onerror = reject;
  document.head.append(script);
});

/** Scroll-driven motion of the showcase rows (GSAP + ScrollTrigger). */
async function animateShowcase(section) {
  const [core, plugin] = section.dataset.gsap.split(' ');
  await loadScript(core);
  await loadScript(plugin);
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  section.classList.add('is-animated');
  const rows = [...section.querySelectorAll('[data-feature]')];
  gsap.matchMedia().add({ wide: '(min-width: 981px)', narrow: '(max-width: 980px)' }, ({ conditions: { wide } }) => {
    rows.forEach((row, i) => {
      const clip = row.querySelector('.clip');
      // Odd rows have the clip on the far side (the left in right-to-left pages), so it leans the other way there.
      const side = (i % 2 ? -1 : 1) * (document.documentElement.dir === 'rtl' ? -1 : 1);
      // The clip rises, straightens and grows into place as its row scrolls up; the picture inside settles from a
      // slight zoom, the glow behind drifts slower than the page.
      const scrub = { trigger: row, start: 'top bottom', end: wide ? 'center 55%' : 'top 35%', scrub: 0.6 };
      gsap.fromTo(clip, { y: wide ? 90 : 40, scale: 0.88, rotate: wide ? 3 * side : 0 },
        { y: 0, scale: 1, rotate: 0, ease: 'none', scrollTrigger: scrub });
      gsap.fromTo(clip.querySelectorAll('video, .clip-poster'), { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { ...scrub } });
      gsap.fromTo(row.querySelector('.feature-media'), { '--glow-y': '30%' }, {
        '--glow-y': '-12%', ease: 'none', scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: true },
      });
      // The number pops in, then the copy rises line by line (on phones the number sits right above the title, so
      // it only fades and scales there).
      const reveal = { trigger: row, start: 'top 80%', toggleActions: 'play none none reverse' };
      gsap.from(row.querySelector('.feature-index'), { autoAlpha: 0, scale: 0.6, duration: 0.7, ease: 'back.out(2)', scrollTrigger: reveal });
      gsap.from(row.querySelectorAll('.feature-copy > *'), {
        y: wide ? 34 : 22, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.1, scrollTrigger: { ...reveal },
      });
      ScrollTrigger.create({ trigger: row, start: 'top 62%', end: 'bottom 38%', toggleClass: { targets: row, className: 'is-active' } });
    });
    if (wide) {
      gsap.fromTo(section.querySelector('.showcase-rail i'), { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: section.querySelector('.showcase-list'), start: 'top 62%', end: 'bottom 62%', scrub: true },
      });
    }
  });
}

const HOUR = 3_600_000;

/**
 * Cached in localStorage (shared by all pages and tabs) because the GitHub API allows 60 unauthenticated requests
 * per hour and IP. Failures (offline, rate limit, timeout) are remembered for 10 minutes so every page view doesn't
 * retry; the static fallbacks in the HTML simply stay.
 */
async function cached(key, load) {
  try {
    const hit = JSON.parse(localStorage.getItem(key));
    if (hit && Date.now() - hit.at < (hit.value ? HOUR : HOUR / 6)) {
      if (hit.value) return hit.value;
      throw new Error('failed recently');
    }
  } catch (error) {
    if (error.message === 'failed recently') throw error;
  }
  const store = value => { try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), value })); } catch { /* storage unavailable */ } };
  try {
    const value = await load();
    store(value);
    return value;
  } catch (error) {
    store(null);
    throw error;
  }
}

async function getJson(url) {
  if (navigator.onLine === false) throw new Error('offline');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal });
    if (!res.ok) throw new Error(`${res.status} ${url}`); // 403/429 when rate limited
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The visitor's system as a first guess (they can change it). A Mac is taken as Apple silicon: browsers on Intel and
 * Apple silicon Macs report the same platform, and Apple silicon is what Apple sells now.
 */
function guessTarget() {
  const platform = (navigator.userAgentData?.platform || navigator.platform || '').toLowerCase();
  const agent = navigator.userAgent.toLowerCase();
  if (platform.includes('mac')) return 'osx-arm64';
  if (platform.includes('linux') && !agent.includes('android'))
    return /aarch64|arm64/.test(platform + agent) ? 'linux-arm64' : 'linux-x64';
  return 'win-x64';
}

/** Each selection resolves only an asset for that operating system and processor. */
function setupGitHub() {
  const api = 'https://api.github.com/repos/KnifeLemon/Filee';
  const compact = n => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n));

  cached('filee-repo', async () => ({ stars: (await getJson(api)).stargazers_count }))
    .then(({ stars }) => {
      if (stars > 0) document.querySelectorAll('[data-stars]').forEach(el => { el.textContent = `★ ${compact(stars)}`; });
    })
    .catch(() => {});

  const t = page.download;
  if (!t) return;
  const selectors = [...document.querySelectorAll('select[data-download-target]')];
  let selected = guessTarget(), release = null, failed = false;
  try {
    const saved = sessionStorage.getItem('filee-download-target');
    if (DOWNLOAD_TARGETS.includes(saved)) selected = saved;
  } catch { /* storage unavailable */ }

  const render = () => {
    const choice = downloadChoice(release, selected, failed);
    const target = t.targets[selected];
    const version = release?.tag_name ? release.tag_name.replace(/^v?/, 'v') : '';
    const size = choice.asset?.size ? ` · ${Math.round(choice.asset.size / 1_048_576)} MB` : '';
    const status = choice.state === 'available'
      ? `${target} · ${version}${size}${choice.development ? ` · ${t.developmentLabel}` : ''}`
      : t[choice.state].replace('{target}', target);
    selectors.forEach(select => { select.value = selected; });
    document.querySelectorAll('[data-download]').forEach(link => {
      link.href = choice.url;
      link.dataset.downloadTarget = selected;
      const label = link.querySelector('[data-download-label]');
      if (label) label.textContent = choice.state === 'available'
        ? (choice.development ? t.developmentButton : selected.startsWith('linux-') ? t.linuxButton : t.button) : t.all;
    });
    document.querySelectorAll('[data-download-status]').forEach(node => { node.textContent = status; node.hidden = false; });
    document.querySelectorAll('[data-version]').forEach(node => { node.textContent = version; });
    document.querySelectorAll('[data-version-full]').forEach(node => { node.textContent = version + size; });
    document.querySelectorAll('[data-latest]').forEach(node => { node.hidden = !version; });
  };

  selectors.forEach(select => {
    select.closest('[data-download-picker]').hidden = false;
    select.addEventListener('change', () => {
      if (!DOWNLOAD_TARGETS.includes(select.value)) return;
      selected = select.value;
      try { sessionStorage.setItem('filee-download-target', selected); } catch { /* storage unavailable */ }
      render();
    });
  });
  render();
  cached('filee-release-v3', async () => releaseSummary(await getJson(`${api}/releases/latest`)))
    .then(value => { release = releaseSummary(value); render(); })
    .catch(() => { failed = true; render(); });
}

/**
 * After a click on a download button that fetches the installer itself: the download starts as usual, and a panel
 * explains the SmartScreen prompt of the (not yet code-signed) installer and points to GitHub for a star or an issue,
 * which visitors who download from here would otherwise never see.
 */
function setupDownloadGuide() {
  const t = page.afterDownload;
  if (!t || typeof HTMLDialogElement !== 'function') return;
  const repo = 'https://github.com/KnifeLemon/Filee';
  const el = (tag, props = {}) => Object.assign(document.createElement(tag), props);
  let dialog, retry;

  // "Filee is free thanks to" and the sponsors' logos (with their dark-theme versions), linked as on the home page.
  const sponsorLine = (text, sponsors) => {
    const list = el('span', { className: 'download-guide-sponsor-list' });
    for (const s of sponsors) {
      let content;
      if (s.logo) {
        content = el('picture');
        if (s.logoDark) content.append(el('source', { srcset: s.logoDark, media: '(prefers-color-scheme: dark)' }));
        const img = el('img', { src: s.logo, alt: s.name, decoding: 'async' });
        if (s.size) Object.assign(img, { width: s.size.width, height: s.size.height });
        content.append(img);
      } else {
        content = el('b', { textContent: s.name });
      }
      const item = s.url ? el('a', { href: s.url, target: '_blank', rel: 'sponsored noopener' }) : el('span');
      item.className = s.logo && !s.logoDark ? 'download-guide-sponsor light-only' : 'download-guide-sponsor';
      item.append(content);
      list.append(item);
    }
    const line = el('p', { className: 'download-guide-sponsors' });
    line.append(el('span', { textContent: text }), list);
    return line;
  };

  const build = () => {
    dialog = el('dialog', { className: 'download-guide' });
    dialog.setAttribute('aria-labelledby', 'download-guide-title');
    const close = el('button', { type: 'button', className: 'download-guide-close', textContent: '×' });
    close.setAttribute('aria-label', t.close);
    close.addEventListener('click', () => dialog.close());
    const steps = el('ol');
    for (const step of t.steps) steps.append(el('li', { textContent: step }));
    const actions = el('div', { className: 'download-guide-actions' });
    actions.append(
      el('a', { className: 'btn btn-primary', href: repo, target: '_blank', rel: 'noopener', textContent: t.star }),
      el('a', { className: 'btn btn-ghost', href: `${repo}/issues/new/choose`, target: '_blank', rel: 'noopener', textContent: t.issue }));
    retry = el('a', { className: 'download-guide-retry', textContent: t.retry });
    dialog.append(close, el('h2', { id: 'download-guide-title', textContent: t.title }), steps, actions, retry);
    if (page.sponsors?.length) dialog.append(sponsorLine(t.thanks, page.sponsors));
    // A click on the backdrop (outside the panel) closes it.
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    document.body.append(dialog);
  };

  document.addEventListener('click', e => {
    const link = e.target.closest?.('[data-download]');
    if (!link || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    if (link.dataset.downloadTarget !== 'win-x64') return;
    if (!/\.exe$/i.test(new URL(link.href).pathname)) return; // still the release page: it explains itself
    if (!dialog) build();
    retry.href = link.href;
    setTimeout(() => { if (!dialog.open) dialog.showModal(); }, 200);
  });
}

/** Suggests the visitor's language when it differs from the page. Never redirects (crawlers and shared links stay put). */
function setupLanguageBanner() {
  const KEY = 'filee-lang-chosen';
  const remember = () => { try { localStorage.setItem(KEY, '1'); } catch { /* storage unavailable */ } };
  document.querySelectorAll('.lang-menu a, .footer-langs a').forEach(a => a.addEventListener('click', remember));
  try { if (localStorage.getItem(KEY)) return; } catch { return; }
  if (document.referrer && new URL(document.referrer).origin === location.origin) return;

  // The site's language for a browser language tag (languages.mjs → match: "pl" matches pl and pl-PL). The longest
  // match wins, so zh-TW takes Traditional Chinese although "zh" alone means Simplified.
  const map = tag => {
    tag = String(tag || '').toLowerCase();
    let best = null, length = 0;
    for (const l of page.langs)
      for (const m of l.match ?? [])
        if ((tag === m || tag.startsWith(`${m}-`)) && m.length > length) { best = l; length = m.length; }
    return best;
  };
  const target = (navigator.languages?.length ? navigator.languages : [navigator.language]).map(map).find(Boolean);
  if (!target || target.lang === page.lang) return;

  const banner = Object.assign(document.createElement('div'), { className: 'lang-banner', lang: target.lang, dir: target.dir ?? 'ltr' });
  banner.setAttribute('role', 'note');
  const text = Object.assign(document.createElement('span'), { textContent: target.banner });
  const link = Object.assign(document.createElement('a'), { href: target.path, textContent: `${target.name} ${target.dir === 'rtl' ? '←' : '→'}`, hreflang: target.lang });
  link.addEventListener('click', remember);
  const dismiss = Object.assign(document.createElement('button'), { type: 'button', textContent: '×' });
  dismiss.setAttribute('aria-label', 'Close');
  dismiss.addEventListener('click', () => { banner.classList.remove('is-visible'); remember(); });
  banner.append(text, link, dismiss);
  document.body.append(banner);
  setTimeout(() => banner.classList.add('is-visible'), 1200);
}

function setupNav() {
  const nav = document.querySelector('[data-nav]');
  const update = () => nav.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', update, { passive: true });
  update();

  const menu = document.querySelector('.lang-menu');
  if (!menu) return;
  document.addEventListener('click', e => { if (menu.open && !menu.contains(e.target)) menu.open = false; });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !menu.open) return;
    menu.open = false;
    menu.querySelector('summary').focus();
  });
}

/** Feature cards lean towards the pointer and a soft light follows it. */
function setupTilt() {
  if (!finePointer || reduceMotion) return;
  for (const card of document.querySelectorAll('[data-tilt]')) {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      card.style.setProperty('--rx', `${((0.5 - y) * 6).toFixed(2)}deg`);
      card.style.setProperty('--ry', `${((x - 0.5) * 6).toFixed(2)}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--rx');
      card.style.removeProperty('--ry');
    });
  }
}

setupNav();
setupReveal();
setupDemo();
setupVideo();
setupShowcase();
setupTilt();
setupGitHub();
setupDownloadGuide();
setupLanguageBanner();
