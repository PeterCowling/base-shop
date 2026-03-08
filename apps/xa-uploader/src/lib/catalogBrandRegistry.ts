export type CollectionSize = {
  label: string;
  dimensions: string;
  whatFits?: string;
  strapDrop?: string;
  /** Size-level popularity weight (0–1). Higher = more in-demand size within the collection. */
  popularityWeight?: number;
};

export type CatalogCollectionEntry = {
  handle: string;
  title: string;
  description: string;
  promo?: string;
  colors?: string[];
  materials?: string[];
  sizes?: CollectionSize[];
  closureType?: string;
  strapStyle?: string;
  hardwareColors?: string[];
  interiorColors?: string[];
  interior?: string;
  /** Base popularity score for this collection (0–100). */
  popularity?: number;
  subcategory?: string;
  department?: string;
};

export type CatalogBrandEntry = {
  handle: string;
  name: string;
  collections: CatalogCollectionEntry[];
};

/** Sentinel value for the "Custom / Other" dropdown option. */
export const CUSTOM_BRAND_HANDLE = "__custom__";
/** Sentinel value for the "Custom / Other" dropdown option. */
export const CUSTOM_COLLECTION_HANDLE = "__custom__";

/* eslint-disable ds/no-hardcoded-copy -- XAUP-0001 catalog data registry (non-UI metadata strings) */

// -- Shared Hermès palettes (referenced per-collection below) --

const HERMES_CORE_COLORS = [
  "Noir", "Gold", "Etoupe", "Bleu Nuit", "Rouge Casaque",
  "Craie", "Orange H", "Vert Cypress", "Rose Sakura",
  "Bleu Electrique", "Barenia Fauve", "Gris Asphalte",
  "Bleu Jean", "Rose Pourpre", "Jaune de Naples",
  "Vert Amande", "Beton", "Nata", "Terre Battue",
] as const;

const HERMES_CORE_LEATHERS = [
  "Togo", "Epsom", "Clemence", "Swift", "Box Calf",
  "Ostrich", "Crocodile Porosus", "Crocodile Niloticus",
  "Chevre Mysore",
] as const;

const HERMES_INTERIOR_COLORS = [
  "Noir", "Gold", "Etoupe", "Rouge H", "Rose Jaipur",
  "Bleu Nuit", "Craie", "Orange H", "Vert Cypress",
  "Rose Sakura", "Gris Perle", "Jaune Ambre",
  "Bougainvillier", "Bleu Electrique",
] as const;

