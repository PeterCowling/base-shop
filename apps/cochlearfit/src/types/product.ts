export type ProductSize = "kids" | "adult";
export type ProductColor = "sand" | "ocean" | "berry";
export type CurrencyCode = "USD";

export type ProductImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type ProductVariant = {
  id: string;
  size: ProductSize;
  color: ProductColor;
  colorLabel: string;
  colorHex: string;
  price: number;
  currency: CurrencyCode;
  stripePriceId: string;
  inStock: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  style: string;
  shortDescription: string;
  longDescription: string;
  featureBullets: string[];
  materials: string[];
  careInstructions: string[];
  compatibilityNotes: string[];
  images: ProductImage[];
  variants: ProductVariant[];
};
