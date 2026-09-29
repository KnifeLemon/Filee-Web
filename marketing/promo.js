// Filee promo composition: every frame is a pure function of time, drawn on a 2D canvas, so the same code
// renders the MP4 (frame by frame, see mp4.js), the stills and the README GIF.
//
// Layout adapts to the canvas: portrait (Threads / Reels, 1080×1920) or landscape (1920×1080).

import { STRINGS } from './strings.js';

export const DURATION = 27;

// ───────────────────────── Brand ─────────────────────────

const C = {
  bg: '#F6F4F0',
  ink: '#1F1E1D',
  muted: '#6B6A66',
  accent: '#7F77DD',
  accentDark: '#3C3489',
  accentMid: '#6A62C9',
  accentSoft: '#AFA9EC',
  green: '#1D9E75',
  segment: '#F4F2EE',
  white: '#FFFFFF',
};

const FONT = '"NotoSans", "NotoSansKR", "NotoSansSC", sans-serif';

const LOGO_PATHS = [
  ['#7F77DD', 0, 0, 'M154.61 65.27 A216 216 0 0 1 357.39 65.27 L304.82 164.17 A104 104 0 0 0 207.18 164.17 Z'],
  ['#1D9E75', 13.86, -8, 'M373.66 67.74 A222 222 0 0 1 477.86 248.23 L359.94 252.36 A104 104 0 0 0 311.12 167.81 Z'],
  ['#7F77DD', 0, 0, 'M471.87 263.56 A216 216 0 0 1 370.48 439.17 L311.12 344.19 A104 104 0 0 0 359.94 259.64 Z'],
  ['#6A62C9', 0, 0, 'M357.39 446.73 A216 216 0 0 1 154.61 446.73 L207.18 347.83 A104 104 0 0 0 304.82 347.83 Z'],
  ['#7F77DD', 0, 0, 'M141.52 439.17 A216 216 0 0 1 40.13 263.56 L152.06 259.64 A104 104 0 0 0 200.88 344.19 Z'],
  ['#6A62C9', 0, 0, 'M40.13 248.44 A216 216 0 0 1 141.52 72.83 L200.88 167.81 A104 104 0 0 0 152.06 252.36 Z'],
].map(([fill, dx, dy, d]) => ({ fill, dx, dy, path: new Path2D(d) }));
const LOGO_FILE = new Path2D('M222 212 h44 l24 24 v64 h-68 z');
const LOGO_FOLD = new Path2D('M266 212 v24 h24 z');

const TYPE_COLORS = {
  jpg: '#E0913C', webp: '#7F77DD', png: '#378ADD', docx: '#2B579A', pptx: '#D24726', xlsx: '#217346',
  hwp: '#1B7FC4', hwpx: '#1B7FC4', pdf: '#E5252A', md: '#5F5E5A', heic: '#639922',
};

// ───────────────────────── Timing helpers ─────────────────────────

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const span = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = t => 1 - (1 - t) ** 3;
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeIn = t => t * t * t;
const back = t => {
  const s = 1.70158 * 1.25;
  return 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;
};
/** Soft spring 0 → 1 with a small overshoot, like the app's donut. */
const spring = t => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.exp(-6.5 * t) * Math.cos(9 * t));

// ───────────────────────── Drawing helpers ─────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function text(ctx, value, x, y, { size, weight = 700, color = C.ink, align = 'center', alpha = 1, baseline = 'middle', maxWidth, letter = 0 }) {
  if (alpha <= 0 || !value)
    return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.letterSpacing = `${letter}px`;
  ctx.fillText(value, x, y, maxWidth);
  ctx.restore();
}

/** Headline that rises and fades in; long lines are wrapped at spaces to fit maxWidth. Returns its height. */
function headline(ctx, value, x, y, size, progress, { color = C.ink, maxWidth, weight = 800, align = 'center' } = {}) {
  ctx.save();
  ctx.font = `${weight} ${size}px ${FONT}`;
  const lines = wrap(ctx, value, maxWidth ?? 10000);
  if (progress > 0) {
    lines.forEach((line, i) => {
      const p = easeOut(clamp(progress * 1.4 - i * 0.2));
      text(ctx, line, x, y + i * size * 1.18 + (1 - p) * size * 0.5, { size, weight, color, alpha: p, align });
    });
  }
  ctx.restore();
  return lines.length * size * 1.18;
}

function wrap(ctx, value, maxWidth) {
  const lines = [];
  // Breaks at spaces; a word wider than a line (Chinese has no spaces) breaks between characters,
  // but never right before closing punctuation.
  const noLineStart = '，。、！？：；）」』,.!?:;)';
  for (const paragraph of value.split('\n')) {
    let line = '';
    const push = (piece, separator) => {
      const next = line ? line + separator + piece : piece;
      if (ctx.measureText(next).width > maxWidth && line && !noLineStart.includes(piece[0])) {
        lines.push(line);
        line = piece;
      } else {
        line = next;
      }
    };
    for (const word of paragraph.split(' ')) {
      if (ctx.measureText(word).width <= maxWidth)
        push(word, ' ');
      else
        [...word].forEach((ch, i) => push(ch, i === 0 ? ' ' : ''));
    }
    lines.push(line);
  }
  return lines;
}

function shadow(ctx, blur, y, alpha = 0.16) {
  ctx.shadowColor = `rgba(40, 30, 90, ${alpha})`;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = y;
}

function drawLogo(ctx, cx, cy, size, { progress = 1, spin = 0 } = {}) {
  const scale = size / 512;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(spin);
  ctx.scale(scale, scale);
  ctx.translate(-256, -256);
  LOGO_PATHS.forEach((piece, i) => {
    const p = spring(clamp(progress * 1.6 - i * 0.12));
    if (p <= 0)
      return;
    ctx.save();
    // Pieces fly in from further out along their direction.
    const bounds = [[256, 110], [400, 150], [410, 350], [256, 400], [110, 350], [100, 150]][i];
    const dx = (bounds[0] - 256) * (1 - p) * 1.6;
    const dy = (bounds[1] - 256) * (1 - p) * 1.6;
    ctx.globalAlpha *= clamp(p * 1.5);
    ctx.translate(piece.dx + dx, piece.dy + dy);
    ctx.fillStyle = piece.fill;
    ctx.fill(piece.path);
    ctx.restore();
  });
  const fileProgress = easeOut(clamp(progress * 1.6 - 0.8));
  if (fileProgress > 0) {
    ctx.globalAlpha *= fileProgress;
    ctx.translate(256, 256);
    ctx.scale(fileProgress, fileProgress);
    ctx.translate(-256, -256);
    ctx.fillStyle = C.accentDark;
    ctx.fill(LOGO_FILE);
    ctx.fillStyle = C.accentSoft;
    ctx.fill(LOGO_FOLD);
  }
  ctx.restore();
}

