// Still images built from the same drawing code as the video: a Threads / Instagram carousel (4:5),
// Open Graph cards (1200×630) and the GitHub social preview / README banner (1280×640).

import { draw, useScreenshots } from './promo.js';
import { STRINGS } from './strings.js';

const { background, drawLogo, donut, fileIcon, cursor, keycap, pill, pillWidth, page, text, headline, shadow, roundRect, C } = draw;

const EXTRA = {
  en: {
    coverSub: 'The free file converter you use by dragging',
    howTitle: 'Ctrl + drag. Done.',
    steps: ['Hold Ctrl and drag a file', 'Drop it on a format', 'Saved next to the original'],
    formatsTitle: 'Photos, videos and HWP',
    formatsSub: '180 formats: images, documents, HWP, video, audio',
    ctaTitle: 'Get it free',
    ctaSub: 'Free · Open source (MIT) · Windows 10/11',
    ctaButton: 'Download at filee.sh',
    privacy: 'Your files never leave your PC',
  },
  ko: {
    coverSub: '드래그 한 번으로 끝나는 무료 파일 변환기',
    howTitle: 'Ctrl + 드래그, 끝.',
    steps: ['Ctrl 누르고 파일 끌기', '원하는 형식에 놓기', '원본 옆에 바로 저장'],
    formatsTitle: '사진부터 영상, 한글 문서까지',
    formatsSub: '이미지 · 문서 · 한글 · 영상 · 오디오 · 180가지 형식',
    ctaTitle: '지금 무료로 받아보세요',
    ctaSub: '무료 · 오픈소스 (MIT) · Windows 10/11',
    ctaButton: 'filee.sh 에서 다운로드',
    privacy: '파일은 내 PC 밖으로 나가지 않아요',
  },
  'zh-CN': {
    coverSub: '拖一下就能完成的免费文件转换器',
    howTitle: 'Ctrl + 拖动，完成。',
    steps: ['按住 Ctrl 拖动文件', '放到目标格式上', '直接保存在原文件旁'],
    formatsTitle: '照片、视频到 HWP 文档',
    formatsSub: '图片 · 文档 · HWP · 视频 · 音频 · 180 种格式',
    ctaTitle: '免费下载',
    ctaSub: '免费 · 开源 (MIT) · Windows 10/11',
    ctaButton: '前往 filee.sh 下载',
    privacy: '文件不会离开你的电脑',
  },
};

const IMAGE_ITEMS = [['PNG'], ['WEBP'], ['PDF'], ['JPG', '70%'], ['ICO'], ['BMP'], ['TIFF'], ['AVIF']];

function footer(ctx, W, H) {
  drawLogo(ctx, 70, H - 70, 56, {});
  text(ctx, 'filee.sh', 112, H - 70, { size: 28, weight: 700, color: C.accentDark, align: 'left' });
  text(ctx, 'github.com/KnifeLemon/Filee', W - 60, H - 70, { size: 24, weight: 500, color: C.muted, align: 'right' });
}

/** The donut with a hovered slice, the cursor on it and the dragged picture: the product in one image. */
function hero(ctx, cx, cy, R, s) {
  donut(ctx, cx, cy, R, IMAGE_ITEMS, { open: 1, hover: 1, hoverAmount: 1, title: s.oneJpg, hint: s.escToClose });
  const angle = -Math.PI / 2 + 2 * Math.PI / 8;
  const x = cx + Math.cos(angle) * R * 0.74;
  const y = cy + Math.sin(angle) * R * 0.74;
  fileIcon(ctx, x + 18, y + 26, R * 0.22, 'jpg');
  cursor(ctx, x, y, { pressed: true, scale: R / 320 });
}

/** Pills centred on cx with equal gaps: labels differ in width, so evenly spaced centres look uneven. */
function pillRow(ctx, cx, y, labels, gap, style) {
  const styles = labels.map((_, i) => (typeof style === 'function' ? style(i) : style));
  const widths = labels.map((label, i) => pillWidth(ctx, label, styles[i].size));
  let x = cx - (widths.reduce((a, b) => a + b, 0) + gap * (labels.length - 1)) / 2;
  labels.forEach((label, i) => {
    pill(ctx, x, y, label, { ...styles[i], align: 'left' });
    x += widths[i] + gap;
  });
}

