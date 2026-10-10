# """Extract the usable rabbit/door poses from the supplied FikrNot storyboard.

# Usage: python extract-storyboard-assets.py <storyboard.png> <output-directory>
# The hand-drawn masks remove the labels and surrounding storyboard texture.
# """
# from pathlib import Path
# import sys
# from collections import deque

# from PIL import Image, ImageDraw, ImageFilter, ImageChops


# if len(sys.argv) != 3:
#     raise SystemExit("usage: extract-storyboard-assets.py <storyboard.png> <output-directory>")

# source = Image.open(sys.argv[1]).convert("RGBA")
# out = Path(sys.argv[2])
# out.mkdir(parents=True, exist_ok=True)


# def extract(name, box, points, scale=3, clean_dark=True, eyes=()):
#     left, top, right, bottom = box
#     cutout = source.crop(box)
#     mask = Image.new("L", (cutout.width * scale, cutout.height * scale), 0)
#     draw = ImageDraw.Draw(mask)
#     draw.polygon([(x * scale, y * scale) for x, y in points], fill=255)
#     mask = mask.resize(cutout.size, Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(.35))

#     # Remove dark source-background islands that the hand mask may intersect.
#     inner = mask.filter(ImageFilter.MinFilter(3))
#     edge = Image.eval(ImageChops.subtract(mask, inner), lambda a: 255 if a > 24 else 0)
#     eye_mask = Image.new("L", cutout.size, 0)
#     eye_draw = ImageDraw.Draw(eye_mask)
#     for x, y in eyes:
#         eye_draw.ellipse((x - 11, y - 12, x + 11, y + 12), fill=255)
#     eyes_px = eye_mask.load()
#     px = cutout.load()
#     ep = edge.load()
#     mp = mask.load()
#     w, h = cutout.size
#     dark = bytearray(w * h)
#     seeds = deque()
#     for y in range(h):
#         for x in range(w):
#             r, g, b, _ = px[x, y]
#             if clean_dark and mp[x, y] > 20 and max(r, g, b) < 110 and eyes_px[x, y] == 0:
#                 idx = y * w + x
#                 dark[idx] = 1
#                 if ep[x, y] > 0 or x == 0 or y == 0 or x == w - 1 or y == h - 1:
#                     seeds.append(idx)
#     while seeds:
#         idx = seeds.popleft()
#         if dark[idx] != 1:
#             continue
#         dark[idx] = 2
#         x, y = idx % w, idx // w
#         for dy in (-1, 0, 1):
#             for dx in (-1, 0, 1):
#                 nx, ny = x + dx, y + dy
#                 if 0 <= nx < w and 0 <= ny < h:
#                     ni = ny * w + nx
#                     if dark[ni] == 1:
#                         seeds.append(ni)
#     for y in range(h):
#         for x in range(w):
#             r, g, b, _ = px[x, y]
#             if dark[y * w + x] == 2 or (clean_dark and eyes_px[x, y] == 0 and max(r, g, b) < 110) or (clean_dark and ep[x, y] and max(r, g, b) - min(r, g, b) > 75):
#                 mp[x, y] = 0
#     mask = mask.filter(ImageFilter.GaussianBlur(.45))
#     cutout.putalpha(mask)
#     cutout.save(out / f"{name}.png", optimize=True)


# # Crop boundaries stop above the storyboard's numbered labels. Source coordinates
# # are 2056x765; masks follow each original pose and retain the carrot on relevant poses.
# run_outline = [
#     (9, 173), (16, 157), (34, 148), (69, 136), (100, 124), (122, 108),
#     (126, 90), (115, 72), (112, 57), (117, 47), (128, 51), (143, 63),
#     (153, 80), (160, 96), (169, 108), (185, 109), (211, 111), (235, 119),
#     (253, 128), (264, 137), (268, 148), (258, 159), (250, 163), (241, 173),
#     (248, 187), (242, 198), (231, 204), (218, 200), (205, 189), (190, 190),
#     (169, 199), (143, 211), (119, 223), (92, 233), (64, 238), (42, 234),
#     (25, 226), (13, 212),
# ]
# for name, box in [
#     ("rabbit-run-1", (0, 65, 315, 325)),
#     ("rabbit-run-2", (305, 65, 600, 325)),
#     ("rabbit-run-3", (585, 65, 880, 325)),
#     ("rabbit-run-4", (880, 65, 1080, 325)),
# ]:
#     # Scale the same outline to preserve the framing while retaining each distinct
#     # source frame's actual pose.
#     factor = (box[2] - box[0]) / 315
#     outline = [(round(x * factor, 2), y) for x, y in run_outline]
#     eye_x = round(269 * factor) if box[0] == 0 else round((536 - box[0])) if box[0] == 305 else round((815 - box[0])) if box[0] == 585 else round((1007 - box[0]))
#     extract(name, box, outline, eyes=[(eye_x, 137)])

