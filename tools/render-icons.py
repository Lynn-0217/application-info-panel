"""Rasterize the simple document geometry from icon.svg for Chrome's toolbar."""
from pathlib import Path
from PIL import Image, ImageDraw

output = Path(__file__).resolve().parent.parent / "application-info-panel" / "icons"
output.mkdir(exist_ok=True)
scale = 4
canvas = Image.new("RGBA", (64 * scale, 64 * scale))
draw = ImageDraw.Draw(canvas)
draw.rounded_rectangle(
    (12 * scale, 8 * scale, 52 * scale, 56 * scale),
    radius=4 * scale, fill="#e8f0fe", outline="#1a73e8", width=3 * scale,
)
for y, end in [(23, 42), (32, 42), (41, 35)]:
    draw.line((22 * scale, y * scale, end * scale, y * scale), fill="#1a73e8", width=3 * scale)
    for x in (22, end):
        radius = 1.5 * scale
        draw.ellipse((x * scale - radius, y * scale - radius, x * scale + radius, y * scale + radius), fill="#1a73e8")
for size in (16, 32, 48, 128):
    canvas.resize((size, size), Image.Resampling.LANCZOS).save(output / f"icon{size}.png")
print("Generated toolbar icons in", output)
