#!/usr/bin/env python3
"""Generate professional product images for Luma Store using PIL."""
import sys, os
sys.path.insert(0, "/opt/data/lazy-packages")
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = "/opt/data/luma-store/public/product-images"
os.makedirs(OUT, exist_ok=True)

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_EMOJI = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"

W, H = 800, 600

# Product definitions: (id, emoji, title line1, title line2, sublabel, accent color)
products = [
    ("planner-bundle", "\U0001F4D2", "ULTIMATE", "PLANNER BUNDLE", "120+ pages · PDF + Notion", (226,180,94)),
    ("wellness-journal", "\U0001F9E0", "MINDFUL", "WELLNESS JOURNAL", "60+ guided prompts", (126,198,169)),
    ("ai-prompts", "\U0001F916", "AI PROMPT", "POWER PACK", "500+ pro prompts", (133,176,235)),
    ("budget-templates", "\U0001F4CA", "SMART BUDGET", "TEMPLATES", "Excel + Google Sheets", (240,180,120)),
    ("social-templates", "\U0001F3A8", "SOCIAL MEDIA", "CONTENT KIT", "200+ Canva templates", (210,140,200)),
    ("ebook-bundle", "\U0001F4DA", "SIDE HUSTLE", "EBOOK BUNDLE", "5 eBooks included", (150,210,150)),
]

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i]-a[i])*t) for i in range(3))

def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0,2,4))

def draw_rounded(d, box, r, fill, outline=None, width=1):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)

def make_image(pid, emoji, t1, t2, sub, accent):
    # Background: dark teal vertical gradient
    top = hex2rgb("#0e3a3a")
    bot = hex2rgb("#041c1c")
    bg = Image.new("RGB", (W, H), top)
    for y in range(H):
        t = y / H
        row = lerp(top, bot, t)
        bg.paste(Image.new("RGB", (W, 1), row), (0, y))

    # soft radial glow behind product
    glow = Image.new("L", (W, H), 0)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([W//2-340, H//2-280, W//2+340, H//2+280], fill=120)
    glow = glow.filter(ImageFilter.GaussianBlur(140))
    gold_layer = Image.new("RGB", (W, H), accent)
    bg = Image.composite(gold_layer, bg, glow)

    d = ImageDraw.Draw(bg, "RGBA")

    # Title
    fb = ImageFont.truetype(FONT_BOLD, 46)
    fr = ImageFont.truetype(FONT_REG, 22)
    fs = ImageFont.truetype(FONT_REG, 20)

    # centered title lines
    def center_text(txt, y, font, fill=(240,247,246)):
        bbox = d.textbbox((0,0), txt, font=font)
        w = bbox[2]-bbox[0]
        d.text(((W-w)/2, y), txt, font=font, fill=fill)

    center_text(t1, 56, fb)
    center_text(t2, 112, fb, fill=accent)

    # Product "card" (rounded rectangle simulating a cover)
    card_w, card_h = 300, 360
    cx = (W-card_w)/2
    cy = 180
    # shadow
    shadow = Image.new("RGBA", (W, H), (0,0,0,0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([cx+14, cy+18, cx+card_w+14, cy+card_h+18], radius=26, fill=(0,0,0,120))
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    bg.paste(shadow, (0,0), shadow)

    # card body
    draw_rounded(d, [cx, cy, cx+card_w, cy+card_h], 26, fill=(10,44,44,255), outline=accent, width=3)

    # big symbol on card — draw a simple decorative icon instead of emoji
    # (NotoColorEmoji is a fixed-size bitmap font; DejaVu lacks emoji glyphs)
    sym = {
        "planner-bundle": "▤",
        "wellness-journal": "☼",
        "ai-prompts": "⚡",
        "budget-templates": "▥",
        "social-templates": "✦",
        "ebook-bundle": "▤",
    }.get(pid, "●")
    fe = ImageFont.truetype(FONT_BOLD, 120)
    eb = d.textbbox((0,0), sym, font=fe)
    ew = eb[2]-eb[0]; eh = eb[3]-eb[1]
    d.text((cx+(card_w-ew)/2, cy+92), sym, font=fe, fill=accent)

    # sublabel at bottom of card
    fsb = ImageFont.truetype(FONT_REG, 19)
    sb = d.textbbox((0,0), sub, font=fsb)
    sw = sb[2]-sb[0]
    d.text(((W-sw)/2, cy+card_h-56), sub, font=fsb, fill=(200,220,215,255))

    bg.save(f"{OUT}/{pid}.png", "PNG")
    print(f"  ✓ {pid}.png")

print("Generating product images...")
for pid, emoji, t1, t2, sub, accent in products:
    make_image(pid, emoji, t1, t2, sub, accent)
print(f"Done -> {OUT}")
