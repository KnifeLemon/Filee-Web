# Copies the studio renders in marketing/out into the places that use them, converted for the web:
#   site/public/media  promo video, posters, Open Graph images, screenshots (WebP)
#   docs/media         README banner, animated demo, GitHub social preview (in the Filee app repository)
# Usage: python marketing/export.py        (needs Pillow; run after rendering, see marketing/README.md)
#        python marketing/export.py demos  only the feature demo clips (make-demo-videos.ps1), see export_demos()
import glob
import os
import shutil
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


def export_demos():
    """The feature demo clips in out/demo-videos: the 820 px WebP onto the website (media/demo-<clip>.webp), and the
    640 px one over the app's What's new slide of the same name (src/Filee.App/Assets/WhatsNew/<version>/<clip>.webp),
    where a release has one and the app doesn't render it (APP_SLIDES)."""
    demos = os.path.join(OUT, 'demo-videos')
    for source in sorted(glob.glob(os.path.join(demos, '*-640.webp'))):
        clip = os.path.basename(source)[:-len('-640.webp')]
        copy(os.path.join(demos, f'{clip}.webp'), os.path.join(SITE, f'demo-{clip}.webp'))
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