# # Front-facing seated rabbit and its original Explore carrot.
# extract("rabbit-sit-carrot", (1760, 55, 2050, 326), [
#     (58, 241), (54, 222), (52, 203), (52, 182), (57, 166), (69, 151),
#     (57, 134), (49, 119), (47, 102), (51, 84), (45, 64), (43, 46), (45, 28),
#     (49, 15), (58, 9), (68, 12), (78, 28), (86, 48), (91, 68), (96, 82),
#     (104, 65), (115, 48), (129, 30), (141, 19), (151, 17), (162, 21),
#     (171, 31), (176, 44), (177, 59), (174, 74), (166, 94), (160, 103),
#     (171, 102), (183, 106), (193, 113), (200, 123), (202, 137), (198, 150),
#     (206, 151), (216, 144), (227, 134), (243, 128), (258, 130), (270, 138),
#     (277, 151), (279, 168), (273, 181), (261, 189), (244, 198), (227, 203),
#     (215, 210), (208, 225), (213, 242), (211, 256), (202, 267), (186, 272),
#     (74, 270), (64, 263),
# ], eyes=[(105, 103), (151, 103)])

# # Two separate source gazes, kept as real rabbit poses rather than CSS-flipped art.
# look_outline = [
#     (72, 235), (68, 211), (70, 185), (80, 165), (77, 138), (75, 105),
#     (73, 70), (79, 42), (90, 24), (105, 14), (120, 8), (133, 15),
#     (143, 31), (149, 58), (159, 80), (167, 99), (184, 108), (204, 108),
#     (221, 118), (233, 132), (239, 150), (232, 167), (218, 177), (200, 182),
#     (190, 199), (185, 220), (179, 243), (166, 257), (105, 261), (82, 253),
# ]
# extract("rabbit-look-left", (1230, 60, 1498, 325), look_outline, eyes=[(202, 100)])
# extract("rabbit-look-right", (1498, 60, 1775, 325), [
#     (27, 236), (24, 212), (29, 186), (41, 164), (40, 133), (38, 103),
#     (40, 72), (48, 46), (61, 28), (77, 19), (95, 22), (108, 38),
#     (116, 63), (126, 85), (138, 102), (157, 109), (183, 108), (205, 118),
#     (220, 135), (224, 154), (215, 171), (198, 183), (188, 203), (183, 229),
#     (174, 254), (158, 262), (70, 262), (43, 254),
# ], eyes=[(168, 102)])

# # Standing turn and the final forward-running pose.
# extract("rabbit-stand", (0, 420, 300, 682), [
#     (39, 230), (31, 212), (34, 190), (43, 174), (48, 150), (43, 127),
#     (45, 97), (51, 67), (59, 43), (70, 23), (84, 13), (99, 15),
#     (113, 31), (126, 52), (140, 75), (153, 96), (171, 105), (194, 107),
#     (218, 115), (237, 132), (249, 151), (249, 168), (237, 181), (224, 187),
#     (216, 203), (211, 226), (194, 247), (169, 257), (116, 258), (76, 251),
#     (53, 242),
# ], eyes=[(209, 115)])
# extract("rabbit-approach", (300, 450, 620, 685), [
#     (8, 190), (17, 166), (34, 149), (72, 135), (107, 123), (131, 112),
#     (134, 88), (126, 66), (126, 45), (135, 27), (150, 17), (166, 23),
#     (178, 43), (186, 70), (198, 93), (214, 102), (237, 105), (258, 116),
#     (273, 131), (278, 149), (267, 166), (251, 173), (245, 190), (250, 203),
#     (240, 213), (222, 210), (204, 198), (187, 201), (165, 212), (139, 222),
#     (106, 232), (73, 233), (43, 226), (22, 215),
# ], eyes=[(249, 109)])

# # Rear-facing entry pose from storyboard frame 13.
# extract("rabbit-rear", (1545, 480, 1645, 675), [
#     (14, 183), (10, 165), (14, 147), (22, 133), (21, 119), (17, 99),
#     (20, 80), (31, 59), (32, 32), (41, 17), (54, 10), (65, 17),
#     (73, 39), (77, 62), (78, 42), (83, 26), (85, 21), (87, 36),
#     (85, 57), (80, 80), (82, 101), (84, 116), (86, 129), (86, 145),
#     (84, 165), (78, 179), (69, 186), (55, 188), (30, 187),
# ])

# # Closed door panel cutout includes its original wood grain and sign; the arch/frame
# # is built separately so the panel can rotate naturally on its hinge.
# extract("door-panel", (926, 412, 1068, 671), [
#     (60, 2), (82, 5), (105, 18), (126, 39), (137, 66), (140, 258),
#     (2, 258), (3, 68), (12, 43), (30, 20), (45, 8),
# ], clean_dark=False)
