import type { TryOnMeta } from "@acme/types/tryon";

// SKU-keyed hints for try-on flows. Keep lightweight and optional.
// Example:
// {
//   "sku-123": {
//     material: 'leather',
//     tryOn: { garmentFlat: 'https://cdn.example/sku-123-flat.png' },
//     assets3d: { glb: 'https://cdn.example/sku-123.glb', usdz: 'https://cdn.example/sku-123.usdz' }
//   }
// }
export const tryonMeta: Record<string, TryOnMeta> = {
  // Sample sneakers → anchor to feet region for better default placement
  "green-sneaker": { anchorHint: "feet", material: "synthetic" },
  "sand-sneaker": { anchorHint: "feet", material: "leather" },
  "black-sneaker": { anchorHint: "feet", material: "synthetic" },
};

// Additional examples you can copy/paste when adding new SKUs:
// - Caps/hats: anchor near head
//   "canvas-cap": { anchorHint: "head", material: "cotton" },
// - Tops/jackets: anchor mid‑torso
//   "denim-jacket": { anchorHint: "torso", material: "denim" as any },
// - Accessories with 3D assets for AR
//   "leather-bag": { anchorHint: "torso", material: "leather", assets3d: { glb: "https://cdn.example/leather-bag.glb", usdz: "https://cdn.example/leather-bag.usdz" } },
