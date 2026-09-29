# filee.sh

The Filee website: a static, dependency-free site in three languages, deployed to Cloudflare Workers (static assets).

```
site/
  i18n/{en,ko,zh-CN}.json   all page text, one file per language
  src/page.mjs              HTML template (meta, hreflang, JSON-LD, sections)
  src/styles.css            styles (light/dark, responsive, reduced motion)
  src/main.js               interactions: drag & drop demo, reveals, lazy video, GitHub release info
  public/                   copied as-is: media (video, posters, OG images, screenshots), icons
  build.mjs                 → dist/: pages, hashed assets, sitemap.xml, robots.txt, llms.txt, 404, _headers, _redirects
  serve.mjs                 local preview with rebuild on change
  wrangler.jsonc            Cloudflare config (custom domain filee.sh)
```

## Develop

```bash
cd site
node serve.mjs        # http://localhost:4174, rebuilds when src/, i18n/ or public/ change
```

No `npm install` is needed to build or preview; Wrangler is only needed to deploy.

- **Text**: edit `i18n/*.json`. Every language must have the same keys.
- **New language**: add `i18n/<lang>.json` with its own `path` (e.g. `/ja/`) and add it to `ORDER` in `build.mjs`.
  Hreflang, the sitemap, the language menu and the language suggestion pick it up automatically.
- **Media**: the promo video, posters and images come from `marketing/` (see `marketing/README.md`).

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
  - Real per-language URLs (`/`, `/ko/`, `/zh-cn/`).
  - `hreflang` + `x-default`, canonical URLs, Open Graph and Twitter cards per language.
  - JSON-LD: `SoftwareApplication`, `VideoObject`, `WebSite`.
  - `sitemap.xml` with alternates and video entries.
  - `llms.txt` for AI assistants.
  - Content is fully server-rendered, so crawlers never need JavaScript.
- **After the first deploy, submit `https://filee.sh/sitemap.xml` to**:
  - Google Search Console
  - Bing Webmaster Tools (Bing also feeds ChatGPT search and Copilot)
  - Naver Search Advisor (important for Korean search)
- Verification files, such as a Naver or Google HTML file, go into `public/`.
- **Cloudflare bot settings**: to be cited by AI answer engines (the GEO part), leave **AI crawl control / Block AI bots** off, and don't let a managed `robots.txt` disallow them. `robots.txt` here allows everything.
- **Analytics**: Google Analytics 4 is on; its measurement ID is `GA_ID` in `src/page.mjs` (empty turns it off).
  `build.mjs` adds the hashes of the inline scripts and Google's hosts to the Content-Security-Policy, so after
  changing any inline script, rebuild instead of editing `_headers` by hand.
- **Optional**: Cloudflare Web Analytics (cookieless). The Content-Security-Policy in `_headers` already allows its script.

## Short links

`_redirects` provides short links that are handy for social posts:

- `filee.sh/download` → latest installer
- `filee.sh/github` → repository
- `filee.sh/releases` → release list
