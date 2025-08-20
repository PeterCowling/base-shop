/* -------------------------------------------------------------------------- */
/*  Storefront types & helpers                                                */
/* -------------------------------------------------------------------------- */
/** Mock catalogue (3 items) */
export const PRODUCTS = [
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
        description: "Lightweight upper knit from 90 % recycled PET. Natural cork insole.",
    },
    {
        id: "sand-sneaker",
        slug: "sand-sneaker",
        title: "Eco Runner — Sand",
        price: 119,
        deposit: 50,
        stock: 2,
        forSale: true,
        forRental: false,
        media: [{ url: "/shop/sand.jpg", type: "image" }],
        sizes: ["36", "37", "38", "39", "40", "41", "42", "43", "44"],
        description: "Earth-tone edition coloured with mineral pigments; zero water waste.",
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
        description: "All-black favourite with algae-based foam midsole for extra bounce.",
    },
];
/** Helper to fetch one product (could be remote PIM later) */
export function getProductBySlug(slug) {
    return PRODUCTS.find((p) => p.slug === slug);
}
/** Lookup a product by SKU id */
export function getProductById(id) {
    const sku = PRODUCTS.find((p) => p.id === id);
    return sku && sku.stock > 0 ? sku : undefined;
}
/* -------------------------------------------------------------------------- */
/*  Utility                                                                   */
/* -------------------------------------------------------------------------- */
/**
 * Exhaustiveness helper for switch statements on {@link Locale}.
 * (Compile-time only; returns the value unchanged.)
 */
export function assertLocale(l) {
    return l;
}
