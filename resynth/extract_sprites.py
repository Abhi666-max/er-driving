from PIL import Image
import scipy.ndimage as ndi
import numpy as np
import os

os.makedirs('public/assets/sprites', exist_ok=True)

im = Image.open('public/assets/ui.png')
arr = np.array(im)
mask = arr[:, :, 3] > 10

labeled, num_features = ndi.label(mask)
slices = ndi.find_objects(labeled)
comps = []
for i, s in enumerate(slices):
    ymin, ymax = s[0].start, s[0].stop
    xmin, xmax = s[1].start, s[1].stop
    w = xmax - xmin
    h = ymax - ymin
    if w > 15 and h > 15:
        comps.append((w * h, xmin, ymin, w, h))

comps.sort(reverse=True)
for idx, (area, x, y, w, h) in enumerate(comps[:30]):
    crop = im.crop((x, y, x + w, y + h))
    crop.save(f'public/assets/sprites/sprite_{idx:02d}_{w}x{h}_at_{x}_{y}.png')

print("Saved top 30 sprites!")

