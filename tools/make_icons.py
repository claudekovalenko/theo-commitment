#!/usr/bin/env python3
"""Render the app's mark — a sapling rooted in ground — to PNG icons.

No third-party dependencies: shapes are scanline-filled at 4x and downsampled,
then written out as RGBA PNGs by hand.

    python3 tools/make_icons.py
"""

import os
import struct
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS = os.path.join(ROOT, "icons")

STONE = (26, 30, 27)     # background
SOIL = (109, 76, 52)     # the ground line
ROOTS = (150, 108, 74)   # roots below the line
LEAF = (124, 166, 96)    # what grows above it
SS = 4


def taper(x0, y0, x1, y1, w0, w1):
    """A tapered strand from (x0,y0) to (x1,y1), as a quad."""
    dx, dy = x1 - x0, y1 - y0
    length = max((dx * dx + dy * dy) ** 0.5, 0.001)
    nx, ny = -dy / length, dx / length
    return [
        (x0 + nx * w0, y0 + ny * w0),
        (x1 + nx * w1, y1 + ny * w1),
        (x1 - nx * w1, y1 - ny * w1),
        (x0 - nx * w0, y0 - ny * w0),
    ]


def fill(buf, size, poly, color):
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


def render(size, inset, corner):
    """A canopy over a ground line, roots beneath it."""
    big = size * SS
    buf = [(0, 0, 0)] * (big * big)
    if corner is None:
        buf = [STONE] * (big * big)
    else:
        rounded_rect(buf, big, 0, 0, big - 1, big - 1, corner * SS, STONE)

    u = (big - 2 * inset * SS) / 100.0
    ox = inset * SS
    oy = inset * SS

    def P(x, y):
        return (ox + x * u, oy + y * u)

    ground_y = 58

    # roots first, so the ground band sits over where they meet it
    for (x1, y1, w1) in [(50, 100, 3.2), (26, 94, 2.2), (74, 94, 2.2), (12, 78, 1.6), (88, 78, 1.6)]:
        a = P(50, ground_y - 2)
        b = P(x1, y1)
        fill(buf, big, taper(a[0], a[1], b[0], b[1], 6.0 * u, w1 * u), ROOTS)

    # canopy and trunk
    a, b = P(50, ground_y), P(50, 34)
    fill(buf, big, taper(a[0], a[1], b[0], b[1], 7.0 * u, 6.0 * u), LEAF)
    c = P(50, 27)
    circle(buf, big, c[0], c[1], 25 * u, LEAF)

    # the ground itself, drawn last: the line you build on
    g0 = P(10, ground_y - 4)
    g1 = P(90, ground_y + 4)
    rounded_rect(buf, big, g0[0], g0[1], g1[0], g1[1], 4.5 * u, SOIL)

    return downsample(buf, big, size)


def main():
    os.makedirs(ICONS, exist_ok=True)
    jobs = [
        ("icon-192.png", 192, 22, 34),
        ("icon-512.png", 512, 58, 92),
        ("apple-touch-icon.png", 180, 20, None),
        ("icon-maskable-512.png", 512, 118, None),
        ("favicon-32.png", 32, 3, 6),
    ]
    for name, size, inset, corner in jobs:
        write_png(os.path.join(ICONS, name), render(size, inset, corner), size)
        print("wrote icons/%s" % name)


if __name__ == "__main__":
    main()
