/* packages/platform-core/products.ts */

/* -------------------------------------------------------------------------- */
/*  Storefront types & helpers                                                */
/* -------------------------------------------------------------------------- */

export type SKU = {
  id: string;
  slug: string;
  title: string;
  price: number; // whole euros for demo
  image: string;
  sizes: string[];
  description: string;
};

/** Mock catalogue (3 items) */
export const PRODUCTS: SKU[] = [
  {
    id: "green-sneaker",
    slug: "green-sneaker",
    title: "Eco Runner — Green",
    price: 119,
    image: "/shop/green.jpg",
    sizes: ["36", "37", "38", "39", "40", "41", "42", "43"],
    description:
      "Lightweight upper knit from 90 % recycled PET. Natural cork insole.",
  },
  {
    id: "sand-sneaker",
    slug: "sand-sneaker",
    title: "Eco Runner — Sand",
    price: 119,
    image: "/shop/sand.jpg",
    sizes: ["36", "37", "38", "39", "40", "41", "42", "43", "44"],
    description:
      "Earth-tone edition coloured with mineral pigments; zero water waste.",
  },
  {
    id: "black-sneaker",
    slug: "black-sneaker",
    title: "Eco Runner — Black",
    price: 119,
    image: "/shop/black.jpg",
    sizes: ["38", "39", "40", "41", "42", "43", "44"],
    description:
      "All-black favourite with algae-based foam midsole for extra bounce.",
  },
];

/** Helper to fetch one product (could be remote PIM later) */
export function getProductBySlug(slug: string): SKU | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

/* -------------------------------------------------------------------------- */
/*  CMS-side types                                                            */
/* -------------------------------------------------------------------------- */

export interface ProductCore {
  id: string; // ULID
  sku: string;
  title: Record<string, string>; // locale -> title
  price: number; // minor units (e.g. cents)
  currency: string; // ISO-4217 code
  images: string[];
  created_at: string; // ISO timestamp
  updated_at: string;
}

export type PublicationStatus = "draft" | "live" | "retired";

export interface ProductPublication extends ProductCore {
  shop: string; // e.g. 'abc'
  status: PublicationStatus;
  row_version: number;
}
