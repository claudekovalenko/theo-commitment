#!/usr/bin/env python3
"""Render the app's arrow mark to PNG icons.

No third-party dependencies: polygons are scanline-filled at 4x and
downsampled, then written out as RGBA PNGs by hand.

    python3 tools/make_icons.py
"""

import os
import struct
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS = os.path.join(ROOT, "icons")

INK = (14, 17, 27)  # background
GOLD = (214, 168, 84)  # lit face of the needle
GOLD_DIM = (146, 112, 54)  # shaded face
SS = 4  # supersampling factor


def needle(scale, cx, cy):
    """Compass needle as two half-polygons, in a unit box scaled/offset."""

    def p(x, y):
        return (cx + x * scale, cy + y * scale)

    tip = p(0.0, -0.46)
    notch = p(0.0, 0.20)
    right = p(0.30, 0.40)
    left = p(-0.30, 0.40)
    return [
        ([tip, right, notch], GOLD),
        ([tip, notch, left], GOLD_DIM),
    ]


def fill(buf, size, poly, color):
    """Scanline-fill a polygon (list of (x, y) floats) into an RGB buffer."""
    n = len(poly)
    ys = [pt[1] for pt in poly]
    y0 = max(0, int(min(ys)))
    y1 = min(size - 1, int(max(ys)) + 1)
    for y in range(y0, y1 + 1):
        yc = y + 0.5
        xs = []
        for i in range(n):
            ax, ay = poly[i]
            bx, by = poly[(i + 1) % n]
            if (ay <= yc < by) or (by <= yc < ay):
                xs.append(ax + (yc - ay) / (by - ay) * (bx - ax))
        xs.sort()
        for i in range(0, len(xs) - 1, 2):
            for x in range(max(0, int(xs[i])), min(size - 1, int(xs[i + 1])) + 1):
                if xs[i] - 0.5 <= x <= xs[i + 1] + 0.5:
                    buf[y * size + x] = color


def circle(buf, size, cx, cy, r, color):
    for y in range(max(0, int(cy - r)), min(size - 1, int(cy + r)) + 1):
        for x in range(max(0, int(cx - r)), min(size - 1, int(cx + r)) + 1):
            if (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r:
                buf[y * size + x] = color


def rounded_rect(buf, size, x0, y0, x1, y1, r, color):
    for y in range(max(0, int(y0)), min(size - 1, int(y1)) + 1):
        for x in range(max(0, int(x0)), min(size - 1, int(x1)) + 1):
            px, py = x + 0.5, y + 0.5
            qx = min(max(px, x0 + r), x1 - r)
            qy = min(max(py, y0 + r), y1 - r)
            if (px - qx) ** 2 + (py - qy) ** 2 <= r * r:
                buf[y * size + x] = color


def downsample(buf, big, out):
    small = [(0, 0, 0)] * (out * out)
    for y in range(out):
        for x in range(out):
            r = g = b = 0
            for dy in range(SS):
                for dx in range(SS):
                    c = buf[(y * SS + dy) * big + (x * SS + dx)]
                    r += c[0]
                    g += c[1]
                    b += c[2]
            k = SS * SS
            small[y * out + x] = (r // k, g // k, b // k)
    return small


def write_png(path, pixels, size):
    raw = b"".join(
        b"\x00" + b"".join(bytes((p[0], p[1], p[2], 255)) for p in pixels[y * size:(y + 1) * size])
        for y in range(size)
    )

    def chunk(tag, data):
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as fh:
        fh.write(png)


def render(size, needle_scale, corner, transparent_bg=False):
    big = size * SS
    bg = (0, 0, 0) if transparent_bg else INK
    buf = [bg] * (big * big)
    if not transparent_bg:
        if corner is None:
            buf = [INK] * (big * big)
        else:
            buf = [(0, 0, 0)] * (big * big)
            rounded_rect(buf, big, 0, 0, big - 1, big - 1, corner * SS, INK)
    c = big / 2
    circle(buf, big, c, c, needle_scale * SS * 0.60, (26, 31, 46))
    for poly, color in needle(needle_scale * SS, c, c):
        fill(buf, big, poly, color)
    return downsample(buf, big, size)


def main():
    os.makedirs(ICONS, exist_ok=True)
    jobs = [
        ("icon-192.png", 192, 130, 34),
        ("icon-512.png", 512, 350, 92),
        ("apple-touch-icon.png", 180, 122, None),
        ("icon-maskable-512.png", 512, 270, None),
        ("favicon-32.png", 32, 24, 6),
    ]
    for name, size, scale, corner in jobs:
        write_png(os.path.join(ICONS, name), render(size, scale, corner), size)
        print("wrote icons/%s" % name)


if __name__ == "__main__":
    main()
