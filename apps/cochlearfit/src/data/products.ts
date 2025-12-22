import type { Product, ProductColor, ProductSize, ProductVariant } from "@/types/product";

type ColorOption = {
  key: ProductColor;
  label: string;
  hex: string;
};

type SizeOption = {
  key: ProductSize;
  label: string;
};

const COLORS: ColorOption[] = [
  { key: "sand", label: "Sand", hex: "hsl(var(--color-sand))" },
  { key: "ocean", label: "Ocean", hex: "hsl(var(--color-ocean))" },
  { key: "berry", label: "Berry", hex: "hsl(var(--color-berry))" },
];

const SIZES: SizeOption[] = [
  { key: "kids", label: "Kids" },
  { key: "adult", label: "Adult" },
];

const buildVariants = (
  prefix: string,
  priceBySize: Record<ProductSize, number>
): ProductVariant[] => {
  return SIZES.flatMap((size) =>
    COLORS.map((color) => ({
      id: `${prefix}-${size.key}-${color.key}`,
      size: size.key,
      color: color.key,
      colorLabel: color.label,
      colorHex: color.hex,
      price: priceBySize[size.key],
      currency: "USD",
      stripePriceId: `price_${prefix}_${size.key}_${color.key}`,
      inStock: true,
    }))
  );
};

export const products: Product[] = [
  {
    id: "cochlearfit-classic",
    slug: "classic",
    name: "product.classic.name",
    style: "product.classic.style",
    shortDescription: "product.classic.shortDescription",
    longDescription: "product.classic.longDescription",
    featureBullets: [
      "product.classic.feature1",
      "product.classic.feature2",
      "product.classic.feature3",
    ],
    materials: ["product.classic.material1", "product.classic.material2"],
    careInstructions: [
      "product.classic.care1",
      "product.classic.care2",
      "product.classic.care3",
    ],
    compatibilityNotes: [
      "product.classic.compatibility1",
      "product.classic.compatibility2",
      "product.classic.compatibility3",
    ],
    images: [
      {
        src: "/images/classic-hero.svg",
        alt: "product.classic.image1Alt",
        width: 820,
        height: 520,
      },
      {
        src: "/images/classic-detail.svg",
        alt: "product.classic.image2Alt",
        width: 820,
        height: 520,
      },
    ],
    variants: buildVariants("classic", { kids: 3400, adult: 3800 }),
  },
  {
    id: "cochlearfit-sport",
    slug: "sport",
    name: "product.sport.name",
    style: "product.sport.style",
    shortDescription: "product.sport.shortDescription",
    longDescription: "product.sport.longDescription",
    featureBullets: [
      "product.sport.feature1",
      "product.sport.feature2",
      "product.sport.feature3",
    ],
    materials: ["product.sport.material1", "product.sport.material2"],
    careInstructions: [
      "product.sport.care1",
      "product.sport.care2",
      "product.sport.care3",
    ],
    compatibilityNotes: [
      "product.sport.compatibility1",
      "product.sport.compatibility2",
      "product.sport.compatibility3",
    ],
    images: [
      {
        src: "/images/sport-hero.svg",
        alt: "product.sport.image1Alt",
        width: 820,
        height: 520,
      },
      {
        src: "/images/sport-detail.svg",
        alt: "product.sport.image2Alt",
        width: 820,
        height: 520,
      },
    ],
    variants: buildVariants("sport", { kids: 3600, adult: 4000 }),
  },
];

export const sizes = SIZES;
export const colors = COLORS;