function background(ctx, W, H, t) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  const blobs = [
    [C.accent, 0.30, 0.18, 0.12, 0.55],
    [C.green, 0.20, 0.86, 0.82, 0.5],
    ['#D4537E', 0.10, 0.85, 0.15, 0.4],
    [C.accentSoft, 0.30, 0.2, 0.9, 0.45],
  ];
  const m = Math.max(W, H);
  blobs.forEach(([color, alpha, bx, by, r], i) => {
    const x = (bx + Math.sin(t * 0.35 + i * 1.7) * 0.05) * W;
    const y = (by + Math.cos(t * 0.3 + i) * 0.04) * H;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * m);
    g.addColorStop(0, hexAlpha(color, alpha));
    g.addColorStop(1, hexAlpha(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  });
}

function hexAlpha(hex, alpha) {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${v >> 16}, ${(v >> 8) & 255}, ${v & 255}, ${alpha})`;
}

/** Document icon with a folded corner and the extension label (or a photo thumbnail for images). */
function fileIcon(ctx, x, y, w, type, { alpha = 1, glow = 0 } = {}) {
  const h = w * 1.22;
  const fold = w * 0.26;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (glow > 0) {
    ctx.shadowColor = hexAlpha(C.green, 0.55 * glow);
    ctx.shadowBlur = 40 * glow;
  } else {
    shadow(ctx, w * 0.12, w * 0.05, 0.14);
  }
  ctx.beginPath();
  ctx.moveTo(x, y + 8);
  ctx.quadraticCurveTo(x, y, x + 8, y);
  ctx.lineTo(x + w - fold, y);
  ctx.lineTo(x + w, y + fold);
  ctx.lineTo(x + w, y + h - 8);
  ctx.quadraticCurveTo(x + w, y + h, x + w - 8, y + h);
  ctx.lineTo(x + 8, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - 8);
  ctx.closePath();
  ctx.fillStyle = C.white;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.save();
  ctx.clip();
  if (type === 'jpg' || type === 'webp' || type === 'png' || type === 'heic') {
    // A little landscape picture.
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#8EC5F0');
    g.addColorStop(0.62, '#D8ECF8');
    g.addColorStop(0.63, '#5DAE7C');
    g.addColorStop(1, '#3E8C5E');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#F6C85F';
    ctx.beginPath();
    ctx.arc(x + w * 0.3, y + h * 0.3, w * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4E9A6B';
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.66);
    ctx.lineTo(x + w * 0.45, y + h * 0.38);
    ctx.lineTo(x + w, y + h * 0.7);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.fill();
  } else {
    ctx.fillStyle = '#E9E6F7';
    for (let i = 0; i < 5; i++)
      ctx.fillRect(x + w * 0.16, y + h * (0.3 + i * 0.1), w * (i === 4 ? 0.4 : 0.68), h * 0.035);
  }
  ctx.restore();
  // Folded corner.
  ctx.fillStyle = '#E2DFF4';
  ctx.beginPath();
  ctx.moveTo(x + w - fold, y);
  ctx.lineTo(x + w - fold, y + fold);
  ctx.lineTo(x + w, y + fold);
  ctx.closePath();
  ctx.fill();
  // Type badge.
  const label = type.toUpperCase();
  ctx.font = `800 ${w * 0.17}px ${FONT}`;
  const bw = ctx.measureText(label).width + w * 0.16;
  roundRect(ctx, x - w * 0.08, y + h * 0.62, bw, w * 0.26, w * 0.06);
  ctx.fillStyle = TYPE_COLORS[type] ?? C.accent;
  ctx.fill();
  text(ctx, label, x - w * 0.08 + bw / 2, y + h * 0.62 + w * 0.13, { size: w * 0.17, weight: 800, color: C.white });
  ctx.restore();
}

function cursor(ctx, x, y, { pressed = false, scale = 1, alpha = 1 } = {}) {
  if (alpha <= 0)
    return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(scale * (pressed ? 0.92 : 1), scale * (pressed ? 0.92 : 1));
  shadow(ctx, 10, 4, 0.3);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 44);
  ctx.lineTo(10.5, 34);
  ctx.lineTo(18, 51);
  ctx.lineTo(25, 48);
  ctx.lineTo(17.5, 31.5);
  ctx.lineTo(32, 31.5);
  ctx.closePath();
  ctx.fillStyle = C.white;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 3;
  ctx.strokeStyle = C.ink;
  ctx.stroke();
  ctx.restore();
}

function keycap(ctx, x, y, label, { pressed = 0, alpha = 1, size = 1 } = {}) {
  if (alpha <= 0)
    return;
  const w = 124 * size;
  const h = 72 * size;
  const depth = 10 * size * (1 - pressed);
  ctx.save();
  ctx.globalAlpha *= alpha;
  roundRect(ctx, x - w / 2, y - h / 2 + 10 * size, w, h, 16 * size);
  ctx.fillStyle = '#C9C5E8';
  ctx.fill();
  roundRect(ctx, x - w / 2, y - h / 2 + 10 * size - depth, w, h, 16 * size);
  ctx.fillStyle = pressed > 0.5 ? C.accent : C.white;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#D9D5EF';
  ctx.stroke();
  text(ctx, label, x, y + 10 * size - depth, { size: 30 * size, weight: 800, color: pressed > 0.5 ? C.white : C.ink });
  ctx.restore();
}

/**
 * The donut toolbar as the app draws it: equal slices, a white hub with a title, the hovered slice in the
 * accent colour and pushed outwards.
 */
function donut(ctx, cx, cy, R, items, { open = 1, hover = -1, hoverAmount = 0, title = '', hint = '', collapse = 0 } = {}) {
  if (open <= 0)
    return;
  const n = items.length;
  const inner = R * 0.42;
  const gap = 0.018;
  ctx.save();
  ctx.globalAlpha *= clamp(open * 1.4) * (1 - collapse);
  shadow(ctx, 60, 22, 0.2 * (1 - collapse));
  ctx.beginPath();
  ctx.arc(cx, cy, R * spring(open) * (1 - collapse * 0.6), 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.001)';
  ctx.fill();
  ctx.restore();

  for (let i = 0; i < n; i++) {
    const appear = spring(clamp(open * 1.5 - i * 0.05));
    if (appear <= 0)
      continue;
    const start = -Math.PI / 2 + (i - 0.5) * (2 * Math.PI / n) + gap;
    const end = start + 2 * Math.PI / n - gap * 2;
    const isHover = i === hover;
    const pop = isHover ? hoverAmount : 0;
    const mid = (start + end) / 2;
    const push = pop * R * 0.06;
    const outer = (R + pop * R * 0.05) * appear * (1 - collapse * 0.5);
    const inR = inner * appear * (1 - collapse * 0.3);
    const ox = cx + Math.cos(mid) * push;
    const oy = cy + Math.sin(mid) * push;
    ctx.save();
    ctx.globalAlpha *= clamp(appear * 1.5) * (1 - collapse);
    ctx.beginPath();
    ctx.arc(ox, oy, outer, start, end);
    ctx.arc(ox, oy, inR, end, start, true);
    ctx.closePath();
    shadow(ctx, 24, 8, 0.12 + pop * 0.12);
    ctx.fillStyle = isHover ? blend(C.segment, C.accent, pop) : C.segment;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.stroke();
    const lr = (outer + inR) / 2;
    const lx = ox + Math.cos(mid) * lr;
    const ly = oy + Math.sin(mid) * lr;
    const [label, sub] = items[i];
    const labelColor = isHover && pop > 0.5 ? C.white : C.ink;
    text(ctx, label, lx, ly - (sub ? R * 0.035 : 0), { size: R * 0.085, weight: 800, color: labelColor });
    if (sub)
      text(ctx, sub, lx, ly + R * 0.06, { size: R * 0.06, weight: 500, color: isHover && pop > 0.5 ? 'rgba(255,255,255,0.85)' : C.muted });
    ctx.restore();
  }

  // Hub.
  const hub = inner * 0.86 * spring(open) * (1 - collapse);
  if (hub > 1) {
    ctx.save();
    ctx.globalAlpha *= 1 - collapse;
    shadow(ctx, 20, 6, 0.12);
    ctx.beginPath();
    ctx.arc(cx, cy, hub, 0, Math.PI * 2);
    ctx.fillStyle = C.white;
    ctx.fill();
    ctx.restore();
    text(ctx, title, cx, cy - R * 0.03, { size: R * 0.08, weight: 800, alpha: clamp(open * 2 - 1) * (1 - collapse) });
    text(ctx, hint, cx, cy + R * 0.07, { size: R * 0.055, weight: 500, color: C.muted, alpha: clamp(open * 2 - 1) * (1 - collapse) });
  }
}

function blend(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const mix = shift => Math.round(lerp((pa >> shift) & 255, (pb >> shift) & 255, t));
  return `rgb(${mix(16)}, ${mix(8)}, ${mix(0)})`;
}

/** Progress ring and success check that replace the donut after a drop. */
function progressRing(ctx, cx, cy, r, { appear = 0, value = 0, success = 0, fade = 0 }) {
  if (appear <= 0 || fade >= 1)
    return;
  const s = spring(appear) * (1 - fade * 0.3);
  ctx.save();
  ctx.globalAlpha *= clamp(appear * 2) * (1 - fade);
  shadow(ctx, 30, 10, 0.2);
  ctx.beginPath();
  ctx.arc(cx, cy, r * s, 0, Math.PI * 2);
  ctx.fillStyle = C.white;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = r * 0.12;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#E4E2DD';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.74 * s, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = C.accent;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.74 * s, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * value);
  ctx.stroke();
  text(ctx, `${Math.round(value * 100)}%`, cx, cy, { size: r * 0.36, weight: 800, alpha: 1 - success });
  if (success > 0) {
    const g = spring(success);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.82 * g, 0, Math.PI * 2);
    ctx.fillStyle = C.green;
    ctx.fill();
    ctx.lineWidth = r * 0.12;
    ctx.strokeStyle = C.white;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const draw = easeOut(clamp(success * 1.6 - 0.3));
    const p0 = [cx - r * 0.3, cy + r * 0.02];
    const p1 = [cx - r * 0.08, cy + r * 0.24];
    const p2 = [cx + r * 0.34, cy - r * 0.2];
    ctx.beginPath();
    ctx.moveTo(...p0);
    if (draw < 0.4) {
      ctx.lineTo(lerp(p0[0], p1[0], draw / 0.4), lerp(p0[1], p1[1], draw / 0.4));
    } else {
      ctx.lineTo(...p1);
      ctx.lineTo(lerp(p1[0], p2[0], (draw - 0.4) / 0.6), lerp(p1[1], p2[1], (draw - 0.4) / 0.6));
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** Rounded label; x is its center, or its left edge with align: 'left'. */
function pill(ctx, x, y, label, { size = 30, color = C.white, background = C.accent, alpha = 1, scale = 1, icon, align = 'center' } = {}) {
  if (alpha <= 0)
    return 0;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `700 ${size}px ${FONT}`;
  const w = ctx.measureText(label).width + size * 1.4 + (icon ? size : 0);
  const h = size * 2;
  ctx.translate(align === 'left' ? x + w / 2 : x, y);
  ctx.scale(scale, scale);
  shadow(ctx, size, size * 0.3, 0.15);
  roundRect(ctx, -w / 2, -h / 2, w, h, h / 2);
  ctx.fillStyle = background;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  if (icon)
    icon(ctx, -w / 2 + size * 1.0, 0, size);
  text(ctx, label, icon ? size * 0.5 : 0, 0, { size, weight: 700, color });
  ctx.restore();
  return w;
}

/** Width pill() draws for label at size (without an icon). */
function pillWidth(ctx, label, size = 30) {
  ctx.save();
  ctx.font = `700 ${size}px ${FONT}`;
  const w = ctx.measureText(label).width + size * 1.4;
  ctx.restore();
  return w;
}

// ───────────────────────── Explorer window ─────────────────────────

/** Tiles of a file window, laid out in a grid; returns the tile rectangles by name. */
function explorer(ctx, box, title, files, { alpha = 1, rise = 1, selected = new Set(), marquee, hidden = new Set() } = {}) {
  const { x, y, w, h } = box;
  const dy = (1 - easeOut(rise)) * 80;
  ctx.save();
  ctx.globalAlpha *= alpha * easeOut(rise);
  ctx.translate(0, dy);
  shadow(ctx, 70, 26, 0.18);
  roundRect(ctx, x, y, w, h, 28);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  // Title bar.
  ctx.save();
  roundRect(ctx, x, y, w, h, 28);
  ctx.clip();
  ctx.fillStyle = '#F1EFEA';
  ctx.fillRect(x, y, w, 76);
  ctx.restore();
  ctx.fillStyle = '#F6C85F';
  roundRect(ctx, x + 30, y + 24, 34, 28, 6);
  ctx.fill();
  text(ctx, title, x + 80, y + 38, { size: 26, weight: 700, align: 'left' });
  ['─', '□', '✕'].forEach((glyph, i) => text(ctx, glyph, x + w - 150 + i * 50, y + 38, { size: 22, weight: 500, color: C.muted }));

  const cols = h > w ? 3 : Math.max(3, Math.floor((w - 60) / 220));
  const tileW = (w - 60) / cols;
  const icon = Math.min(150, tileW * 0.5);
  const rowH = icon * 2.2;
  const tiles = {};
  files.forEach((file, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const tx = x + 30 + col * tileW;
    const ty = y + 110 + row * rowH;
    tiles[file.name] = { x: tx + tileW / 2, y: ty + icon * 0.8 };
    if (hidden.has(file.name))
      return;
    const appear = file.appear ?? 1;
    if (appear <= 0)
      return;
    if (selected.has(file.name)) {
      roundRect(ctx, tx + 8, ty - 6, tileW - 16, rowH - 18, 18);
      ctx.fillStyle = hexAlpha(C.accent, 0.16);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = hexAlpha(C.accent, 0.5);
      ctx.stroke();
    }
    const s = spring(appear);
    ctx.save();
    ctx.translate(tx + tileW / 2, ty + icon * 0.64);
    ctx.scale(s, s);
    fileIcon(ctx, -icon / 2, -icon * 0.64, icon, file.type, { glow: file.glow ?? 0 });
    ctx.restore();
    text(ctx, file.name, tx + tileW / 2, ty + icon * 1.62, { size: icon * 0.2, weight: 500, maxWidth: tileW - 20, alpha: clamp(appear * 2) });
  });
  if (marquee) {
    ctx.fillStyle = hexAlpha(C.accent, 0.12);
    ctx.strokeStyle = hexAlpha(C.accent, 0.7);
    ctx.lineWidth = 2;
    ctx.fillRect(marquee.x, marquee.y, marquee.w, marquee.h);
    ctx.strokeRect(marquee.x, marquee.y, marquee.w, marquee.h);
  }
  ctx.restore();
  return tiles;
}

function dragGhost(ctx, x, y, type, count) {
  ctx.save();
  ctx.globalAlpha *= 0.9;
  fileIcon(ctx, x + 14, y + 20, 70, type);
  if (count > 1) {
    ctx.beginPath();
    ctx.arc(x + 88, y + 22, 20, 0, Math.PI * 2);
    ctx.fillStyle = C.accent;
    ctx.fill();
    text(ctx, String(count), x + 88, y + 23, { size: 22, weight: 800, color: C.white });
  }
  ctx.restore();
}

// ───────────────────────── Scenes ─────────────────────────

/** Layout for the canvas: portrait stacks caption above the stage, landscape puts it on the left. */
function layout(W, H) {
  const portrait = H > W;
  return portrait
    ? { portrait, captionX: W / 2, captionY: 230, captionW: W - 120, captionSize: 84, subSize: 42, align: 'center',
        stage: { x: 60, y: 560, w: W - 120, h: 1180 }, donutR: 350, ringR: 140 }
    : { portrait, captionX: 130, captionY: 320, captionW: 640, captionSize: 76, subSize: 36, align: 'left',
        stage: { x: 860, y: 190, w: 960, h: 700 }, donutR: 280, ringR: 110 };
}

function scene1(ctx, W, H, u, s) {
  // Logo builds up, then the name and the tagline.
  const cx = W / 2;
  const cy = H / 2 - (H > W ? 120 : 70);
  const size = H > W ? 420 : 360;
  drawLogo(ctx, cx, cy, size, { progress: u / 1.1, spin: (1 - easeOut(span(u, 0, 1.2))) * -0.6 });
  text(ctx, 'Filee', cx, cy + size * 0.62, { size: 110, weight: 800, alpha: easeOut(span(u, 0.8, 1.3)), letter: -2 });
  headline(ctx, s.tagline, cx, cy + size * 0.62 + 120, 50, span(u, 1.2, 1.9), { color: C.accentDark, weight: 700 });
}

const IMAGE_ITEMS = s => [['PNG'], ['WEBP'], ['PDF'], ['JPG', '70%'], ['ICO'], ['BMP'], ['TIFF'], ['AVIF']];
const DOC_ITEMS = [['PDF'], ['DOCX'], ['HWPX'], ['ODT'], ['TXT'], ['HTML']];

/** Headline plus an optional sub line below it; returns the y just below the block. */
function caption(ctx, L, value, progress, { sub, subProgress = 0 } = {}) {
  const height = headline(ctx, value, L.captionX, L.captionY, L.captionSize, progress, { maxWidth: L.captionW, align: L.align });
  let bottom = L.captionY + height;
  if (sub) {
    const subY = bottom + L.subSize * 0.6;
    bottom = subY + headline(ctx, sub, L.captionX, subY, L.subSize, subProgress, { maxWidth: L.captionW, align: L.align, color: C.muted, weight: 600 });
  }
  return bottom;
}

function scene2(ctx, W, H, u, s) {
  const L = layout(W, H);
  const files = [
    { name: s.files.photo, type: 'jpg' }, { name: s.files.report, type: 'docx' }, { name: s.files.contract, type: 'hwp' },
    { name: s.files.webp, type: 'webp', appear: span(u, 5.6, 6.3), glow: Math.max(0, 1 - Math.abs(u - 6.4) * 0.8) },
  ];
  const box = L.stage;
  const tiles = explorer(ctx, box, s.window, files, { rise: span(u, 0, 0.7) });

  const photo = tiles[s.files.photo];
  const drop = { x: box.x + box.w * 0.52, y: box.y + box.h * (L.portrait ? 0.66 : 0.62) };
  const donutCenter = drop;
  const target = 1; // WEBP
  const angle = -Math.PI / 2 + target * (2 * Math.PI / 8);
  const hoverPoint = { x: donutCenter.x + Math.cos(angle) * L.donutR * 0.72, y: donutCenter.y + Math.sin(angle) * L.donutR * 0.72 };

  // Cursor path: enter → photo → drag to the drop point → onto WEBP.
  let cx = W * 0.9;
  let cy = H * 0.95;
  const enter = easeInOut(span(u, 0.6, 1.4));
  cx = lerp(cx, photo.x, enter);
  cy = lerp(cy, photo.y, enter);
  const dragMove = easeInOut(span(u, 1.6, 2.2));
  cx = lerp(cx, drop.x, dragMove);
  cy = lerp(cy, drop.y, dragMove);
  const toSlice = easeInOut(span(u, 2.4, 3.0));
  cx = lerp(cx, hoverPoint.x, toSlice);
  cy = lerp(cy, hoverPoint.y, toSlice);

  const ctrl = u > 1.4 && u < 3.35;
  const dragging = u > 1.6 && u < 3.3;
  const open = span(u, 1.95, 2.5);
  const dropped = span(u, 3.3, 3.8);
  donut(ctx, donutCenter.x, donutCenter.y, L.donutR, IMAGE_ITEMS(s), {
    open, hover: target, hoverAmount: easeOut(span(u, 2.85, 3.05)),
    title: s.oneJpg, hint: s.escToClose, collapse: dropped,
  });
  progressRing(ctx, donutCenter.x, donutCenter.y, L.ringR, {
    appear: span(u, 3.45, 3.9), value: easeInOut(span(u, 3.8, 4.9)), success: span(u, 4.9, 5.35), fade: span(u, 5.5, 5.9),
  });
  if (dragging)
    dragGhost(ctx, cx, cy, 'jpg', 1);
  cursor(ctx, cx, cy, { pressed: dragging, alpha: 1 - span(u, 6.2, 6.6) });
  keycap(ctx, box.x + box.w - 110, box.y - 60, 'Ctrl', { pressed: ctrl ? 1 : 0, alpha: easeOut(span(u, 1.25, 1.45)) * (1 - span(u, 3.6, 4.0)) });

  const c1 = span(u, 0.2, 0.9) * (1 - span(u, 2.3, 2.5));
  const c2 = span(u, 2.5, 3.0) * (1 - span(u, 5.3, 5.5));
  const c3 = span(u, 5.5, 6.1);
  caption(ctx, L, s.s2a, c1, { sub: s.s2aSub, subProgress: c1 });
  caption(ctx, L, s.s2b, c2);
  caption(ctx, L, s.s2c, c3, { sub: s.s2cSub, subProgress: span(u, 5.8, 6.4) });
}

function scene3(ctx, W, H, u, s) {
  const L = layout(W, H);
  const pdfAppear = k => span(u, 3.9 + k * 0.15, 4.5 + k * 0.15);
  const files = [
    { name: s.files.report, type: 'docx' }, { name: s.files.slides, type: 'pptx' }, { name: s.files.budget, type: 'xlsx' },
    { name: s.files.contract, type: 'hwp' },
    { name: s.files.reportPdf, type: 'pdf', appear: pdfAppear(0) }, { name: s.files.slidesPdf, type: 'pdf', appear: pdfAppear(1) },
    { name: s.files.budgetPdf, type: 'pdf', appear: pdfAppear(2) },
  ];
  const box = L.stage;
  const selecting = span(u, 0.5, 1.2);
  const selected = selecting > 0.9 ? new Set([s.files.report, s.files.slides, s.files.budget]) : new Set();
  const marqueeW = L.portrait ? box.w - 60 : box.w * 0.72;
  const marqueeH = L.portrait ? 330 : 250;
  const tiles = explorer(ctx, box, s.window, files, { selected, rise: 1, marquee: selecting > 0 && selecting < 1 ? {
    x: box.x + 40, y: box.y + 96, w: marqueeW * easeOut(selecting), h: marqueeH * easeOut(selecting) } : undefined });

  const drop = { x: box.x + box.w * 0.5, y: box.y + box.h * (L.portrait ? 0.7 : 0.6) };
  const target = 0; // PDF
  const hoverPoint = { x: drop.x, y: drop.y - L.donutR * 0.72 };
  const start = tiles[s.files.slides];
  let cx = lerp(box.x + 40 + marqueeW, start.x, easeInOut(span(u, 1.2, 1.6)));
  let cy = lerp(box.y + 96 + marqueeH, start.y, easeInOut(span(u, 1.2, 1.6)));
  cx = lerp(cx, drop.x, easeInOut(span(u, 1.7, 2.2)));
  cy = lerp(cy, drop.y, easeInOut(span(u, 1.7, 2.2)));
  cx = lerp(cx, hoverPoint.x, easeInOut(span(u, 2.35, 2.8)));
  cy = lerp(cy, hoverPoint.y, easeInOut(span(u, 2.35, 2.8)));
  if (selecting > 0 && selecting < 1) {
    cx = box.x + 40 + marqueeW * easeOut(selecting);
    cy = box.y + 96 + marqueeH * easeOut(selecting);
  }
  const dragging = u > 1.7 && u < 3.0;
  donut(ctx, drop.x, drop.y, L.donutR, DOC_ITEMS, {
    open: span(u, 1.95, 2.45), hover: target, hoverAmount: easeOut(span(u, 2.7, 2.9)),
    title: s.threeDocs, hint: s.escToClose, collapse: span(u, 3.0, 3.4),
  });
  progressRing(ctx, drop.x, drop.y, L.ringR, {
    appear: span(u, 3.1, 3.5), value: easeInOut(span(u, 3.3, 4.1)), success: span(u, 4.1, 4.5), fade: span(u, 4.7, 5.0),
  });
  if (dragging)
    dragGhost(ctx, cx, cy, 'docx', 3);
  cursor(ctx, cx, cy, { pressed: dragging || (selecting > 0 && selecting < 1), alpha: 1 - span(u, 4.6, 4.9) });
  keycap(ctx, box.x + box.w - 110, box.y - 60, 'Ctrl', { pressed: dragging ? 1 : 0, alpha: easeOut(span(u, 1.5, 1.7)) * (1 - span(u, 3.2, 3.6)) });

  caption(ctx, L, s.s3a, span(u, 0.1, 0.7) * (1 - span(u, 4.0, 4.2)), { sub: s.s3aSub, subProgress: span(u, 0.3, 0.9) * (1 - span(u, 4.0, 4.2)) });
  caption(ctx, L, s.s3b, span(u, 4.2, 4.7));
}

/** A stylized page: header band, title, a small table and paragraphs — the same layout on both sides. */
function page(ctx, x, y, w, badge, badgeColor, { alpha = 1, highlight = 0 } = {}) {
  const h = w * 1.41;
  ctx.save();
  ctx.globalAlpha *= alpha;
  shadow(ctx, 50, 20, 0.18);
  roundRect(ctx, x, y, w, h, 16);
  ctx.fillStyle = C.white;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  const m = w * 0.1;
  // Header: logo block + line (a page header).
  ctx.fillStyle = '#7FB6E8';
  ctx.fillRect(x + m, y + m * 0.8, w * 0.18, w * 0.05);
  const g = ctx.createLinearGradient(x + w * 0.35, 0, x + w - m, 0);
  g.addColorStop(0, '#99CCFF');
  g.addColorStop(1, '#FFFFFF');
  ctx.fillStyle = g;
  ctx.fillRect(x + w * 0.35, y + m * 0.9, w * 0.55, w * 0.03);
  // Title.
  ctx.fillStyle = C.ink;
  ctx.fillRect(x + w * 0.3, y + w * 0.24, w * 0.4, w * 0.04);
  // Table.
  const tx = x + m;
  const ty = y + w * 0.36;
  const tw = w - m * 2;
  const rows = 5;
  const rh = w * 0.06;
  ctx.fillStyle = '#D9D9D9';
  ctx.fillRect(tx, ty, tw, rh);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(tx, ty, tw, rh * rows);
  ctx.lineWidth = 1;
  for (let r = 1; r < rows; r++) {
    ctx.beginPath();
    ctx.moveTo(tx, ty + r * rh);
    ctx.lineTo(tx + tw, ty + r * rh);
    ctx.stroke();
  }
  for (const f of [0.18, 0.42, 0.78]) {
    ctx.beginPath();
    ctx.moveTo(tx + tw * f, ty);
    ctx.lineTo(tx + tw * f, ty + rh * rows);
    ctx.stroke();
  }
  // Paragraphs.
  ctx.fillStyle = '#C8C6D8';
  for (let i = 0; i < 6; i++)
    ctx.fillRect(x + m, ty + rh * rows + w * 0.08 + i * w * 0.06, (w - m * 2) * (i === 5 ? 0.55 : 1), w * 0.022);
  // Footer page number.
  ctx.fillStyle = C.muted;
  ctx.fillRect(x + w / 2 - w * 0.04, y + h - m * 0.9, w * 0.08, w * 0.02);
  if (highlight > 0) {
    ctx.lineWidth = 6;
    ctx.strokeStyle = hexAlpha(C.green, highlight);
    roundRect(ctx, x - 3, y - 3, w + 6, h + 6, 18);
    ctx.stroke();
  }
  // Badge.
  pill(ctx, x + w / 2, y + h + 50, badge, { size: 28, background: badgeColor });
  ctx.restore();
}

function scene4(ctx, W, H, u, s) {
  const L = layout(W, H);
  const portrait = L.portrait;
  const pw = portrait ? 400 : 340;
  const leftX = portrait ? W / 2 - pw - 60 : L.stage.x + 40;
  const rightX = portrait ? W / 2 + 60 : L.stage.x + L.stage.w - pw - 40;
  const py = portrait ? 700 : 220;
  const inL = easeOut(span(u, 0.2, 0.8));
  const inR = easeOut(span(u, 1.2, 1.8));
  page(ctx, leftX - (1 - inL) * 120, py, pw, 'DOCX', TYPE_COLORS.docx, { alpha: inL });
  page(ctx, rightX + (1 - inR) * 120, py, pw, 'HWPX', TYPE_COLORS.hwpx, { alpha: inR, highlight: span(u, 1.8, 2.2) * (1 - span(u, 3.4, 3.8)) });
  // Arrow between the pages.
  const draw = easeInOut(span(u, 0.8, 1.3));
  const ax0 = leftX + pw + 16;
  const ax1 = rightX - 16;
  const ay = py + pw * 0.7;
  if (draw > 0) {
    ctx.save();
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.strokeStyle = C.accent;
    ctx.beginPath();
    ctx.moveTo(ax0, ay);
    ctx.lineTo(lerp(ax0, ax1, draw), ay);
    ctx.stroke();
    if (draw > 0.95) {
      ctx.beginPath();
      ctx.moveTo(ax1 - 22, ay - 20);
      ctx.lineTo(ax1, ay);
      ctx.lineTo(ax1 - 22, ay + 20);
      ctx.stroke();
    }
    ctx.restore();
  }
  const captionBottom = caption(ctx, L, s.s4a, span(u, 0.0, 0.6), { sub: s.s4aSub, subProgress: span(u, 0.3, 0.9) });
  // Chips.
  const chips = s.s4chips;
  const chipY = portrait ? py + pw * 1.41 + 200 : captionBottom + 70;
  chips.forEach((chip, i) => {
    const p = spring(span(u, 2.0 + i * 0.18, 2.6 + i * 0.18));
    if (portrait)
      pill(ctx, W / 2, chipY + i * 100, chip, { size: 32, color: C.accentDark, background: C.white, alpha: clamp(p * 2), scale: p });
    else
      pill(ctx, L.captionX, chipY + i * 90, chip, { size: 28, color: C.accentDark, background: C.white, alpha: clamp(p * 2), scale: p, align: 'left' });
  });
}

const screenshots = {};
export function useScreenshots(images) {
  Object.assign(screenshots, images);
}

function scene5(ctx, W, H, u, s, lang) {
  const L = layout(W, H);
  const img = screenshots[`toolbar-${lang}`];
  const appear = easeOut(span(u, 0.2, 1.0));
  if (img) {
    const maxW = L.portrait ? W - 120 : L.stage.w;
    const scale = Math.min(maxW / img.width, (L.portrait ? 900 : L.stage.h) / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = L.portrait ? (W - w) / 2 : L.stage.x + (L.stage.w - w) / 2;
    const y = (L.portrait ? 640 : L.stage.y + (L.stage.h - h) / 2) + (1 - appear) * 100;
    ctx.save();
    ctx.globalAlpha *= appear;
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((1 - appear) * -0.04);
    shadow(ctx, 80, 30, 0.25);
    roundRect(ctx, -w / 2, -h / 2, w, h, 22);
    ctx.fillStyle = C.white;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    roundRect(ctx, -w / 2, -h / 2, w, h, 22);
    ctx.clip();
    // Push in on the donut editor (profiles, donut, preset chips) of the settings window.
    const zoom = 1 + easeInOut(span(u, 1.0, 2.8)) * 0.55;
    const focusX = (655 / img.width - 0.5) * w * easeInOut(span(u, 1.0, 2.8));
    const focusY = (270 / img.height - 0.5) * h * easeInOut(span(u, 1.0, 2.8));
    ctx.scale(zoom, zoom);
    ctx.translate(-focusX, -focusY);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
  const captionBottom = caption(ctx, L, s.s5a, span(u, 0.0, 0.6), { sub: s.s5aSub, subProgress: span(u, 0.3, 0.9) });
  const chips = s.s5chips;
  chips.forEach((chip, i) => {
    const p = spring(span(u, 1.0 + i * 0.2, 1.6 + i * 0.2));
    const y = L.portrait ? 1560 : captionBottom + 70 + i * 90;
    const x = L.portrait ? W / 2 + (i - 1) * 290 : L.captionX;
    pill(ctx, x, y, chip, { size: 30, color: C.white, background: [C.accent, C.green, C.accentDark][i], alpha: clamp(p * 2), scale: p, align: L.portrait ? 'center' : 'left' });
  });
}

const FORMATS = ['JPG', 'PNG', 'WEBP', 'HEIC', 'AVIF', 'TIFF', 'BMP', 'GIF', 'ICO', 'PDF', 'DOCX', 'DOC', 'ODT', 'RTF',
  'HWP', 'HWPX', 'XLSX', 'PPTX', 'MD', 'HTML', 'TXT'];

function scene6(ctx, W, H, u, s, lang, extra) {
  const portrait = H > W;
  // Format marquee rows behind the end card.
  const rows = portrait ? 11 : 7;
  const step = 200;
  for (let r = 0; r < rows; r++) {
    const y = (portrait ? 120 : 90) + r * (portrait ? 170 : 150);
    const dir = r % 2 === 0 ? 1 : -1;
    const offset = ((u * 80 * dir) % step) - step;
    const appear = easeOut(span(u, r * 0.04, 0.6 + r * 0.04));
    for (let i = 0; i < Math.ceil(W / step) + 2; i++) {
      const label = FORMATS[(i + r * 5) % FORMATS.length];
      const x = offset + i * step + (r % 2) * step / 2;
      pill(ctx, x, y, label, { size: 32, color: C.accentDark, background: 'rgba(255,255,255,0.8)', alpha: 0.75 * appear });
    }
  }
  // End card.
  const card = easeOut(span(u, 0.3, 1.0));
  const cw = portrait ? W - 160 : 900;
  const ch = portrait ? 900 : 600;
  const x = (W - cw) / 2;
  const y = (H - ch) / 2 + (1 - card) * 60;
  ctx.save();
  ctx.globalAlpha *= card;
  shadow(ctx, 90, 30, 0.22);
  roundRect(ctx, x, y, cw, ch, 44);
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  ctx.fill();
  ctx.restore();
  const cx = W / 2;
  const logoY = y + (portrait ? 220 : 150);
  drawLogo(ctx, cx, logoY, portrait ? 260 : 200, { progress: span(u, 0.4, 1.6) });
  text(ctx, 'Filee', cx, logoY + (portrait ? 210 : 160), { size: portrait ? 100 : 86, weight: 800, alpha: easeOut(span(u, 0.8, 1.2)), letter: -2 });
  // extra: an optional bold line under the subtitle (the Threads cut's "no upload · no ads · free").
  const lineY = logoY + (portrait ? (extra ? 300 : 310) : (extra ? 232 : 240));
  text(ctx, s.s6a, cx, lineY, { size: portrait ? 40 : 34, weight: 600, color: C.muted, alpha: easeOut(span(u, 1.0, 1.4)) });
  if (extra)
    text(ctx, extra, cx, lineY + (portrait ? 72 : 58), { size: portrait ? 46 : 38, weight: 800, color: C.accentDark, alpha: easeOut(span(u, 1.15, 1.55)) });
  const p = spring(span(u, 1.3, 1.9));
  pill(ctx, cx, logoY + (portrait ? (extra ? 500 : 450) : (extra ? 370 : 350)), s.s6cta, { size: portrait ? 44 : 38, alpha: clamp(p * 2), scale: p });
}

const SCENES = [
  [0, 2.6, scene1],
  [2.6, 10.4, scene2],
  [10.4, 15.6, scene3],
  [15.6, 19.8, scene4],
  [19.8, 23.4, scene5],
  [23.4, DURATION, scene6],
];

/** Draws the frame at time t (seconds) of the full video. */
export function render(ctx, t, lang) {
  renderScenes(ctx, t, lang, SCENES, { mark: [2.6, 23.2] });
}

/**
 * Cross-fades the scenes active at t and shows the brand mark in the corner between mark[0] and mark[1].
 * firstVisible draws the first scene at full opacity from frame 0, for cuts whose first frame is the thumbnail.
 */
function renderScenes(ctx, t, lang, scenes, { mark, firstVisible = false }) {
  const { width: W, height: H } = ctx.canvas;
  const s = STRINGS[lang];
  background(ctx, W, H, t);
  const fade = 0.35;
  for (const [start, end, scene] of scenes) {
    if (t < start - fade || t > end + fade)
      continue;
    const fadeIn = firstVisible && start === 0 ? 1 : span(t, start - fade, start + fade * 0.2);
    const alpha = Math.min(fadeIn, 1 - span(t, end - fade * 0.2, end + fade));
    if (alpha <= 0)
      continue;
    ctx.save();
    ctx.globalAlpha = alpha;
    scene(ctx, W, H, t - start, s, lang);
    ctx.restore();
  }
  const markAlpha = span(t, mark[0], mark[0] + 0.6) * (1 - span(t, mark[1], mark[1] + 0.4));
  if (markAlpha > 0) {
    drawLogo(ctx, 70, H - 70, 60, {});
    text(ctx, 'filee.sh', 115, H - 70, { size: 28, weight: 700, color: C.accentDark, align: 'left', alpha: markAlpha });
  }
}

// ───────────────────────── Threads / Reels cut ─────────────────────────

/**
 * Hook: a cluttered converter website (ads, a pop-up, a queue, a daily limit, a contract being uploaded) gets
 * crossed out. Everything is drawn from frame 0, because the first frame is the thumbnail in the feed.
 */
function sceneHook(ctx, W, H, u, s) {
  const c = s.cut;
  const portrait = H > W;
  // Portrait keeps the headline and the card inside the central 4:5 area, in case a feed crops the video.
  const titleY = portrait ? 330 : 110;
  const titleH = headline(ctx, c.hook, W / 2, titleY, portrait ? 84 : 70, 1, { maxWidth: W - 100 });
  headline(ctx, c.hookSub, W / 2, titleY + titleH + 24, portrait ? 40 : 32, 1, { maxWidth: W - 140, color: C.muted, weight: 600 });

  const card = portrait ? { x: 90, y: 680, w: W - 180, h: 780 } : { x: W / 2 - 520, y: 360, w: 1040, h: 560 };
  const k = portrait ? 1 : 0.8;
  ctx.save();
  shadow(ctx, 60, 24, 0.18);
  roundRect(ctx, card.x, card.y, card.w, card.h, 28);
  ctx.fillStyle = C.white;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  roundRect(ctx, card.x, card.y, card.w, card.h, 28);
  ctx.clip();
  // Browser bar.
  ctx.fillStyle = '#ECEAE6';
  ctx.fillRect(card.x, card.y, card.w, 66);
  ['#FF6159', '#FFBD2E', '#28C941'].forEach((color, i) => {
    ctx.beginPath();
    ctx.arc(card.x + 36 + i * 30, card.y + 33, 9, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
  roundRect(ctx, card.x + 140, card.y + 16, card.w - 180, 34, 17);
  ctx.fillStyle = C.white;
  ctx.fill();
  text(ctx, c.site, card.x + card.w / 2, card.y + 66 + 64 * k, { size: 44 * k, weight: 800 });
  // Blinking ad banner.
  const ad = { x: card.x + 40, y: card.y + 66 + 124 * k, w: card.w - 80, h: 150 * k };
  ctx.save();
  roundRect(ctx, ad.x, ad.y, ad.w, ad.h, 14);
  ctx.clip();
  ctx.fillStyle = '#FFE9A8';
  ctx.fillRect(ad.x, ad.y, ad.w, ad.h);
  ctx.strokeStyle = '#FFD66B';
  ctx.lineWidth = 18;
  for (let sx = ad.x - ad.h; sx < ad.x + ad.w; sx += 56) {
    ctx.beginPath();
    ctx.moveTo(sx, ad.y + ad.h);
    ctx.lineTo(sx + ad.h, ad.y);
    ctx.stroke();
  }
  ctx.restore();
  text(ctx, c.ad, ad.x + ad.w / 2, ad.y + ad.h / 2, { size: 64 * k, weight: 800, color: '#B7791F', alpha: 0.7 + 0.3 * Math.sin(u * 12) });
  // Upload box with a contract crawling up.
  const box = { x: card.x + 40, y: ad.y + ad.h + 40 * k, w: card.w - 80, h: 250 * k };
  ctx.setLineDash([14, 10]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#C9C5E8';
  roundRect(ctx, box.x, box.y, box.w, box.h, 20);
  ctx.stroke();
  ctx.setLineDash([]);
  fileIcon(ctx, box.x + 40, box.y + (box.h - 110 * k * 1.22) / 2, 110 * k, 'pdf');
  const value = 0.12 + 0.25 * easeOut(span(u, 0, 1.4));
  const tx = box.x + 190 * k;
  text(ctx, c.file, tx, box.y + box.h * 0.3, { size: 36 * k, weight: 700, align: 'left' });
  roundRect(ctx, tx, box.y + box.h * 0.52, box.w - 230 * k, 22 * k, 11 * k);
  ctx.fillStyle = '#EEEDF3';
  ctx.fill();
  roundRect(ctx, tx, box.y + box.h * 0.52, (box.w - 230 * k) * value, 22 * k, 11 * k);
  ctx.fillStyle = C.accent;
  ctx.fill();
  text(ctx, `${c.uploading} ${Math.round(value * 100)}%`, tx, box.y + box.h * 0.78, { size: 30 * k, weight: 600, color: C.muted, align: 'left' });
  // Queue and daily limit.
  const badgeY = box.y + box.h + 70 * k;
  const first = pill(ctx, card.x + 40, badgeY, c.queue, { size: 30 * k, color: '#B42318', background: '#FDE7E4', align: 'left' });
  pill(ctx, card.x + 40 + first + 20, badgeY, c.limit, { size: 30 * k, color: '#B42318', background: '#FDE7E4', align: 'left' });
  ctx.restore();

  // Pop-up ad on top.
  const pop = spring(span(u, 0.45, 0.85));
  if (pop > 0) {
    ctx.save();
    ctx.translate(card.x + card.w * 0.6, card.y + card.h * 0.52);
    ctx.rotate(-0.04);
    ctx.scale(pop * k, pop * k);
    shadow(ctx, 50, 20, 0.28);
    roundRect(ctx, -280, -110, 560, 220, 22);
    ctx.fillStyle = C.white;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#F2B8B5';
    ctx.stroke();
    text(ctx, '✕', 240, -76, { size: 32, weight: 700, color: C.muted });
    headline(ctx, c.popup, 0, -20, 38, 1, { maxWidth: 440, color: '#B42318' });
    ctx.restore();
  }

  // Crossed out with a "no" sign.
  const no = spring(span(u, 1.45, 1.85));
  if (no > 0) {
    ctx.save();
    ctx.globalAlpha *= clamp(no * 1.5);
    roundRect(ctx, card.x, card.y, card.w, card.h, 28);
    ctx.fillStyle = 'rgba(246, 244, 240, 0.6)';
    ctx.fill();
    const cx = card.x + card.w / 2;
    const cy = card.y + card.h / 2;
    const r = (portrait ? 200 : 170) * no;
    ctx.lineWidth = portrait ? 38 : 30;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#E5484D';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.7, cy - r * 0.7);
    ctx.lineTo(cx + r * 0.7, cy + r * 0.7);
    ctx.stroke();
    ctx.restore();
  }
  headline(ctx, c.after, W / 2, card.y + card.h + (portrait ? 100 : 70), portrait ? 58 : 46, span(u, 1.8, 2.3),
    { maxWidth: W - 120, color: C.accentDark });
}

/** Everyday conversions, one row each (source → target), so the pitch isn't about a single format. */
function sceneUses(ctx, W, H, u, s) {
  const c = s.cut;
  const L = layout(W, H);
  const bottom = caption(ctx, L, c.usesTitle, span(u, 0, 0.5));
  const portrait = L.portrait;
  const rowH = portrait ? 128 : 92;
  const gap = portrait ? 22 : 12;
  const top = portrait ? Math.max(bottom + 40, 470) : L.stage.y - 40;
  const x = portrait ? 80 : L.stage.x;
  const w = portrait ? W - 160 : L.stage.w;
  c.uses.forEach(([from, to, label], i) => {
    const p = spring(span(u, 0.45 + i * 0.4, 0.95 + i * 0.4));
    if (p <= 0)
      return;
    const y = top + i * (rowH + gap);
    ctx.save();
    ctx.globalAlpha *= clamp(p * 2);
    ctx.translate((1 - p) * 80, 0);
    shadow(ctx, 30, 10, 0.12);
    roundRect(ctx, x, y, w, rowH, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    const iw = rowH * 0.5;
    const iy = y + (rowH - iw * 1.22) / 2;
    fileIcon(ctx, x + 36, iy, iw, from);
    text(ctx, '→', x + 36 + iw + 40, y + rowH / 2, { size: rowH * 0.32, weight: 800, color: C.accent });
    fileIcon(ctx, x + 36 + iw + 80, iy, iw, to);
    const lx = x + 36 + iw * 2 + 120;
    text(ctx, label, lx, y + rowH / 2, { size: portrait ? 36 : 28, weight: 700, align: 'left', maxWidth: w - (lx - x) - 90 });
    const ok = spring(span(u, 0.8 + i * 0.4, 1.2 + i * 0.4));
    if (ok > 0) {
      const cx = x + w - 50;
      const cy = y + rowH / 2;
      const r = rowH * 0.19 * ok;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = C.green;
      ctx.fill();
      ctx.lineWidth = r * 0.28;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = C.white;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.4, cy + r * 0.02);
      ctx.lineTo(cx - r * 0.1, cy + r * 0.32);
      ctx.lineTo(cx + r * 0.45, cy - r * 0.3);
      ctx.stroke();
    }
    ctx.restore();
  });
}

export const THREADS_DURATION = 17.8;

const THREADS_SCENES = [
  [0, 2.6, sceneHook],
  // The full video's gesture scene (7.8 s), played 1.3× faster.
  [2.6, 8.6, (ctx, W, H, u, s) => scene2(ctx, W, H, u * 1.3, s)],
  [8.6, 14.2, sceneUses],
  [14.2, THREADS_DURATION, (ctx, W, H, u, s, lang) => scene6(ctx, W, H, u, s, lang, s.cut.endLine)],
];

/** Draws the frame at time t of the short Threads / Reels cut. */
export function renderThreads(ctx, t, lang) {
  renderScenes(ctx, t, lang, THREADS_SCENES, { mark: [2.6, 14.0], firstVisible: true });
}

/** Every renderable cut by name (the studio's cut selector and the last argument of studio.video). */
export const CUTS = {
  full: { duration: DURATION, render },
  threads: { duration: THREADS_DURATION, render: renderThreads },
};

// ───────────────────────── Stills ─────────────────────────

/** Poster frames used for images: the time of a characteristic moment in each scene. */
export const MOMENTS = { intro: 2.3, drag: 5.55, done: 9.0, batch: 12.6, hwp: 18.4, customize: 22.6, end: 26.0 };

// Drawing helpers shared with the stills (stills.js).
export const draw = { background, drawLogo, donut, progressRing, fileIcon, cursor, keycap, pill, pillWidth, page, text, headline, explorer, shadow, roundRect, C };