export const XA_BRAND_REGISTRY: CatalogBrandEntry[] = [
  {
    handle: "hermes",
    name: "Hermès",
    collections: [
      {
        handle: "birkin",
        title: "Birkin",
        description:
          "Iconic structured top-handle bag in various sizes, leathers, and hardware finishes.",
        promo:
          "Iconic structured top-handle bag featuring a front flap with signature turn-lock closure, double rolled handles, and a clochette with padlock and keys. Interior lined in Chevre leather with one zipper pocket and one open pocket.",
        colors: [...HERMES_CORE_COLORS],
        materials: [...HERMES_CORE_LEATHERS],
        sizes: [
          { label: "25", dimensions: "25 x 20 x 13 cm", strapDrop: "9 cm", whatFits: "Phone, wallet, keys, small cosmetics pouch", popularityWeight: 1.0 },
          { label: "30", dimensions: "30 x 22 x 16 cm", strapDrop: "10 cm", whatFits: "iPad, A5 notebook, wallet, phone, cosmetics bag", popularityWeight: 0.9 },
          { label: "35", dimensions: "35 x 25 x 18 cm", strapDrop: "11 cm", whatFits: "13\" laptop, A4 documents, wallet, phone, cosmetics bag", popularityWeight: 0.7 },
          { label: "40", dimensions: "40 x 30 x 21 cm", strapDrop: "12 cm", whatFits: "15\" laptop, A4 documents, overnight essentials", popularityWeight: 0.5 },
        ],
        closureType: "Sangles with turn-lock",
        strapStyle: "Double rolled top handles",
        hardwareColors: ["Palladium", "Gold", "Rose Gold", "Brushed Gold", "Permabrass"],
        interiorColors: [...HERMES_INTERIOR_COLORS],
        interior: "Chevre leather lining with one zipper pocket and one open pocket",
        popularity: 100,
        subcategory: "top-handle",
        department: "women",
      },
      {
        handle: "kelly",
        title: "Kelly",
        description:
          "Elegant trapezoidal bag with a single top handle and signature turn-lock closure.",
        promo:
          "Elegant trapezoidal silhouette with a single top handle, signature turn-lock closure, and removable shoulder strap. Features a structured body, sangles closure, and interior with one zipper pocket and two open pockets.",
        colors: [...HERMES_CORE_COLORS],
        materials: [...HERMES_CORE_LEATHERS],
        sizes: [
          { label: "20", dimensions: "20 x 14 x 7 cm", strapDrop: "6 cm (handle) / 35 cm (strap)", whatFits: "Phone, cards, keys, lipstick", popularityWeight: 1.0 },
          { label: "25", dimensions: "25 x 17 x 10 cm", strapDrop: "8 cm (handle) / 35 cm (strap)", whatFits: "Phone, wallet, keys, small cosmetics pouch", popularityWeight: 0.95 },
          { label: "28", dimensions: "28 x 22 x 10 cm", strapDrop: "9 cm (handle) / 37 cm (strap)", whatFits: "iPad mini, wallet, phone, sunglasses, cosmetics pouch", popularityWeight: 0.85 },
          { label: "32", dimensions: "32 x 23 x 12 cm", strapDrop: "10 cm (handle) / 37 cm (strap)", whatFits: "iPad, A5 notebook, wallet, phone, cosmetics bag", popularityWeight: 0.6 },
          { label: "35", dimensions: "35 x 25 x 13 cm", strapDrop: "11 cm (handle) / 37 cm (strap)", whatFits: "13\" laptop, A4 documents, wallet, phone", popularityWeight: 0.45 },
        ],
        closureType: "Front flap with turn-lock",
        strapStyle: "Single top handle with removable shoulder strap",
        hardwareColors: ["Palladium", "Gold", "Rose Gold", "Brushed Gold", "Permabrass"],
        interiorColors: [...HERMES_INTERIOR_COLORS],
        interior: "Lined interior with one zipper pocket and two open pockets",
        popularity: 95,
        subcategory: "top-handle",
        department: "women",
      },
      {
        handle: "constance",
        title: "Constance",
        description:
          "Compact crossbody bag with the signature oversized H-clasp buckle.",
        promo:
          "Compact crossbody bag defined by the signature oversized H-clasp closure. Features a sleek front flap, adjustable shoulder strap, and interior with multiple card slots and a flat pocket.",
        colors: [
          "Noir", "Gold", "Etoupe", "Bleu Nuit", "Rouge Casaque",
          "Craie", "Orange H", "Rose Sakura", "Bleu Electrique",
          "Barenia Fauve", "Nata",
        ],
        materials: [
          "Epsom", "Swift", "Box Calf",
          "Ostrich", "Crocodile Porosus", "Crocodile Niloticus",
        ],
        sizes: [
          { label: "18", dimensions: "18 x 15 x 5 cm", strapDrop: "46 cm", whatFits: "Phone, cards, keys, lipstick", popularityWeight: 1.0 },
          { label: "24", dimensions: "24 x 18 x 6 cm", strapDrop: "50 cm", whatFits: "Phone, wallet, keys, sunglasses, small cosmetics", popularityWeight: 0.8 },
        ],
        closureType: "H-buckle clasp",
        strapStyle: "Adjustable crossbody strap",
        hardwareColors: ["Palladium", "Gold", "Rose Gold"],
        interiorColors: [...HERMES_INTERIOR_COLORS],
        interior: "Multiple card slots and one flat pocket",
        popularity: 80,
        subcategory: "crossbody",
        department: "women",
      },
      {
        handle: "picotin",
        title: "Picotin Lock",
        description:
          "Open-top bucket bag with a padlock accent, available in multiple sizes.",
        promo:
          "Open-top bucket bag with a distinctive padlock accent and double top handles. Features a spacious unlined interior, press-stud side closures, and a relaxed silhouette perfect for everyday use.",
        colors: [
          "Noir", "Gold", "Etoupe", "Craie", "Orange H",
          "Vert Cypress", "Rose Sakura", "Bleu Electrique",
          "Vert Amande", "Nata",
        ],
        materials: ["Clemence", "Togo", "Epsom", "Swift"],
        sizes: [
          { label: "18", dimensions: "18 x 18 x 13 cm", strapDrop: "11 cm", whatFits: "Phone, wallet, keys, small cosmetics", popularityWeight: 0.9 },
          { label: "22", dimensions: "22 x 22 x 15 cm", strapDrop: "13 cm", whatFits: "Water bottle, wallet, phone, sunglasses, cosmetics bag", popularityWeight: 1.0 },
        ],
        closureType: "Open top with turn-lock strap",
        strapStyle: "Double short top handles",
        hardwareColors: ["Palladium", "Gold"],
        interiorColors: [...HERMES_INTERIOR_COLORS],
        interior: "Unlined interior with spacious open compartment",
        popularity: 50,
        subcategory: "bucket",
        department: "women",
      },
      {
        handle: "garden-party",
        title: "Garden Party",
        description:
          "Lightweight unstructured tote in canvas and leather, ideal for everyday use.",
        promo:
          "Lightweight unstructured tote combining Toile H canvas with leather trim. Features an open top, interior zipper pocket, and snap-button side gussets for adjustable width. A versatile everyday companion.",
        colors: [
          "Noir", "Gold", "Etoupe", "Craie", "Orange H",
          "Bleu Nuit", "Rose Sakura", "Vert Amande",
        ],
        materials: ["Toile H Canvas", "Negonda", "Country"],
        sizes: [
          { label: "30", dimensions: "30 x 26 x 15 cm", strapDrop: "12 cm", whatFits: "iPad, wallet, phone, sunglasses, light jacket", popularityWeight: 0.85 },
          { label: "36", dimensions: "36 x 26 x 17 cm", strapDrop: "14 cm", whatFits: "13\" laptop, A4 documents, wallet, phone, light jacket", popularityWeight: 1.0 },
        ],
        closureType: "Open top",
        strapStyle: "Double flat top handles",
        hardwareColors: ["Palladium", "Gold"],
        interiorColors: [...HERMES_INTERIOR_COLORS],
        interior: "Interior zipper pocket with cotton canvas lining",
        popularity: 35,
        subcategory: "tote",
        department: "women",
      },
      {
        handle: "evelyne",
        title: "Evelyne",
        description:
          "Casual crossbody bag with a perforated H motif on the front panel.",
        promo:
          "Casual crossbody bag with the iconic perforated H motif on the front panel. Features an adjustable canvas shoulder strap, rear open pocket, and a snap-button closure. Relaxed and effortless for daily wear.",
        colors: [
          "Noir", "Gold", "Etoupe", "Bleu Nuit", "Craie",
          "Orange H", "Vert Cypress", "Rose Sakura", "Bleu Electrique",
        ],
        materials: ["Clemence", "Togo", "Epsom"],
        sizes: [
          { label: "16 TPM", dimensions: "16 x 18 x 5 cm", strapDrop: "47 cm", whatFits: "Phone, cards, keys, lipstick", popularityWeight: 0.8 },
          { label: "29 PM", dimensions: "29 x 30 x 10 cm", strapDrop: "52 cm", whatFits: "iPad, wallet, phone, sunglasses, cosmetics pouch", popularityWeight: 1.0 },
          { label: "33 GM", dimensions: "33 x 33 x 10 cm", strapDrop: "52 cm", whatFits: "13\" laptop, wallet, phone, sunglasses, cosmetics bag", popularityWeight: 0.7 },
        ],
        closureType: "Snap button",
        strapStyle: "Adjustable canvas shoulder strap",
        hardwareColors: ["Palladium", "Gold"],
        interiorColors: [...HERMES_INTERIOR_COLORS],
        interior: "Rear open pocket with unlined canvas interior",
        popularity: 40,
        subcategory: "crossbody",
        department: "women",
      },
      {
        handle: "bolide",
        title: "Bolide",
        description:
          "Rounded zip-top bag — the first Hermès design to feature a zipper.",
        promo:
          "Rounded zip-top bag — the first Hermès design to feature a zipper. Features a curved silhouette, single top handle, removable shoulder strap, and a fully zipped closure. Interior with one zipper pocket and one open pocket.",
        colors: [...HERMES_CORE_COLORS],
        materials: [...HERMES_CORE_LEATHERS],
        sizes: [
          { label: "27", dimensions: "27 x 20 x 10 cm", strapDrop: "9 cm (handle) / 40 cm (strap)", whatFits: "Wallet, phone, sunglasses, cosmetics pouch", popularityWeight: 1.0 },
          { label: "31", dimensions: "31 x 23 x 11 cm", strapDrop: "10 cm (handle) / 42 cm (strap)", whatFits: "iPad, wallet, phone, sunglasses, cosmetics bag", popularityWeight: 0.85 },
        ],
        closureType: "Zip top",
        strapStyle: "Single top handle with removable shoulder strap",
        hardwareColors: ["Palladium", "Gold", "Rose Gold", "Brushed Gold", "Permabrass"],
        interiorColors: [...HERMES_INTERIOR_COLORS],
        interior: "Lined interior with one zipper pocket and one open pocket",
        popularity: 45,
        subcategory: "top-handle",
        department: "women",
      },
      {
        handle: "lindy",
        title: "Lindy",
        description:
          "Dual-handle shoulder bag with a distinctive curved silhouette and zip closure.",
        promo:
          "Dual-handle shoulder bag with a distinctive curved silhouette and top zip closure. Features two short handles for hand carry, a wide zip opening for easy access, and a relaxed, slouchy body. Interior with one zipper pocket.",
        colors: [
          "Noir", "Gold", "Etoupe", "Craie", "Bleu Nuit",
          "Rose Sakura", "Vert Cypress", "Gris Asphalte", "Nata",
        ],
        materials: ["Clemence", "Togo", "Swift"],
        sizes: [
          { label: "26", dimensions: "26 x 18 x 14 cm", strapDrop: "17 cm", whatFits: "Wallet, phone, sunglasses, cosmetics pouch", popularityWeight: 1.0 },
          { label: "30", dimensions: "30 x 21 x 16 cm", strapDrop: "19 cm", whatFits: "iPad, wallet, phone, sunglasses, cosmetics bag", popularityWeight: 0.85 },
        ],
        closureType: "Double zip",
        strapStyle: "Dual short handles for hand and shoulder carry",
        hardwareColors: ["Palladium", "Gold"],
        interiorColors: [...HERMES_INTERIOR_COLORS],
        interior: "Lined interior with one zipper pocket",
        popularity: 55,
        subcategory: "shoulder",
        department: "women",
      },
    ],
  },
];
/**
 * Color popularity multipliers (0–1) based on resale demand data.
 * Tier 1 (1.0): Noir, Gold, Etoupe — 90-100% resale retention.
 * Tier 2 (0.9): Craie, Nata, Barenia Fauve — strong neutrals.
 * Tier 3 (0.8): Bleu Nuit, Gris Asphalte, Beton — modern neutrals.
 * Tier 4 (0.7): Rouge Casaque, Orange H, Rose Sakura — statement colors with collector demand.
 * Tier 5 (0.6): Seasonal/bold — lower general demand but niche interest.
 */
