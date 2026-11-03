# Promo video and images

Everything promotional is rendered from code:
- the 27-second promo video (vertical for Threads, Reels and Shorts; landscape for YouTube and the website)
- the carousel slides
- the Open Graph cards
- the README banner and animated demo
- the feature demo clips (expand, flip, browser, crop), rendered from the app's real donut and crop overlay

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
  assets/       app screenshots and a copy of the app's logo (filee.svg, filee.png); the renders draw the logo
                in code from the same paths and colours (drawLogo in promo.js), so a new logo goes there too
  demo-videos/  .NET generator of the feature demo clips (headless Avalonia against the app repository)
  make-demo-videos.ps1  builds and runs it: out/demo-videos
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
// Videos: (lang, canvas format, file name, bitrate, output size, cut)
await studio.video('ko', '1080x1920', 'threads/filee-ko-1080x1920.mp4', 9e6)                     // Threads / Reels / Shorts
await studio.video('ko', '1920x1080', 'landscape/filee-ko-1920x1080.mp4', 8e6)                   // YouTube
await studio.video('ko', '1920x1080', 'web/filee-ko-1280x720.mp4', 2.2e6, '1280x720')           // website

// Short feed cut (17.8 s): hook ("still uploading to converter sites?"), the gesture, everyday uses, end card.
// Its first frame is the hook, so it doubles as the thumbnail. Pick "Threads cut" in the studio to preview it.
await studio.video('ko', '1080x1920', 'threads/filee-threads-ko-1080x1920.mp4', 9e6, undefined, 'threads')

// Carousel slides, Open Graph card and social preview for one language → out/images/
await studio.stills('ko')

// Video poster (the "drop on a format" moment) → out/posters/
await studio.still('ko', '1920x1080', studio.moments.drag, 'posters/poster-ko.png')

// Frames for the README animation → out/anim-ko/, then pack them:
await studio.frames('ko', '1920x1080', 2.8, 10.1, 15, 'anim-ko', 0.46875)   // 110 frames
```

```bash
python marketing/make-anim.py marketing/out/anim-ko marketing/out/demo-ko.webp 15
python marketing/export.py      # → site/public/media and ../Filee/docs/media
```

Repeat with `en` and `zh-CN`. Keep the studio tab in the foreground while encoding.

## Feature demo clips

Short loops of one feature each, drawn by Filee itself rather than recorded: `demo-videos/` builds against the app
repository's `src/Filee.App`, opens the real donut window headlessly and steps its animation clock by hand at 60 fps, the
way `RadialController` drives it during a drag; the crop clip opens the real crop overlay the same way, with pointer
input and its clock (`CropCanvas.Clock`) stepped by hand. Around it goes a made-up desktop (a plain file manager, a
browser on a `photos.example` page, the pointer, the dragged file, Ctrl and Tab keycaps). No captions: the clips only
show.

| Clip | Shows |
|---|---|
| `expand` | trip.jpg dragged with Ctrl: the donut opens, a group slice fans out its ring, dropped on WEBP (also `expand-dark`) |
| `flip` | the hub says "Tab ↻ back", Tab turns the donut to its back face, dropped on Remove background |
| `browser` | a picture dragged out of a web page: the download badge over the progress ring, then the files in Downloads |
| `crop` | trip.jpg and lake.jpg dragged with Ctrl onto the donut's Crop slice, the crop overlay: a corner of the frame in, A over the picture for the aspect dial at the pointer, 1:1, Crop & Next, Crop & Save, the two cropped photos |

Requirements: the .NET SDK the app repository uses, its fonts (`pwsh build/fetch-fonts.ps1`) and FFmpeg (its
`engines/ffmpeg` from `pwsh build/fetch-engines.ps1`, `-FFmpeg <exe>`, or the PATH).

```powershell
pwsh marketing/make-demo-videos.ps1                    # every clip → out/demo-videos (about 6 minutes)
pwsh marketing/make-demo-videos.ps1 -Clips flip -Formats square -Stills 2,3.2 -Quick   # PNG frames only, to check a change
python marketing/export.py demos                       # → site/public/media/demos/<clip>.mp4 + .webp poster, and the app's What's new slides (not crop: the app renders that one)
python marketing/export.py whats-new 2.3.0             # the app's What's new 2.3.0 slides → site/public/media/whats-new/2.3/<id>.mp4 + .webp poster
```

Every build output, the app's projects' included, goes under `out/build`, so the app repository isn't written to. The
generator takes the assembly name `Filee.App.Tests`: the app shows the internals the clips step (`DonutMenu.Advance`, the
download badge) to its tests only. A clip lives in `demo-videos/<Name>Clip.cs`; after a UI change, render again.

## Where each file is used

| File | Used for |
|---|---|
| `out/threads/filee-threads-*-1080x1920.mp4` | Short cut for feeds: Threads, Instagram Reels, YouTube Shorts, TikTok (9:16) |
| `out/threads/filee-*-1080x1920.mp4` | The full 27-second vertical video |
| `out/landscape/filee-*-1920x1080.mp4` | YouTube, X, LinkedIn (16:9) |
| `out/web/filee-*-1280x720.mp4` | filee.sh (`site/public/media/promo-*.mp4`) |
| `out/images/threads-1…6-*.png` | Threads or Instagram carousel (4:5), posted in order |
| `out/images/og-*.png` | Link previews for filee.sh (`og-*.jpg`) |
| `out/images/social-*.png` | README banner (`docs/media/banner-*.jpg`); the English one is the GitHub social preview |
| `out/demo-*.webp` | Animated demo in the READMEs |
| `out/demo-videos/<clip>-square.mp4`, `<clip>-vertical.mp4` | Instagram, X, Reels, Shorts, TikTok (1:1 and 9:16, 1080 px, 60 fps) |
| `out/demo-videos/<clip>.webp`, `<clip>.gif` | README, slides (820 px; ≤ 1.5 MB / ≤ 3 MB) |
| `site/public/media/demos/<clip>.mp4`, `.webp` | The website's showcase: the square clip at 720 px, 30 fps, H.264 without audio (about 100–260 KB) and its poster still (`export.py demos`, FFmpeg) |
| `out/demo-videos/<clip>-640.webp` | The app's What's new slides (640 px, ≤ 400 KB; `export.py demos`) |
| `site/public/media/whats-new/<release>/<id>.mp4`, `.webp` | The website's "What's new in Filee" section: the app's What's new slides of that release (`src/Filee.App/Assets/WhatsNew/<version>`, animated WebP) as H.264 at 768 × 432 with each frame's own duration, about 60–110 KB, and the slide's poster frame (`export.py whats-new <version>`, FFmpeg) |

Set the GitHub social preview in the repository's **Settings → General → Social preview**: upload
`docs/media/social-preview.jpg`.

## App screenshots

`assets/*.png` and the PNGs in the app repository's `docs/media` are rendered headlessly by
`tests/Filee.App.Tests/RenderTests.cs`:
`dotnet test tests/Filee.App.Tests` writes them to `tests/Filee.App.Tests/bin/.../screenshots`.
Copy the ones you need, then run `export.py` again to refresh the website's WebP versions.
