# Copies the studio renders in marketing/out into the places that use them, converted for the web:
#   site/public/media  promo video, posters, Open Graph images, screenshots (WebP)
#   docs/media         README banner, animated demo, GitHub social preview (in the Filee app repository)
# Usage: python marketing/export.py        (needs Pillow; run after rendering, see marketing/README.md)
#        python marketing/export.py demos  only the feature demo clips (make-demo-videos.ps1), see export_demos();
#                                         needs FFmpeg too (FFMPEG, the app repository's engines or the PATH)
import glob
import os
import shutil
import subprocess
import sys

from PIL import Image

WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# The Filee app repository: a sibling folder ../Filee unless FILEE_REPO says otherwise.
APP = os.environ.get('FILEE_REPO') or os.path.join(os.path.dirname(WEB), 'Filee')
ROOT = os.path.dirname(WEB)  # for printing paths relative to both repositories
OUT = os.path.join(WEB, 'marketing', 'out')
SITE = os.path.join(WEB, 'site', 'public', 'media')
DOCS = os.path.join(APP, 'docs', 'media')
LANGS = ['en', 'ko', 'zh-CN']


def jpeg(source, target, size=None, quality=86):
    image = Image.open(source).convert('RGB')
    if size and image.size != size:
        image = image.resize(size, Image.LANCZOS)
    image.save(target, 'JPEG', quality=quality, optimize=True, progressive=True)
    print(f'{os.path.relpath(target, ROOT)}  {os.path.getsize(target) // 1024} KB')


def copy(source, target):
    shutil.copyfile(source, target)
    print(f'{os.path.relpath(target, ROOT)}  {os.path.getsize(target) // 1024} KB')


# Clips whose What's new slide the app renders itself (tests/Filee.App.Tests/WhatsNewMedia.cs): only the website gets them.
APP_SLIDES = {'crop'}

# The website's feature showcase (src/page.mjs → SHOWCASE): each clip as a small MP4 and a still for its poster, taken
# at the moment that tells the story best (seconds into the clip). expand-dark is shown on dark pages.
WEB_CLIPS = {'expand': 3.1, 'expand-dark': 3.1, 'flip': 3.0, 'browser': 3.6, 'crop': 5.5}
WEB_SIZE = 720  # px, square; shown at up to ~540 CSS px


def ffmpeg():
    """FFmpeg from FFMPEG, the app repository's engines (pwsh build/fetch-engines.ps1) or the PATH."""
    candidates = [os.environ.get('FFMPEG'), os.path.join(APP, 'engines', 'ffmpeg', 'bin', 'ffmpeg.exe'),
                  os.path.join(APP, 'engines', 'ffmpeg', 'bin', 'ffmpeg'), shutil.which('ffmpeg')]
    found = next((c for c in candidates if c and os.path.isfile(c)), None)
    if not found:
        sys.exit('FFmpeg not found: set FFMPEG or run pwsh build/fetch-engines.ps1 in the app repository')
    return found


def export_web_clips():
    """The showcase clips for the website: media/demos/<clip>.mp4 (H.264, 720 px, 30 fps, no audio, faststart so
    playback starts before the whole file is in) and media/demos/<clip>.webp (the poster still)."""
    target = os.path.join(SITE, 'demos')
    os.makedirs(target, exist_ok=True)
    exe = ffmpeg()
    for clip, at in WEB_CLIPS.items():
        source = os.path.join(OUT, 'demo-videos', f'{clip}-square.mp4')
        video = os.path.join(target, f'{clip}.mp4')
        subprocess.run([exe, '-v', 'error', '-y', '-i', source, '-an',
                        '-vf', f'scale={WEB_SIZE}:{WEB_SIZE}:flags=lanczos,fps=30',
                        '-c:v', 'libx264', '-preset', 'veryslow', '-crf', '24', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
                        '-movflags', '+faststart', video], check=True)
        print(f'{os.path.relpath(video, ROOT)}  {os.path.getsize(video) // 1024} KB')
        frame = os.path.join(target, f'{clip}.png')
        subprocess.run([exe, '-v', 'error', '-y', '-ss', str(at), '-i', source, '-frames:v', '1',
                        '-vf', f'scale={WEB_SIZE}:{WEB_SIZE}:flags=lanczos', frame], check=True)
        poster = os.path.join(target, f'{clip}.webp')
        Image.open(frame).convert('RGB').save(poster, 'WEBP', quality=78, method=6)
        os.remove(frame)
        print(f'{os.path.relpath(poster, ROOT)}  {os.path.getsize(poster) // 1024} KB')


def export_demos():
    """The feature demo clips in out/demo-videos: the website's showcase clips and posters (export_web_clips), and the
    640 px WebP over the app's What's new slide of the same name (src/Filee.App/Assets/WhatsNew/<version>/<clip>.webp),
    where a release has one and the app doesn't render it (APP_SLIDES)."""
    export_web_clips()
    demos = os.path.join(OUT, 'demo-videos')
    for source in sorted(glob.glob(os.path.join(demos, '*-640.webp'))):
        clip = os.path.basename(source)[:-len('-640.webp')]
        if clip in APP_SLIDES:
            continue
        for slide in glob.glob(os.path.join(APP, 'src', 'Filee.App', 'Assets', 'WhatsNew', '*', f'{clip}.webp')):
            copy(source, slide)


if sys.argv[1:] == ['demos']:
    export_demos()
    sys.exit()

os.makedirs(os.path.join(SITE, 'screens'), exist_ok=True)
for lang in LANGS:
    copy(os.path.join(OUT, 'web', f'filee-{lang}-1280x720.mp4'), os.path.join(SITE, f'promo-{lang}.mp4'))
    jpeg(os.path.join(OUT, 'posters', f'poster-{lang}.png'), os.path.join(SITE, f'poster-{lang}.jpg'), (1280, 720))
    jpeg(os.path.join(OUT, 'images', f'og-{lang}.png'), os.path.join(SITE, f'og-{lang}.jpg'), quality=88)
    jpeg(os.path.join(OUT, 'images', f'social-{lang}.png'), os.path.join(DOCS, f'banner-{lang}.jpg'), quality=88)
    copy(os.path.join(OUT, f'demo-{lang}.webp'), os.path.join(DOCS, f'demo-{lang}.webp'))
jpeg(os.path.join(OUT, 'images', 'social-en.png'), os.path.join(DOCS, 'social-preview.jpg'), quality=88)

# App screenshots (rendered by tests/Filee.App.Tests/RenderTests, kept as PNG in docs/media) → WebP for the site.
for name in sorted(os.listdir(DOCS)):
    if name.endswith('.png'):
        target = os.path.join(SITE, 'screens', name[:-4] + '.webp')
        Image.open(os.path.join(DOCS, name)).save(target, 'WEBP', quality=82, method=6)
        print(f'{os.path.relpath(target, ROOT)}  {os.path.getsize(target) // 1024} KB')