const HERMES_COLOR_POPULARITY: Record<string, number> = {
  "Noir": 1.0, "Gold": 1.0, "Etoupe": 1.0,
  "Craie": 0.9, "Nata": 0.9, "Barenia Fauve": 0.9,
  "Bleu Nuit": 0.8, "Gris Asphalte": 0.8, "Beton": 0.8,
  "Rouge Casaque": 0.7, "Orange H": 0.7, "Rose Sakura": 0.7, "Bleu Electrique": 0.7,
  "Vert Cypress": 0.6, "Bleu Jean": 0.6, "Rose Pourpre": 0.6,
  "Jaune de Naples": 0.6, "Vert Amande": 0.6, "Terre Battue": 0.6,
};

/**
 * Chinese display labels for catalog option values (materials, colors, hardware).
 * Format: "中文名称 (English)" so operators recognise both.
 * The stored draft value is always the English key.
 */
export const ZH_CATALOG_LABELS: Record<string, string> = {
  // Leathers / Materials
  "Togo": "托戈皮 (Togo)",
  "Epsom": "埃普索姆 (Epsom)",
  "Clemence": "克莱蒙斯 (Clemence)",
  "Swift": "斯威夫特 (Swift)",
  "Box Calf": "盒形小牛皮 (Box Calf)",
  "Ostrich": "鸵鸟皮 (Ostrich)",
  "Crocodile Porosus": "孔雀鳄鱼皮 (Crocodile Porosus)",
  "Crocodile Niloticus": "尼罗鳄鱼皮 (Crocodile Niloticus)",
  "Chevre Mysore": "迈索尔山羊皮 (Chevre Mysore)",
  "Toile H Canvas": "H帆布 (Toile H Canvas)",
  "Negonda": "内贡达 (Negonda)",
  "Country": "乡村皮 (Country)",
  // Colors
  "Noir": "黑色 (Noir)",
  "Gold": "金色 (Gold)",
  "Etoupe": "灰褐色 (Etoupe)",
  "Bleu Nuit": "夜蓝色 (Bleu Nuit)",
  "Rouge Casaque": "骑手红 (Rouge Casaque)",
  "Craie": "粉笔白 (Craie)",
  "Orange H": "爱马仕橙 (Orange H)",
  "Vert Cypress": "柏树绿 (Vert Cypress)",
  "Rose Sakura": "樱花粉 (Rose Sakura)",
  "Bleu Electrique": "电光蓝 (Bleu Electrique)",
  "Barenia Fauve": "巴雷尼亚黄褐色 (Barenia Fauve)",
  "Gris Asphalte": "沥青灰 (Gris Asphalte)",
  "Bleu Jean": "牛仔蓝 (Bleu Jean)",
  "Rose Pourpre": "紫红玫瑰色 (Rose Pourpre)",
  "Jaune de Naples": "那不勒斯黄 (Jaune de Naples)",
  "Vert Amande": "杏仁绿 (Vert Amande)",
  "Beton": "混凝土灰 (Beton)",
  "Nata": "奶油白 (Nata)",
  "Terre Battue": "红土色 (Terre Battue)",
  "Rouge H": "爱马仕红 (Rouge H)",
  "Rose Jaipur": "斋浦尔玫瑰粉 (Rose Jaipur)",
  "Gris Perle": "珍珠灰 (Gris Perle)",
  "Jaune Ambre": "琥珀黄 (Jaune Ambre)",
  "Bougainvillier": "三角梅粉 (Bougainvillier)",
  // Hardware colors
  "Palladium": "钯金色 (Palladium)",
  "Rose Gold": "玫瑰金 (Rose Gold)",
  "Brushed Gold": "拉丝金 (Brushed Gold)",
  "Permabrass": "永久黄铜 (Permabrass)",
};