const SLIDES = {
  'threads-1': (ctx, W, H, s, e) => {
    drawLogo(ctx, W / 2, 360, 320);
    text(ctx, 'Filee', W / 2, 610, { size: 120, weight: 800, letter: -3 });
    headline(ctx, s.tagline, W / 2, 740, 64, 1, { color: C.accentDark, maxWidth: W - 120 });
    headline(ctx, e.coverSub, W / 2, 840, 38, 1, { color: C.muted, weight: 600, maxWidth: W - 160 });
    pillRow(ctx, W / 2, 1010, ['JPG', 'PNG', 'PDF', 'DOCX', 'HWPX'], 28, { size: 30, color: C.accentDark, background: C.white });
    footer(ctx, W, H);
  },
  'threads-2': (ctx, W, H, s, e) => {
    headline(ctx, e.howTitle, W / 2, 150, 80, 1, { maxWidth: W - 120 });
    hero(ctx, W / 2, 610, 330, s);
    keycap(ctx, W / 2 + 330, 290, 'Ctrl', { pressed: 1 });
    e.steps.forEach((step, i) => {
      const y = 1030 + i * 76;
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2 - 300, y, 26, 0, Math.PI * 2);
      ctx.fillStyle = [C.accent, C.accentMid, C.green][i];
      ctx.fill();
      ctx.restore();
      text(ctx, String(i + 1), W / 2 - 300, y + 1, { size: 28, weight: 800, color: C.white });
      text(ctx, step, W / 2 - 250, y, { size: 38, weight: 700, align: 'left' });
    });
    footer(ctx, W, H);
  },
  'threads-3': (ctx, W, H, s, e) => {
    headline(ctx, e.formatsTitle, W / 2, 150, 76, 1, { maxWidth: W - 120 });
    headline(ctx, e.formatsSub, W / 2, 330, 36, 1, { color: C.muted, weight: 600, maxWidth: W - 140 });
    const types = ['jpg', 'png', 'heic', 'pdf', 'docx', 'pptx', 'hwp', 'hwpx', 'mp4', 'mp3'];
    types.forEach((type, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      fileIcon(ctx, 90 + col * 190, 480 + row * 300, 140, type);
    });
    ['⇄  ' + s.s4chips[0], '⇄  ' + s.s4chips[1]].forEach((chip, i) =>
      pill(ctx, W / 2 + (i === 0 ? -230 : 230), 1120, chip, { size: 30, color: C.white, background: i === 0 ? C.accent : C.green }));
    footer(ctx, W, H);
  },
  'threads-4': (ctx, W, H, s) => {
    headline(ctx, s.s4a, W / 2, 150, 72, 1, { maxWidth: W - 120 });
    headline(ctx, s.s4aSub, W / 2, 320, 34, 1, { color: C.muted, weight: 600, maxWidth: W - 160 });
    page(ctx, W / 2 - 440, 470, 380, 'DOCX', '#2B579A');
    page(ctx, W / 2 + 60, 470, 380, 'HWPX', '#1B7FC4', { highlight: 1 });
    ctx.save();
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.strokeStyle = C.accent;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 50, 740);
    ctx.lineTo(W / 2 + 40, 740);
    ctx.moveTo(W / 2 + 18, 718);
    ctx.lineTo(W / 2 + 40, 740);
    ctx.lineTo(W / 2 + 18, 762);
    ctx.stroke();
    ctx.restore();
    pillRow(ctx, W / 2, 1150, s.s4chips, 32, { size: 30, color: C.accentDark, background: C.white });
    footer(ctx, W, H);
  },
  'threads-5': (ctx, W, H, s, e, lang, shots) => {
    headline(ctx, s.s5a, W / 2, 150, 80, 1, { maxWidth: W - 120 });
    headline(ctx, s.s5aSub, W / 2, 300, 36, 1, { color: C.muted, weight: 600, maxWidth: W - 160 });
    const img = shots[`toolbar-${lang}`];
    if (img) {
      // The donut editor part of the settings window, large.
      const crop = { x: 250, y: 60, w: 810, h: 440 };
      const w = W - 120;
      const h = w * crop.h / crop.w;
      const x = 60;
      const y = 430;
      ctx.save();
      shadow(ctx, 70, 26, 0.22);
      roundRect(ctx, x, y, w, h, 28);
      ctx.fillStyle = C.white;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      roundRect(ctx, x, y, w, h, 28);
      ctx.clip();
      ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, x, y, w, h);
      ctx.restore();
    }
    pillRow(ctx, W / 2, 1090, s.s5chips, 32, i => ({ size: 32, background: [C.accent, C.green, C.accentDark][i] }));
    footer(ctx, W, H);
  },
  'threads-6': (ctx, W, H, s, e) => {
    ctx.save();
    shadow(ctx, 90, 30, 0.2);
    roundRect(ctx, 90, 180, W - 180, 920, 48);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();
    ctx.restore();
    drawLogo(ctx, W / 2, 420, 280);
    text(ctx, 'Filee', W / 2, 640, { size: 110, weight: 800, letter: -3 });
    headline(ctx, e.ctaTitle, W / 2, 760, 56, 1, { color: C.accentDark, maxWidth: W - 260 });
    text(ctx, e.ctaSub, W / 2, 850, { size: 34, weight: 600, color: C.muted });
    pill(ctx, W / 2, 970, e.ctaButton, { size: 44 });
    text(ctx, '🔒 ' + e.privacy, W / 2, 1180, { size: 34, weight: 600, color: C.accentDark });
    footer(ctx, W, H);
  },
  og: (ctx, W, H, s, e) => {
    const left = 80;
    const textWidth = W * 0.5;
    drawLogo(ctx, left + 46, 120, 92);
    text(ctx, 'Filee', left + 108, 122, { size: 60, weight: 800, align: 'left', letter: -2 });
    let y = 230;
    y += headline(ctx, s.tagline, left, y, 58, 1, { align: 'left', maxWidth: textWidth });
    y += 10;
    y += headline(ctx, e.coverSub, left, y, 28, 1, { align: 'left', color: C.muted, weight: 600, maxWidth: textWidth });
    let x = left;
    for (const label of ['JPG', 'PDF', 'DOCX', 'HWPX'])
      x += pill(ctx, x, Math.max(y + 60, H - 150), label, { size: 24, color: C.accentDark, background: C.white, align: 'left' }) + 14;
    hero(ctx, W - H * 0.42, H / 2 + 6, H * 0.34, s);
    text(ctx, 'filee.sh', W - 50, H - 36, { size: 24, weight: 700, color: C.accentDark, align: 'right' });
  },
};

export const STILL_NAMES = Object.keys(SLIDES);
export const STILL_SIZES = { og: [1200, 630], social: [1280, 640] };

/** Draws a named still for a language on ctx (whose canvas already has the right size). */
export function renderStill(ctx, name, lang, shots) {
  const { width: W, height: H } = ctx.canvas;
  background(ctx, W, H, 1.3);
  const slide = SLIDES[name] ?? SLIDES.og;
  slide(ctx, W, H, STRINGS[lang], EXTRA[lang], lang, shots);
}

export { useScreenshots };
