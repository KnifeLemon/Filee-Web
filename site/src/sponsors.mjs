// The sponsors (logos) and backers (names) of Filee: a section on the home page, and the sponsors' logos under the
// hero's download button and in the after-download dialog. The list is the app's own,
// src/Filee.App/Assets/Sponsors/sponsors.json in the Filee repository, read from GitHub at build time with its logos,
// which are copied to /media/sponsors/ (the CSP allows images from this site only). Without anyone listed, or when
// GitHub can't be reached, the section is left out.
// SPONSORS=<folder> reads a local folder instead (e.g. ../../Filee/src/Filee.App/Assets/Sponsors before it is merged).

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { REPO, escape } from './layout.mjs';

const RAW = 'https://raw.githubusercontent.com/KnifeLemon/Filee/main/src/Filee.App/Assets/Sponsors/';

export const NOBODY = { sponsors: [], backers: [] };

/** A logo file name from sponsors.json: a plain PNG name, nothing that could leave the folder. */
const logoName = name => typeof name === 'string' && /^[\w.-]+\.png$/i.test(name) && !name.startsWith('.') ? name : null;

async function get(url, as) {
  if (process.env.SPONSORS) {
    const bytes = await readFile(join(process.env.SPONSORS, url.slice(RAW.length)));
    return as === 'json' ? JSON.parse(bytes.toString('utf8')) : bytes;
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return as === 'json' ? response.json() : Buffer.from(await response.arrayBuffer());
}

/**
 * The listed supporters, each logo with its bytes: { sponsors: [{ name, url, logo, logoDark }], backers: [{ name, url }] }
 * where logo / logoDark are { file, bytes } or null.
 */
export async function loadSupporters() {
  try {
    const list = await get(`${RAW}sponsors.json`, 'json');
    const named = entries => (Array.isArray(entries) ? entries : [])
      .filter(e => typeof e?.name === 'string' && e.name.trim())
      .map(e => ({ name: e.name.trim(), url: /^https:\/\//.test(e.url ?? '') ? e.url : null, logo: logoName(e.logo), logoDark: logoName(e.logoDark) }));
    const logo = async file => file ? { file, bytes: await get(RAW + file) } : null;
    const sponsors = await Promise.all(named(list.sponsors).map(async s => ({ ...s, logo: await logo(s.logo), logoDark: await logo(s.logoDark) })));
    return { sponsors, backers: named(list.backers).map(({ name, url }) => ({ name, url })) };
  } catch (error) {
    console.warn(`sponsors: none listed on the site (${error.message})`);
    return NOBODY;
  }
}

/** Pixel size of a PNG (from its IHDR chunk), so a logo gets width/height and doesn't shift the layout; null if unreadable. */
function pngSize(bytes) {
  if (!bytes || bytes.length < 24 || bytes.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

/** Every logo to write under dist/media/sponsors/. */
export const logoFiles = supporters => supporters.sponsors.flatMap(s => [s.logo, s.logoDark]).filter(Boolean);

/** A supporter's link (rel="sponsored", new tab), or a plain span without a URL. */
const link = (url, html, cls = '') => url
  ? `<a${cls ? ` class="${cls}"` : ''} href="${escape(url)}" rel="sponsored noopener" target="_blank">${html}</a>`
  : `<span${cls ? ` class="${cls}"` : ''}>${html}</span>`;

/** A sponsor's logo with its dark-theme version when there is one, or the name in bold without a logo. */
function logo(s, { lazy = true } = {}) {
  if (!s.logo) return `<b>${escape(s.name)}</b>`;
  const size = pngSize(s.logo.bytes);
  return `<picture>${s.logoDark ? `<source srcset="/media/sponsors/${s.logoDark.file}" media="(prefers-color-scheme: dark)">` : ''}<img src="/media/sponsors/${s.logo.file}" alt="${escape(s.name)}"${size ? ` width="${size.width}" height="${size.height}"` : ''}${lazy ? ' loading="lazy"' : ''} decoding="async"></picture>`;
}

/** A logo without a dark version gets a light backing in the dark theme. */
const lightOnly = s => Boolean(s.logo && !s.logoDark);

/** "Sponsored by" and the sponsors' logos under the home page's download button, or '' while no sponsor is listed. */
export function heroSponsors(t, supporters) {
  const { sponsors } = supporters;
  if (!sponsors.length) return '';
  return `
      <div class="hero-sponsors" data-reveal>
        <span class="hero-sponsors-label">${escape(t.hero.sponsored)}</span>
        <ul>${sponsors.map(s => `<li>${link(s.url, logo(s, { lazy: false }), lightOnly(s) ? 'hero-sponsor light-only' : 'hero-sponsor')}</li>`).join('')}</ul>
      </div>`;
}

/** The sponsors for the after-download dialog (main.js adds the line), or undefined while no sponsor is listed. */
export function dialogSponsors(supporters) {
  const { sponsors } = supporters;
  if (!sponsors.length) return undefined;
  return sponsors.map(s => ({
    name: s.name,
    url: s.url,
    logo: s.logo ? `/media/sponsors/${s.logo.file}` : null,
    logoDark: s.logoDark ? `/media/sponsors/${s.logoDark.file}` : null,
    size: s.logo ? pngSize(s.logo.bytes) : null,
  }));
}

/** The home page section, or '' while nobody is listed. */
export function supportersSection(t, supporters) {
  const { sponsors, backers } = supporters;
  if (!sponsors.length && !backers.length) return '';
  return `<section class="section" id="sponsors">
    <header class="section-head" data-reveal><h2>${escape(t.supporters.title)}</h2><p>${escape(t.supporters.lead)}</p></header>
    <div class="supporters" data-reveal>
      ${sponsors.length ? `<ul class="supporters-logos">${sponsors.map(s => `<li>${link(s.url, logo(s), lightOnly(s) ? 'supporter-logo light-only' : 'supporter-logo')}</li>`).join('')}</ul>` : ''}
      ${backers.length ? `<ul class="supporters-names">${backers.map(b => `<li>${link(b.url, escape(b.name))}</li>`).join('')}</ul>` : ''}
      <p class="supporters-join"><a href="${REPO}${t.supporters.readme}" rel="noopener">${escape(t.supporters.join)}</a></p>
    </div>
  </section>`;
}
