# Asset sources and licensing

## Wedding photography

The locally hosted photographs are Unsplash demo images from FREEHTML5.co's Wedding template, mirrored in [technext/wedding](https://github.com/technext/wedding) at commit `316d781a727c80c5bab05769d8c1d7f4e22627ef`. The template credits Unsplash in its original footer. Only photographic assets were reused; no template markup, styles or application code were copied.

Unsplash images are freely usable under the [Unsplash License](https://unsplash.com/license). The mirror does not identify individual photographers; no photographer names or individual provenance have been invented. Original source files and their local derivatives:

| Original file | Local WebP | Purpose |
| --- | --- | --- |
| `images/img_bg_4.jpg` | `src/assets/images/garden-ceremony.webp` | Garden inspiration and no-WebGL alternative |
| `images/gallery-9.jpg` | `src/assets/images/coastal-vows.webp` | Coastal inspiration |
| `images/gallery-3.jpg` | `src/assets/images/heirloom-details.webp` | Jewellery inspiration |
| `images/img_bg_1.jpg` | `src/assets/images/a-moment-together.webp` | Company introduction |
| `images/gallery-5.jpg` | `src/assets/images/just-married.webp` | Garden gallery |
| `images/img_bg_3.jpg` | `src/assets/images/by-the-water.webp` | Destination gallery |

All images have been resized and compressed to WebP, collectively approximately 576 KB. They illustrate possible visual directions, not client events. Before commercial launch, replace demo photographs with company-approved images and retain the applicable rights documentation. The original photographs contain identifiable people; do not imply endorsement or a client relationship.

## Other assets

- **Cormorant Garamond** and **Manrope**: SIL Open Font License 1.1, provided by the corresponding `@fontsource` npm packages and hosted locally.
- **Lucide** icons: ISC License, via `lucide-react`.
- **Three.js**: MIT License. Its RoomEnvironment is used to produce environment lighting/reflections without downloading a remote HDR asset.
- **React**: MIT License.
- All floral, ring, gemstone, fabric, candle and particle geometry, the ornamental flower mark and the favicon are built in this repository.

No external model, texture API, photo API, map, analytics service or remote font service is needed at runtime.