/* eslint-enable ds/no-hardcoded-copy */

/**
 * Compute a composite popularity score (1–100) from collection base popularity,
 * size weight, and the highest-demand color selected.
 * Returns undefined when no registry data is available.
 */
export function computePopularity(
  brandHandle: string,
  collectionHandle: string,
  sizeLabel: string,
  colors: string,
): number | undefined {
  const coll = findCollection(brandHandle, collectionHandle);
  if (!coll?.popularity) return undefined;

  const sizeMatch = coll.sizes?.find((s) => s.label === sizeLabel);
  const sizeWeight = sizeMatch?.popularityWeight ?? 1;

  const colorList = colors.split(/[|,]+/).map((s) => s.trim()).filter(Boolean);
  const colorWeight = colorList.length > 0
    ? Math.max(...colorList.map((c) => HERMES_COLOR_POPULARITY[c] ?? 0.5))
    : 1;

  return Math.round(coll.popularity * sizeWeight * colorWeight);
}

export function findBrand(handle: string): CatalogBrandEntry | undefined {
  return XA_BRAND_REGISTRY.find((b) => b.handle === handle);
}

export function findCollection(
  brandHandle: string,
  collectionHandle: string,
): CatalogCollectionEntry | undefined {
  return findBrand(brandHandle)?.collections.find(
    (c) => c.handle === collectionHandle,
  );
}

