"""Build web-optimized images for site/ from the Claude Design handoff assets.
Run:  python tools/optimize_images.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "promaxx-website" / "project" / "assets"
OUT = ROOT / "site" / "img"
OUT.mkdir(parents=True, exist_ok=True)

# name -> max width (None = keep native)
PHOTOS = {
    "home-hero-tanks-hd": None,      # 2172x724 hero + why card
    "contact-hero-dusk": None,       # 1752x897 contact hero
    "footer-bg-final": None,         # 2172x724 footer background
    "tank-farm-aerial": None,        # 683x1024
    "process-piping": None,
    "utility-flow": None,
    "pipe-rack-dusk": None,          # 1024x683
    "understand-asset": 1200,
    "identify-risks": 1200,
    "engineering-judgment": 1200,
    "deliver-accountability": 1200,
    "workforce-welder": None,
    "workforce-fitter": None,
    "workforce-pipes": None,
}

def save_webp(im, name, q=82):
    p = OUT / f"{name}.webp"
    im.save(p, "WEBP", quality=q, method=6)
    return p

total_in = total_out = 0
for name, maxw in PHOTOS.items():
    src = SRC / f"{name}.png"
    im = Image.open(src).convert("RGB")
    if maxw and im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    p = save_webp(im, name)
    total_in += src.stat().st_size; total_out += p.stat().st_size
    print(f"{name:26s} {im.size}  {src.stat().st_size//1024:>5} KB -> {p.stat().st_size//1024:>4} KB")

# Logo: CSS height max 72px -> render at 216px tall (3x)
logo = Image.open(SRC / "promaxx-logo.png").convert("RGBA")
bbox = logo.getchannel("A").getbbox(); logo = logo.crop(bbox)
h = 216; logo = logo.resize((round(logo.width * h / logo.height), h), Image.LANCZOS)
logo.save(OUT / "promaxx-logo.webp", "WEBP", quality=90, method=6)
logo.save(OUT / "promaxx-logo.png", optimize=True)
print("logo", logo.size, (OUT / "promaxx-logo.webp").stat().st_size // 1024, "KB")

# Favicons from the transparent atom mark
mark = Image.open(SRC / "promaxx-mark-transparent.png").convert("RGBA")
mark = mark.crop(mark.getchannel("A").getbbox())
side = max(mark.size); sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
sq.paste(mark, ((side - mark.width) // 2, (side - mark.height) // 2)); 
SITE = ROOT / "site"
sq.resize((32, 32), Image.LANCZOS).save(SITE / "favicon-32.png", optimize=True)
sq.resize((192, 192), Image.LANCZOS).save(SITE / "icon-192.png", optimize=True)
sq.resize((512, 512), Image.LANCZOS).save(SITE / "icon-512.png", optimize=True)
sq.save(SITE / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
# apple-touch: opaque white bg with padding
at = Image.new("RGBA", (180, 180), (255, 255, 255, 255))
inner = sq.resize((150, 150), Image.LANCZOS); at.alpha_composite(inner, (15, 15))
at.convert("RGB").save(SITE / "apple-touch-icon.png", optimize=True)

# Open Graph image 1200x630: hero crop + logo card
hero = Image.open(SRC / "home-hero-tanks-hd.png").convert("RGB")
scale = 630 / hero.height; hero = hero.resize((round(hero.width * scale), 630), Image.LANCZOS)
x0 = hero.width - 1200; og = hero.crop((x0, 0, x0 + 1200, 630)).convert("RGBA")
shade = Image.new("RGBA", og.size, (10, 38, 86, 0))
from PIL import ImageDraw
d = ImageDraw.Draw(shade)
for x in range(1200):
    a = int(170 * max(0, 1 - x / 820)); d.line([(x, 0), (x, 630)], fill=(10, 38, 86, a))
og.alpha_composite(shade)
card_logo = logo.resize((round(logo.width * 120 / logo.height), 120), Image.LANCZOS)
card = Image.new("RGBA", (card_logo.width + 64, 120 + 48), (255, 255, 255, 255))
cm = Image.new("L", card.size, 0); ImageDraw.Draw(cm).rounded_rectangle([0, 0, card.width - 1, card.height - 1], 24, fill=255)
card.alpha_composite(card_logo, (32, 24)); og.paste(card, (64, 64), cm)
og.convert("RGB").save(SITE / "og-image.jpg", quality=86, optimize=True)
print(f"photos total {total_in//1024} KB -> {total_out//1024} KB")
