# Images

Drop real photography here. The build references these paths; until a file
exists the component falls back to a flat panel-coloured placeholder, so a
missing image degrades quietly rather than showing a broken icon.

```
products/   badami-mangoes.jpg  kodubale.jpg  avarekalu.jpg  idli-podi.jpg
makers/     lakshmi-amma.jpg  savitri-rao.jpg  ganesh-k.jpg  radha-devi.jpg
reels/      idli-podi.jpg  avarekalu.jpg  gongura.jpg  jaggery.jpg
videos/     idli-podi.jpg  avarekalu-fields.jpg  gongura.jpg
```

Sizes, from the Figma frames:

| Use | Rendered | Export at 2x |
| --- | --- | --- |
| Reel card | 282 x 240 | 564 x 480 |
| Product card | 282 x 150 | 564 x 300 |
| Video card | 384 x 230 | 768 x 460 |
| Maker portrait | 120 x 120 | 240 x 240 |
| Pantry category | 102 x 102 | 204 x 204 |

Prefer `.webp` or `.avif` with a `.jpg` fallback. Keep each file under ~150 KB.
