# Packs PNG frames rendered by the studio (studio.frames) into an animated WebP for the README.
#   python marketing/make-anim.py marketing/out/anim-en marketing/out/demo-en.webp 15
import glob
import os
import sys

from PIL import Image

folder, target, fps = sys.argv[1], sys.argv[2], int(sys.argv[3])
frames = [Image.open(path).convert('RGB') for path in sorted(glob.glob(os.path.join(folder, '*.png')))]
frames[0].save(target, save_all=True, append_images=frames[1:], duration=round(1000 / fps), loop=0,
               quality=78, method=6)
print(f'{target}: {len(frames)} frames, {os.path.getsize(target) // 1024} KB')