export function findCollectionColors(
  brandHandle: string,
  collectionHandle: string,
): string[] | undefined {
  return findCollection(brandHandle, collectionHandle)?.colors;
}

export function findCollectionMaterials(
  brandHandle: string,
  collectionHandle: string,
): string[] | undefined {
  return findCollection(brandHandle, collectionHandle)?.materials;
}

export function findCollectionSizes(
  brandHandle: string,
  collectionHandle: string,
): CollectionSize[] | undefined {
  return findCollection(brandHandle, collectionHandle)?.sizes;
}

export function findCollectionClosureType(
  brandHandle: string,
  collectionHandle: string,
): string | undefined {
  return findCollection(brandHandle, collectionHandle)?.closureType;
}

export function findCollectionHardwareColors(
  brandHandle: string,
  collectionHandle: string,
): string[] | undefined {
  return findCollection(brandHandle, collectionHandle)?.hardwareColors;
}

export function findCollectionInteriorColors(
  brandHandle: string,
  collectionHandle: string,
): string[] | undefined {
  return findCollection(brandHandle, collectionHandle)?.interiorColors;
}

export function findCollectionDefaults(
  brandHandle: string,
  collectionHandle: string,
): { subcategory?: string; department?: string; closureType?: string; strapStyle?: string; interior?: string } | undefined {
  const coll = findCollection(brandHandle, collectionHandle);
  if (!coll?.subcategory && !coll?.department && !coll?.closureType && !coll?.strapStyle && !coll?.interior) return undefined;
  return {
    subcategory: coll.subcategory,
    department: coll.department,
    closureType: coll.closureType,
    strapStyle: coll.strapStyle,
    interior: coll.interior,
  };
}
