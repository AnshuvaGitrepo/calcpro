"""Generate CalcPro icons from one drawing.

Run:  python scripts/make-icons.py            (web icons + favicon + Windows .ico)
      python scripts/make-icons.py android    (Android launcher icons + splash screens)

Design: a graphite tile holding a 2x2 grid of keys; the bottom-right key is the amber
"=" key, the same signal colour the app uses for operators.
"""
import os, re, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BG_TOP, BG_BOTTOM = (42, 46, 51), (23, 25, 28)   # #2a2e33 -> #17191c
KEY = (58, 63, 69, 255)                          # #3a3f45
AMBER = (245, 165, 36, 255)                      # #f5a524
INK = (27, 20, 6, 255)                           # #1b1406, "=" on the amber key
APP_BG = "#17191c"


def gradient(size):
    g = Image.new("RGB", (1, 256))
    for y in range(256):
        t = y / 255
        g.putpixel((0, y), tuple(round(a + (b - a) * t) for a, b in zip(BG_TOP, BG_BOTTOM)))
    return g.resize((size, size))


def keys(draw, size, scale):
    """2x2 key grid centred in the canvas; `scale` = share of the canvas the grid covers."""
    grid = size * scale
    off = (size - grid) / 2
    gap = grid * 0.1
    k = (grid - gap) / 2
    r = k * 0.28
    for row in range(2):
        for col in range(2):
            x0 = off + col * (k + gap)
            y0 = off + row * (k + gap)
            amber = row == 1 and col == 1
            draw.rounded_rectangle((x0, y0, x0 + k, y0 + k), radius=r, fill=AMBER if amber else KEY)
            if amber:  # "=" sign
                bw, bh = k * 0.46, k * 0.1
                cx, cy = x0 + k / 2, y0 + k / 2
                for dy in (-k * 0.12, k * 0.12):
                    draw.rounded_rectangle((cx - bw / 2, cy + dy - bh / 2, cx + bw / 2, cy + dy + bh / 2), radius=bh / 2, fill=INK)


def icon(size, radius=0.22, scale=0.62, bg=True):
    s = size * 4  # supersample for smooth edges
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    if bg:
        mask = Image.new("L", (s, s), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, s - 1, s - 1), radius=round(radius * s), fill=255)
        img.paste(gradient(s), (0, 0), mask)
    keys(ImageDraw.Draw(img), s, scale)
    return img.resize((size, size), Image.LANCZOS)


def save(img, *parts):
    path = os.path.join(ROOT, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, optimize=True)
    print("wrote", os.path.relpath(path, ROOT))


def favicon_svg():
    # same drawing as keys() on a 64px tile, scale 0.62
    grid, off = 64 * 0.62, 64 * 0.19
    gap = grid * 0.1
    k = (grid - gap) / 2
    r = k * 0.28
    rects = []
    for row in range(2):
        for col in range(2):
            x, y = off + col * (k + gap), off + row * (k + gap)
            fill = "#f5a524" if (row, col) == (1, 1) else "#3a3f45"
            rects.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{k:.2f}" height="{k:.2f}" rx="{r:.2f}" fill="{fill}"/>')
    x, y = off + k + gap, off + k + gap
    cx, cy, bw, bh = x + k / 2, y + k / 2, k * 0.46, k * 0.1
    bars = "".join(f'<rect x="{cx-bw/2:.2f}" y="{cy+dy-bh/2:.2f}" width="{bw:.2f}" height="{bh:.2f}" rx="{bh/2:.2f}" fill="#1b1406"/>' for dy in (-k * 0.12, k * 0.12))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2e33"/><stop offset="1" stop-color="#17191c"/></linearGradient></defs>
  <rect width="64" height="64" rx="14" fill="url(#g)"/>
  {"".join(rects)}{bars}
</svg>
'''


def web():
    save(icon(192), "public", "icons", "icon-192.png")
    save(icon(512), "public", "icons", "icon-512.png")
    save(icon(512, radius=0, scale=0.5), "public", "icons", "icon-maskable-512.png")  # grid inside the safe zone
    save(icon(180, radius=0).convert("RGB"), "public", "icons", "apple-touch-icon.png")
    with open(os.path.join(ROOT, "public", "favicon.svg"), "w", encoding="utf-8") as f:
        f.write(favicon_svg())
    print("wrote public/favicon.svg")
    # Windows app icon (electron-builder reads build/icon.ico and build/icon.png)
    save(icon(512, radius=0.2), "build", "icon.png")
    big = icon(256, radius=0.2)
    path = os.path.join(ROOT, "build", "icon.ico")
    big.save(path, sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print("wrote", os.path.relpath(path, ROOT))


def android():
    res = os.path.join("android", "app", "src", "main", "res")
    dens = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}
    for d, m in dens.items():
        save(icon(round(48 * m), radius=0.22), res, f"mipmap-{d}", "ic_launcher.png")
        save(icon(round(48 * m), radius=0.5), res, f"mipmap-{d}", "ic_launcher_round.png")
        # adaptive foreground: 108dp canvas, grid inside the 66dp safe zone
        save(icon(round(108 * m), bg=False, scale=0.42), res, f"mipmap-{d}", "ic_launcher_foreground.png")
    # adaptive icon background colour
    bgxml = os.path.join(ROOT, res, "values", "ic_launcher_background.xml")
    if os.path.exists(bgxml):
        with open(bgxml, encoding="utf-8") as f:
            xml = f.read()
        xml = re.sub(r'(<color name="ic_launcher_background">)[^<]*(</color>)', rf"\g<1>{APP_BG.upper()}\g<2>", xml)
        with open(bgxml, "w", encoding="utf-8") as f:
            f.write(xml)
        print("wrote", os.path.relpath(bgxml, ROOT))
    # splash screens: logo centred on the app background, same size as Capacitor's placeholders
    for dirpath, _, files in os.walk(os.path.join(ROOT, res)):
        if "splash.png" in files:
            p = os.path.join(dirpath, "splash.png")
            w, h = Image.open(p).size
            img = Image.new("RGB", (w, h), APP_BG)
            logo = icon(round(min(w, h) * 0.28))
            img.paste(logo, ((w - logo.width) // 2, (h - logo.height) // 2), logo)
            img.save(p, optimize=True)
            print("wrote", os.path.relpath(p, ROOT), (w, h))


if __name__ == "__main__":
    android() if "android" in sys.argv else web()
