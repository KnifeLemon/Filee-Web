# filee.sh

The Filee website: a static, dependency-free site in twenty-two languages (English, Korean, Simplified Chinese, Traditional Chinese, Polish, Spanish, Hindi, Japanese, Russian, Arabic, Brazilian Portuguese, French, Nepali, Thai, Turkish, European Portuguese, German, Italian, Indonesian, Vietnamese, Bengali, Persian), deployed to Cloudflare Workers (static assets, plus a small Worker for the preset gallery's download counter).

```
site/
  src/catalog.mjs           THE data module: app version, formats, what converts to what, engines, conversion
                            guide pairs, FAQ. Every format/support claim and every count on the site comes from here
  src/languages.mjs         THE language list: code, URL prefix, names, html lang/hreflang, Open Graph locale, browser
                            languages that pick it, short URLs, font, media language, list/size wording
  src/texts/<lang>.mjs      catalog texts of the languages after en, ko, zh-CN (zh-TW, pl, es, hi, ja, ru, ar, pt-BR, fr, ne, th, tr, pt-PT, de, it, id, vi, bn-BD, fa): English text → translation
  i18n/<lang>.json          page text (UI and marketing copy), one file per language; {placeholders} are filled
                            from the catalog
  src/layout.mjs            shared frame: <head> (meta, canonical, hreflang, Open Graph), nav, footer, icons
  src/page.mjs              home page (hero, demo, feature showcase, what's new, features, format categories, HWP, FAQ, specs) and the
                            404 page
  src/formats-page.mjs      format catalog: /formats/, /ko/formats/, /zh-cn/formats/, /pl/formats/…
  src/convert-page.mjs      conversion guides: /convert/<from>-to-<to>/ (and /ko/…, /zh-cn/…, /pl/…, /es/…, /hi/…, /ja/…, /ru/…, /ar/…, /pt-br/…)
  src/presets-page.mjs      preset gallery: /presets/ (tabs, filters, search, the guide to sharing) and /presets/<id>/
  src/presets.mjs           the gallery's data: Filee-Presets' index.json and files, likes and comments (GitHub), downloads (D1)
  src/preset-stats.mjs      Hot and Best rankings (shared by the build and gallery.js)
  src/gallery.js            the gallery's tabs, filters and search in the browser
  src/llms.mjs              llms.txt and llms-full.txt
  src/sponsors.mjs          sponsors: the app's sponsors.json and logos, read from GitHub at build time, shown in a
                            home page section, under the hero's download button and in the after-download dialog;
                            nothing while nobody is listed (SPONSORS=<folder> reads a local copy)
  src/styles.css            styles (light/dark, responsive, reduced motion)
  src/main.js               interactions: drag & drop demo, reveals, lazy video, the showcase's clips and scroll motion,
                            GitHub release info and installer link
  public/                   copied as-is: media (video, posters, OG images, screenshots, showcase clips), icons
  vendor/gsap/              GSAP and ScrollTrigger (npm gsap 3.15.0, dist/*.min.js), served from this site as hashed
                            assets; only the showcase loads them, and not with reduced motion
  build.mjs                 → dist/: all pages, hashed assets, sitemap.xml, robots.txt, llms(-full).txt, 404,
                            _headers, _redirects; stops on catalog or i18n inconsistencies
  check.mjs                 checks dist/: titles, descriptions, canonical, hreflang reciprocity, JSON-LD, links, sitemap
  serve.mjs                 local preview with rebuild on change
  worker/index.mjs          the Worker: /presets/download/<id> only (serves the file, counts it per day in D1)
  presets.test.mjs          tests of the rankings, the index entries and the Worker (node --test)
  wrangler.jsonc            Cloudflare config (custom domain filee.sh, the Worker's routes, the D1 binding)
```

## Develop

```bash
cd site
node serve.mjs        # http://localhost:4174, rebuilds when src/, i18n/ or public/ change
npm run check         # build + check.mjs (no install needed); run it before committing
```

No `npm install` is needed to build, check or preview; Wrangler is only needed to deploy.

- **Formats, engines, counts, version**: edit `src/catalog.mjs` only (see below).
- **Text**: edit `i18n/*.json`. Every language must have the same keys (the build checks it). `{formatTotal}`,
  `{engineNames}`, `{version}`… are filled from the catalog; conversion page templates also get `{from}`, `{to}`
  and Korean particles (`{fromEul}` → "HEIC를", `{toRo}` → "JPG로"). Counts take plural forms by the language's
  rules: `{n|one:# format|other:# formats}`, Polish `{n|one:# format|few:# formaty|many:# formatów}` (categories of
  `Intl.PluralRules`, `#` is the number).
- **Catalog texts** (`T(en, ko, zh)` in `catalog.mjs`): English, Korean and Chinese are written in place; every other
  language has a dictionary `src/texts/<lang>.mjs` of `[English text, translation]` pairs. Changing or adding an English
  text makes the build fail until each dictionary has the new text (it names the missing and the stale entries), so
  no language silently falls back to English. Where the same English text needs two translations, the T() call gets a
  context and the dictionaries key it as `English [context]` (see `plain` of CAD drawings).
- **New language** (e.g. Vietnamese):
  1. Add it to `src/languages.mjs`: code, `path` (`/vi/`), name, `htmlLang`, `ogLocale`, the browser languages
     that pick it (`match`), font (a script Inter lacks needs fonts in `FONTS` of layout.mjs and `styles.css`, as
     Hindi, Japanese, Arabic and Bengali have), `dir: 'rtl'` for a right-to-left script, `media` (`'en'` until marketing/
     renders its video, poster and OG image), the list and size wording.
     Right to left: `<html dir="rtl">` mirrors the grid and flex layouts by itself because `styles.css` uses logical
     properties (`margin-inline-start`, `padding-inline-end`, `inset-inline-end`, `text-align: start`); keep it that
     way when adding styles. Arrows and chevrons are mirrored with `scale: -1 1` under `[dir="rtl"]`; the marquee,
     file icons, terminals and code stay left to right. Arabic and Persian get no letter-spacing (it breaks the joined letters).
  2. Add `i18n/vi.json` with every key of `en.json`.
  3. Add `src/texts/vi.mjs` with every catalog text (copy `pl.mjs` and replace the right-hand side).
  4. `npm run check`. Pages, hreflang, the sitemap, the language menu, the language redirect and suggestion, the 404
     page, `_redirects` and llms.txt pick it up; the check names anything missing.
  5. When the app has the language too, add it to the app's language lists: `features` and `specs` in every
     `i18n/*.json`, `src/llms.mjs` and `src/pad.mjs`.
- **Media**: the promo video, posters and images come from `marketing/` (see `marketing/README.md`); the showcase clips
  (`public/media/demos/<clip>.mp4` and their `.webp` posters) from `python marketing/export.py demos`, the What's new
  clips (`public/media/whats-new/<release>/`, the app's What's new slides; `WHATS_NEW` in `src/page.mjs`) from
  `python marketing/export.py whats-new <version>`.
- **GSAP**: to update, replace both files in `vendor/gsap/` with the same version's `dist/gsap.min.js` and
  `dist/ScrollTrigger.min.js` from the npm package `gsap`. The build gives them hashed names under `/assets/`, so the
  Content-Security-Policy stays `script-src 'self'` (plus the analytics hashes).
- **Flags** in the language menu: `public/media/flags/<code>.svg` are the square (`flags/1x1/`) SVGs of the npm
  package `flag-icons` 7.2.3 (MIT, `LICENSE.txt` beside them), drawn round by CSS. Each language names one in
  `flag` in `src/languages.mjs`; a new language copies its country's file from the same version. `es.svg` is Spain's
  plain red-yellow-red flag written by hand, because the package's one with the coat of arms is 92 KB.

## Pages

| Page | URLs (per language) | From |
|---|---|---|
| Home | `/`, `/ko/`, `/zh-cn/`, `/pl/`, `/es/`, `/hi/`, `/ja/`, `/ru/`, `/ar/`, `/pt-br/` | `i18n/*.json` + catalog (categories, counts, FAQ, specs) |
| Format catalog | `/formats/` … | catalog: every category, format, route and engine |
| Conversion guides | `/convert/heic-to-jpg/` … | catalog `PAIRS`: one page per pair (84 pairs × 22 languages) |
| Preset gallery | `/presets/`, `/presets/<id>/` … | Filee-Presets' index.json, read at build time (see Preset gallery) |
| `llms.txt`, `llms-full.txt` | `/llms.txt`, `/llms-full.txt` | catalog, in English |

`/convert/` itself redirects to the format catalog. Every page has canonical + hreflang (with `x-default` = English),
Open Graph tags and JSON-LD: `SoftwareApplication` + `FAQPage` + `VideoObject` on home pages, `CollectionPage` +
`BreadcrumbList` on the catalog, `HowTo` + `BreadcrumbList` on conversion guides.

## Editing the catalog (`src/catalog.mjs`)

- `VERSION`: shown in the specs and JSON-LD `softwareVersion`, and in the "New in 1.1" badge.
- `ENGINES`: the optional downloads (name, approximate size, what they are for). `sizeMB: null` hides the size.
- `CATEGORIES`: per category its `formats` (id, label, extensions; `name`/`about` texts for formats used on
  conversion pages) and `routes`: `{ from: [...], to: [...], engine: 'builtin' | 'ffmpeg' | …, via, extras }`.
  A format that appears in a route with `engine: 'builtin'` counts as built in. Counts ("255 formats", "147 built in", "250+" where rounded down to tens)
  are computed from these lists the way the app's `FormatRegistry` counts: the camera RAW brands (`raw: true`) are one
  format, so the total matches the app's.
- `OPTIONS`: preset/behaviour texts used in the tables (`short`) and on conversion pages (`long`).
- `PAIRS`: the conversion guide pages. Each needs a route in `CATEGORIES` (the build fails otherwise), a `tip` in every
  language and `name`/`about` texts for both formats. `popular: true` lists it on the home page and in the footer.
- `FAQ`: questions and answers for the home page and the `FAQPage` JSON-LD.
- `koJong` on a format: whether its Korean reading ends in a vowel (0, default), a consonant (1) or ㄹ (2), so the
  pages write "ZIP으로", "RAR을", "HEIC를".

`validateCatalog()` runs on every build and names what doesn't add up (unknown ids, unsupported pairs, missing texts).

## Download links

Since 1.1.0 the installer's name carries the version (`Filee-1.1.0-win-Setup.exe`), so there is no fixed asset URL.
Download buttons and `/download` point at `https://github.com/KnifeLemon/Filee/releases/latest`; `main.js` asks the
GitHub API for the latest release and swaps in the selected system's file. Windows downloads come from our mirror,
`https://dl.filee.sh/<version>/Filee-<version>-win-Setup.exe` (Cloudflare R2; the app's `build/sign-release.ps1` copies
every release's Windows files there and checks they are served as is), because GitHub's download route is slow for
some visitors (Filee#454). The mirror URL is built from the checked tag and the exact file name only, and only when the
release has that asset on GitHub; a "Download from GitHub" link in the download section then offers the same file
there. Linux and macOS files are on GitHub only. The answer is cached for an hour in
`localStorage` (the API allows 60 unauthenticated requests per hour and IP); failures (offline, rate limit, timeout)
are remembered for ten minutes and leave the release-page link in place.
The version in front of the hero's platform line ("v2.0.0 · Windows 10/11 · …") and in the download status comes
from that same answer, so it follows a new release by itself (within the hour of caching). `VERSION` in catalog.mjs
(specs, JSON-LD `softwareVersion`, the "New in" badge) and the release texts are set by hand; `pad.xml` reads the
latest release at build time and links the Setup and portable zip on the mirror when the build finds them served there
with the release's size (otherwise on GitHub). macOS packages are labelled previews (`PREVIEW_TARGETS` in `src/downloads.mjs`); Windows
and Linux are full releases.

## Preset gallery

`/presets/` (and `/ko/presets/`…) lists the presets and donut toolbars that Filee users share through
[KnifeLemon/Filee-Presets](https://github.com/KnifeLemon/Filee-Presets) (design: KnifeLemon/Filee#1530), with a page per
preset at `/presets/<id>/`. Nothing is stored here: every build reads the repository again.

- **Data** (`src/presets.mjs`): the repository's `index.json` and each listed preset's `preset.json` and pictures, read
  from `raw.githubusercontent.com` (`PRESETS=<folder>` reads a local checkout). An entry with a bad id, a path outside
  its own folder, or a `preset.json` whose SHA-256 differs from the index is left out with a warning. An empty
  repository gives an empty gallery ("be the first"), not a failed build. The ids `files`, `download` and `index` are
  reserved (they are paths of the gallery itself).
- **Output**: `/presets/index.json` (the repository's index with `stats` filled in and a `download` link; its paths are
  relative to the index, `files/presets/<id>/…`, so the app resolves them the same way against GitHub's copy) and the
  files mirrored under `/presets/files/presets/<id>/…` (the Content-Security-Policy allows images from this site only).
- **Languages**: an entry has a main `language` (its title, description and default pictures) and may have `titleByLang` /
  `descriptionByLang`; a language with a title is supported (`languages`). A page in a supported language (matched without
  regard to case, then by base language: `pt` for `pt-PT`) shows that title, that description (else the main one) and
  that language's pictures; any other page shows the main-language texts and the default pictures with a badge naming
  the main language in its own words ("English") and `lang` on the text. Supported presets come first in every sort;
  "Only in my language" (off by default, `?mine=1`) hides the rest. Search matches the shown and the main texts.
- **Pictures per language**: an entry may have `imagesByLang` / `thumbByLang` (`{ <app language>: […] }`, sets under
  `images/<lang>/` with the default pictures already filled in where a set has fewer). They are mirrored and rewritten
  like the default ones, and a supported language's card and page use that language's set (the site's language codes are the
  app's, matched without regard to case; then the base language, `pt` for `pt-PT`), else the default set.
- **Warnings**: an entry's `warnings` (`[{ code, severity }]`, set by Filee-Presets' checks for risky settings such as
  `replaces_original`) appear in a box above the install steps and the download link on the preset's page (high red,
  medium amber, info neutral) and, for high ones, as a badge on its card. Each known code has a sentence in every
  `i18n/*.json` (`presets.warnings`); a code the site doesn't know yet is worded by its severity (`presets.warnGeneric`).
- **Likes and comments**: 👍 reactions (with their dates) and the comment count of each preset's discussion, from the
  GitHub GraphQL API, which needs a token: `GITHUB_TOKEN` (or `GH_TOKEN`), any token, public data only.
- **Downloads**: `https://filee.sh/presets/download/<id>` runs `worker/index.mjs` (`run_worker_first` in
  `wrangler.jsonc`; every other path is served as static assets without the Worker). It serves the mirrored
  `preset.json` and adds one to `downloads(slug, day, n)` in the D1 database `filee-presets`, one row per preset per UTC
  day; no IP, user agent or cookie is stored. Each Worker instance counts at most 30 downloads per preset per minute
  (later ones are served, not counted): a naive cap against a script looping on the link. The build reads the counters
  through the Cloudflare API when `CLOUDFLARE_API_TOKEN` (D1 Read) and `CLOUDFLARE_ACCOUNT_ID` are set
  (`PRESETS_D1_ID`, or the database is found by name).
- **Without tokens** (a local build, a manual deploy): the build keeps the stats published on filee.sh now
  (`/presets/index.json`), so a deploy doesn't reset them; with either source set, it computes them.
- **Rankings** (`src/preset-stats.mjs`, tested in `presets.test.mjs`):
  - **Hot** = Σ likes 5 · 2^(−age / 72 h) + Σ downloads 1 · 2^(−age / 72 h) + 3 · 2^(−time since publication / 72 h).
    A like or a download weighs half as much every three days; a like weighs five downloads (a deliberate vote
    against a cheap, repeatable action); publication counts as a short boost so new presets are seen. Downloads are
    counted per day, aged from the middle of that day.
  - **Best**: likes received in the last day, 7 days, 30 days, 365 days, or ever. **New**: publication date.
  - Ties go to more downloads, then the newer preset.
- **In the browser** (`src/gallery.js`, gallery page only): the tabs, the Best period, the filters (kind, format, tag,
  language) and the search sort and filter the server-rendered cards with the same `rank()`, and keep the choice in the
  address (`?sort=best&period=month&tag=pdf`). Without JavaScript the cards stay in Hot order.
- **Hourly rebuild**: `.github/workflows/presets-hourly.yml` builds and deploys every hour so new presets, likes and
  downloads show up. It is off until the repository variable `PRESETS_HOURLY` is `true` and the secrets
  `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set (see the file).
- **Setup once**: nothing to create by hand. `wrangler deploy` binds the D1 database `filee-presets` and creates it on
  the first deploy (no `database_id` in `wrangler.jsonc`; Wrangler's automatic provisioning), and the Worker creates its
  table on the first download. The deploy token needs D1 Edit as well as Workers Scripts Edit. With Workers Builds, add
  `GITHUB_TOKEN`, `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as build variables so its builds fill the stats.
- **Local preview**: `node serve.mjs` serves `/presets/download/<id>` like the Worker (without counting). To see the
  pages with presets before the repository has any, point `PRESETS` at a folder laid out like the repository.

## Deploy to Cloudflare

The site is a Worker with static assets. Its only code, `worker/index.mjs`, runs for the preset gallery's download
links (`/presets/download/*`); every other request is served as a static asset without it.

### Automatic deploys from GitHub (recommended)

1. Add `filee.sh` to your Cloudflare account, so Cloudflare runs its DNS.
2. In **Workers & Pages → Create → Import a repository**, pick `KnifeLemon/Filee-Web` (private repositories work).
3. Set up the build:

   | Setting | Value |
   |---|---|
   | Root directory | `site` |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` |
   | Build watch paths (include) | `site/*` so marketing-only commits don't redeploy the site |

4. Deploy. The `routes` entry in `wrangler.jsonc` attaches the custom domain `filee.sh` and creates its DNS record and certificate.
5. To send `www.filee.sh` to the apex domain:
   1. Add a proxied DNS record for `www`: `AAAA`, `100::`.
   2. Create a **Rules → Redirect Rules** rule from the "Redirect from WWW to root" template.

Pull requests get preview URLs (`preview_urls: true`).

### Manual deploy

```bash
cd site
npm install
npx wrangler login
npm run deploy
```

## SEO and GEO checklist

- **Already built in**:
  - Real per-language URLs (`/`, `/ko/`, `/zh-cn/`, `/pl/`, `/es/`, `/hi/`, `/ja/`, `/ru/`, `/ar/`, `/pt-br/`, `/zh-tw/`, `/fr/`, `/ne/`, `/th/`, `/tr/`, `/pt-pt/`, `/de/`, `/it/`, `/id/`, `/vi/`, `/bn-bd/`, `/fa/`) for the home page, the format catalog and every conversion guide.
  - `hreflang` + `x-default`, canonical URLs, Open Graph and Twitter cards on every page.
  - JSON-LD: `SoftwareApplication` (with `softwareVersion` and `featureList` from the catalog), `FAQPage`,
    `VideoObject`, `WebSite`, `CollectionPage`, `HowTo` and `BreadcrumbList`.
  - `sitemap.xml` with every page, its alternates, and the promo video on home pages.
  - `llms.txt` (summary) and `llms-full.txt` (full catalog, guides, FAQ) for AI assistants and answer engines.
  - Internal links: nav and footer → format catalog, home → categories and popular guides, catalog → guides,
    guides → related guides (same source, same target, same category).
  - Content is fully server-rendered, so crawlers never need JavaScript.
  - `npm run check` verifies titles, descriptions, hreflang reciprocity, JSON-LD and links before a deploy.
- **After the first deploy, submit `https://filee.sh/sitemap.xml` to**:
  - Google Search Console
  - Bing Webmaster Tools (Bing also feeds ChatGPT search and Copilot)
  - Naver Search Advisor (important for Korean search)
- Verification files, such as a Naver or Google HTML file, go into `public/`.
- **IndexNow**: `npm run deploy` ends with `node indexnow.mjs`, which sends every sitemap URL to Bing, Naver and the
  other IndexNow engines; the key is the `public/<key>.txt` file named in that script.
- **Cloudflare bot settings**: to be cited by AI answer engines (the GEO part), leave **AI crawl control / Block AI bots** off, and don't let a managed `robots.txt` disallow them. `robots.txt` here allows everything.
- **Analytics**: Google Analytics 4 is on; its measurement ID is `GA_ID` in `src/page.mjs` (empty turns it off).
  `build.mjs` adds the hashes of the inline scripts and Google's hosts to the Content-Security-Policy, so after
  changing any inline script, rebuild instead of editing `_headers` by hand.
- **Optional**: Cloudflare Web Analytics (cookieless). The Content-Security-Policy in `_headers` already allows its script.

## Short links

`_redirects` provides short links that are handy for social posts:

- `filee.sh/download` → latest release page (the installer's file name carries the version)
- `filee.sh/github` → repository
- `filee.sh/releases` → release list
