// packages/platform-core/products.ts
/* -------------------------------------------------------------------------- */
/*  Locale helpers                                                            */
/* -------------------------------------------------------------------------- */
import { type Locale, type SKU } from "@acme/types";

/* -------------------------------------------------------------------------- */
/*  Storefront types & helpers                                                */
/* -------------------------------------------------------------------------- */

/** Mock catalogue (3 items) */
export const PRODUCTS: readonly SKU[] = [
  {
    id: "green-sneaker",
    slug: "green-sneaker",
    title: "Eco Runner — Green",
    price: 119,
    deposit: 50,
    stock: 5,
    forSale: true,
    forRental: false,
    media: [{ url: "/shop/green.jpg", type: "image" }],
    sizes: ["36", "37", "38", "39", "40", "41", "42", "43"],
    description:
      "Lightweight upper knit from 90 % recycled PET. Natural cork insole.",
  },
  {
    id: "sand-sneaker",
    slug: "sand-sneaker",
    title: "Eco Runner — Sand",
    price: 119,
    deposit: 50,
    stock: 2,
    forSale: true,
    forRental: true,
    media: [{ url: "/shop/sand.jpg", type: "image" }],
    sizes: ["36", "37", "38", "39", "40", "41", "42", "43", "44"],
    description:
      "Earth-tone edition coloured with mineral pigments; zero water waste.",
  },
  {
    id: "black-sneaker",
    slug: "black-sneaker",
    title: "Eco Runner — Black",
    price: 119,
    deposit: 50,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "/shop/black.jpg", type: "image" }],
    sizes: ["38", "39", "40", "41", "42", "43", "44"],
    description:
      "All-black favourite with algae-based foam midsole for extra bounce.",
  },
];

/**
 * Runtime validator for {@link SKU} objects.
 * Ensures required fields are present with correct types.
 */
export function isSKU(data: unknown): data is SKU {
  if (!data || typeof data !== "object") return false;
  const sku = data as Record<string, unknown>;
  return (
    typeof sku.id === "string" &&
    typeof sku.slug === "string" &&
    typeof sku.price === "number" &&
    typeof sku.stock === "number"
  );
}

/** Helper to fetch one product (could be remote PIM later) */
export function getProductBySlug(slug: string): SKU | undefined {
  const sku = PRODUCTS.find((p) => p.slug === slug);
  return isSKU(sku) ? sku : undefined;
}

/** Lookup a product by SKU id */
export function getProductById(id: string): SKU | undefined {
  const sku = PRODUCTS.find((p) => p.id === id);
  return isSKU(sku) && sku.stock > 0 ? sku : undefined;
}

/* -------------------------------------------------------------------------- */
/*  CMS-side types                                                            */
/* -------------------------------------------------------------------------- */
// Types imported from the shared domain model
export type {
  Locale,
  ProductCore,
  ProductPublication,
  PublicationStatus,
  SKU,
} from "@acme/types";

/* -------------------------------------------------------------------------- */
/*  Utility                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Exhaustiveness helper for switch statements on {@link Locale}.
 * (Compile-time only; returns the value unchanged.)
 */
export function assertLocale(l: Locale): Locale {
  return l;
}
