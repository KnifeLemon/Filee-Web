# filee.sh

The Filee website: a static, dependency-free site in three languages, deployed to Cloudflare Workers (static assets).

```
site/
  src/catalog.mjs           THE data module: app version, formats, what converts to what, engines, conversion
                            guide pairs, FAQ. Every format/support claim and every count on the site comes from here
  i18n/{en,ko,zh-CN}.json   page text (UI and marketing copy), one file per language; {placeholders} are filled
                            from the catalog
  src/layout.mjs            shared frame: <head> (meta, canonical, hreflang, Open Graph), nav, footer, icons
  src/page.mjs              home page (hero, demo, features, format categories, HWP, FAQ, specs) and the 404 page
  src/formats-page.mjs      format catalog: /formats/, /ko/formats/, /zh-cn/formats/
  src/convert-page.mjs      conversion guides: /convert/<from>-to-<to>/ (and /ko/…, /zh-cn/…)
  src/llms.mjs              llms.txt and llms-full.txt
  src/sponsors.mjs          home page sponsors: the app's sponsors.json and logos, read from GitHub at build time;
                            no section while nobody is listed (SPONSORS=<folder> reads a local copy)
  src/styles.css            styles (light/dark, responsive, reduced motion)
  src/main.js               interactions: drag & drop demo, reveals, lazy video, GitHub release info and installer link
  public/                   copied as-is: media (video, posters, OG images, screenshots), icons
  build.mjs                 → dist/: all pages, hashed assets, sitemap.xml, robots.txt, llms(-full).txt, 404,
                            _headers, _redirects; stops on catalog or i18n inconsistencies
  check.mjs                 checks dist/: titles, descriptions, canonical, hreflang reciprocity, JSON-LD, links, sitemap
  serve.mjs                 local preview with rebuild on change
  wrangler.jsonc            Cloudflare config (custom domain filee.sh)
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
  and Korean particles (`{fromEul}` → "HEIC를", `{toRo}` → "JPG로").
- **New language**: add `i18n/<lang>.json` with its own `path` (e.g. `/ja/`) and add it to `ORDER` in `build.mjs`,
  plus the language's texts in the `T(en, ko, zh)` objects of `catalog.mjs`. Hreflang, the sitemap, the language
  menu and the language suggestion pick it up automatically.
- **Media**: the promo video, posters and images come from `marketing/` (see `marketing/README.md`).

## Pages

| Page | URLs (per language) | From |
|---|---|---|
| Home | `/`, `/ko/`, `/zh-cn/` | `i18n/*.json` + catalog (categories, counts, FAQ, specs) |
| Format catalog | `/formats/` … | catalog: every category, format, route and engine |
| Conversion guides | `/convert/heic-to-jpg/` … | catalog `PAIRS`: one page per pair (61 pairs × 3 languages) |
| `llms.txt`, `llms-full.txt` | `/llms.txt`, `/llms-full.txt` | catalog, in English |

`/convert/` itself redirects to the format catalog. Every page has canonical + hreflang (with `x-default` = English),
Open Graph tags and JSON-LD: `SoftwareApplication` + `FAQPage` + `VideoObject` on home pages, `CollectionPage` +
`BreadcrumbList` on the catalog, `HowTo` + `BreadcrumbList` on conversion guides.

## Editing the catalog (`src/catalog.mjs`)

- `VERSION`: shown in the specs and JSON-LD `softwareVersion`, and in the "New in 1.1" badge.
- `ENGINES`: the optional downloads (name, approximate size, what they are for). `sizeMB: null` hides the size.
- `CATEGORIES`: per category its `formats` (id, label, extensions; `name`/`about` texts for formats used on
  conversion pages) and `routes`: `{ from: [...], to: [...], engine: 'builtin' | 'ffmpeg' | …, via, extras }`.
  A format that appears in a route with `engine: 'builtin'` counts as built in. Counts ("180 formats", "111 built in")
  are computed from these lists.
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
GitHub API for the latest release and swaps in the `*-win-Setup.exe` asset. The answer is cached for an hour in
`localStorage` (the API allows 60 unauthenticated requests per hour and IP); failures (offline, rate limit, timeout)
are remembered for ten minutes and leave the release-page link in place.

## Deploy to Cloudflare

The site is a Worker with static assets only, so it is free to serve and needs no Worker code.

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
  - Real per-language URLs (`/`, `/ko/`, `/zh-cn/`) for the home page, the format catalog and every conversion guide.
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
