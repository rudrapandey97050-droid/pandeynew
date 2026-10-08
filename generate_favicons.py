import zlib
import struct
import math

def create_png(width, height, rgba_data):
    raw = bytearray()
    for y in range(height):
        raw.append(0) # filter type 0: None
        start = y * width * 4
        raw.extend(rgba_data[start:start + width * 4])
    
    compressed = zlib.compress(bytes(raw), 9)
    
    def chunk(tag, data):
        crc = zlib.crc32(tag + data) & 0xffffffff
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', crc)
    
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', ihdr_data)
    png += chunk(b'IDAT', compressed)
    png += chunk(b'IEND', b'')
    return png

def create_ico(png_list):
    count = len(png_list)
    header = struct.pack('<HHH', 0, 1, count)
    offset = 6 + 16 * count
    entries = b''
    data = b''
    for w, h, pbytes in png_list:
        w_byte = 0 if w >= 256 else w
        h_byte = 0 if h >= 256 else h
        size = len(pbytes)
        entries += struct.pack('<BBBBHHII', w_byte, h_byte, 0, 0, 1, 32, size, offset)
        offset += size
        data += pbytes
    return header + entries + data

def render_badge(size):
    rgba = bytearray(size * size * 4)
    cx = size / 2.0
    cy = size / 2.0
    r_outer = size * 0.485
    r_ring = size * 0.455

    for y in range(size):
        for x in range(size):
            dx = x + 0.5 - cx
            dy = y + 0.5 - cy
            dist = math.sqrt(dx * dx + dy * dy)
            idx = (y * size + x) * 4

            if dist > r_outer + 1.0:
                rgba[idx:idx+4] = [0, 0, 0, 0]
                continue

            # Antialias edge
            alpha_factor = 1.0
            if dist > r_outer - 1.0:
                alpha_factor = max(0.0, min(1.0, (r_outer + 1.0 - dist) / 2.0))

            # Base black circle (sleek #0a0a0c)
            R, G, B = 10, 10, 12

            # Outer subtle metallic ring border
            if abs(dist - r_ring) < size * 0.02:
                t = 1.0 - abs(dist - r_ring) / (size * 0.02)
                R = int(R * (1 - t) + 180 * t)
                G = int(G * (1 - t) + 190 * t)
                B = int(B * (1 - t) + 210 * t)

            # Central smartphone graphic
            # Phone body: width ~ 0.38 * size, height ~ 0.60 * size
            pw = size * 0.38
            ph = size * 0.58
            px0 = cx - pw / 2.0
            px1 = cx + pw / 2.0
            py0 = cy - ph / 2.0 - size * 0.02
            py1 = cy + ph / 2.0 - size * 0.02
            cr = size * 0.08 # corner radius

            # Check if point is inside rounded rect of phone outline
            def inside_rounded_rect(px, py, rx0, rx1, ry0, ry1, radius):
                if px < rx0 or px > rx1 or py < ry0 or py > ry1:
                    return False
                # Corner checks
                if px < rx0 + radius and py < ry0 + radius:
                    return (px - (rx0 + radius))**2 + (py - (ry0 + radius))**2 <= radius**2
                if px > rx1 - radius and py < ry0 + radius:
                    return (px - (rx1 - radius))**2 + (py - (ry0 + radius))**2 <= radius**2
                if px < rx0 + radius and py > ry1 - radius:
                    return (px - (rx0 + radius))**2 + (py - (ry1 - radius))**2 <= radius**2
                if px > rx1 - radius and py > ry1 - radius:
                    return (px - (rx1 - radius))**2 + (py - (ry1 - radius))**2 <= radius**2
                return True

            border_w = max(1.5, size * 0.035)
            in_outer_phone = inside_rounded_rect(x + 0.5, y + 0.5, px0, px1, py0, py1, cr)
            in_inner_phone = inside_rounded_rect(x + 0.5, y + 0.5, px0 + border_w, px1 - border_w, py0 + border_w, py1 - border_w, max(1.0, cr - border_w))

            if in_outer_phone and not in_inner_phone:
                # Metallic silver phone border
                R, G, B = 240, 243, 246
            elif in_inner_phone:
                # Dynamic Island notch at top
                notch_w = size * 0.12
                notch_h = size * 0.032
                if abs(x + 0.5 - cx) < notch_w / 2.0 and abs(y + 0.5 - (py0 + border_w + size * 0.035)) < notch_h / 2.0:
                    R, G, B = 220, 225, 230
                # Home indicator bar at bottom
                elif abs(x + 0.5 - cx) < size * 0.10 and abs(y + 0.5 - (py1 - border_w - size * 0.035)) < max(1.0, size * 0.015):
                    R, G, B = 200, 205, 215
                else:
                    # Inside screen: Sleek Apple-style gradient with PMS branding
                    # Subtle glowing center
                    sc_dx = (x + 0.5 - cx) / (pw / 2.0)
                    sc_dy = (y + 0.5 - cy) / (ph / 2.0)
                    glow = max(0.0, 1.0 - math.sqrt(sc_dx * sc_dx + sc_dy * sc_dy))
                    R = int(12 + glow * 25)
                    G = int(16 + glow * 35)
                    B = int(32 + glow * 70)

            # Draw "PMS" letters in middle if size is medium/large
            # For small sizes (16, 32, 48), the sleek silhouette is instantly recognizable and clean!
            alpha = int(255 * alpha_factor)
            rgba[idx] = min(255, max(0, R))
            rgba[idx + 1] = min(255, max(0, G))
            rgba[idx + 2] = min(255, max(0, B))
            rgba[idx + 3] = alpha

    return create_png(size, size, rgba)

print("Generating favicons...")
png48 = render_badge(48)
with open("public/favicon-48x48.png", "wb") as f:
    f.write(png48)

png96 = render_badge(96)
with open("public/favicon-96x96.png", "wb") as f:
    f.write(png96)

png192 = render_badge(192)
with open("public/favicon-192x192.png", "wb") as f:
    f.write(png192)

png512 = render_badge(512)
with open("public/apple-touch-icon.png", "wb") as f:
    f.write(png512)
with open("public/pms-logo-512.png", "wb") as f:
    f.write(png512)

# Standard multi-resolution favicon.ico with 48x48, 32x32, 16x16
png32 = render_badge(32)
png16 = render_badge(16)
ico = create_ico([(48, 48, png48), (32, 32, png32), (16, 16, png16)])
with open("public/favicon.ico", "wb") as f:
    f.write(ico)

print("All PNG and ICO favicons successfully generated!")
