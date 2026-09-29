# Promo video and images

Everything promotional is rendered from code:
- the 27-second promo video (vertical for Threads, Reels and Shorts; landscape for YouTube and the website)
- the carousel slides
- the Open Graph cards
- the README banner and animated demo

The Filee app repository must sit next to this one (`repos/Filee` and `repos/filee-web`; set `FILEE_REPO` if it
lives elsewhere): the renders use its fonts, and `export.py` writes the README media into its `docs/media`.

Text comes from `strings.js` (en, ko, zh-CN) and the screenshots in `assets/` are real app renders, so a new feature
or a new language means editing a file and rendering again.

```
marketing/
  promo.js      the video: scenes drawn on a canvas as a pure function of time (render(ctx, t, lang))
  stills.js     carousel slides (1080×1350), Open Graph card (1200×630), social preview/banner (1280×640)
  strings.js    all text, per language
  mp4.js        WebCodecs H.264 encoder + a small MP4 muxer (no ffmpeg needed)
  studio.html   preview scrubber and the render API (window.studio)
  server.mjs    local server that serves the studio and saves renders into out/
  make-anim.py  packs PNG frames into the animated WebP used in the READMEs
  export.py     copies renders from out/ into site/public/media and the app repository's docs/media
  assets/       app screenshots and the logo used by the renders
  out/          render output (git-ignored)
```

## Render

Requirements: Node 20+, a Chromium-based browser (Chrome or Edge; WebCodecs with H.264), Python 3 with Pillow, and the
UI fonts (`pwsh build/fetch-fonts.ps1` in the app repository).

```bash
node marketing/server.mjs
```

Open http://127.0.0.1:4173/studio.html. The scrubber previews any moment in any language and size. To render, call the
API from the browser console:

```js
// Videos: (lang, canvas format, file name, bitrate, output size)
await studio.video('ko', '1080x1920', 'threads/filee-ko-1080x1920.mp4', 9e6)                     // Threads / Reels / Shorts
await studio.video('ko', '1920x1080', 'landscape/filee-ko-1920x1080.mp4', 8e6)                   // YouTube
await studio.video('ko', '1920x1080', 'web/filee-ko-1280x720.mp4', 2.2e6, '1280x720')           // website

// Carousel slides, Open Graph card and social preview for one language → out/images/
await studio.stills('ko')

// Video poster (the "drop on a format" moment) → out/posters/
await studio.still('ko', '1920x1080', studio.moments.drag, 'posters/poster-ko.png')

// Frames for the README animation → out/anim-ko/, then pack them:
await studio.frames('ko', '1920x1080', 2.8, 9.7, 15, 'anim-ko', 0.46875)
```

```bash
python marketing/make-anim.py marketing/out/anim-ko marketing/out/demo-ko.webp 15
python marketing/export.py      # → site/public/media and ../Filee/docs/media
```

Repeat with `en` and `zh-CN`. Keep the studio tab in the foreground while encoding.

## Where each file is used

| File | Used for |
|---|---|
| `out/threads/filee-*-1080x1920.mp4` | Threads, Instagram Reels, YouTube Shorts, TikTok (9:16) |
| `out/landscape/filee-*-1920x1080.mp4` | YouTube, X, LinkedIn (16:9) |
| `out/web/filee-*-1280x720.mp4` | filee.sh (`site/public/media/promo-*.mp4`) |
| `out/images/threads-1…6-*.png` | Threads or Instagram carousel (4:5), posted in order |
| `out/images/og-*.png` | Link previews for filee.sh (`og-*.jpg`) |
| `out/images/social-*.png` | README banner (`docs/media/banner-*.jpg`); the English one is the GitHub social preview |
| `out/demo-*.webp` | Animated demo in the READMEs |

Set the GitHub social preview in the repository's **Settings → General → Social preview**: upload
`docs/media/social-preview.jpg`.

## App screenshots

`assets/*.png` and the PNGs in the app repository's `docs/media` are rendered headlessly by
`tests/Filee.App.Tests/RenderTests.cs`:
`dotnet test tests/Filee.App.Tests` writes them to `tests/Filee.App.Tests/bin/.../screenshots`.
Copy the ones you need, then run `export.py` again to refresh the website's WebP versions.
