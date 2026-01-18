"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRODUCTS = void 0;
exports.isSKU = isSKU;
exports.getProductBySlug = getProductBySlug;
exports.getProductById = getProductById;
exports.assertLocale = assertLocale;
/* -------------------------------------------------------------------------- */
/*  Storefront types & helpers                                                */
/* -------------------------------------------------------------------------- */
/** Mock catalogue (3 items) */
exports.PRODUCTS = [
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
        forRental: true,
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
const SKU_DEFAULTS = {
    id: "",
    slug: "",
    title: "",
    price: 0,
    deposit: 0,
    stock: 0,
    forSale: false,
    forRental: false,
    media: [],
    sizes: [],
    description: "",
};
/**
 * Runtime validator for {@link SKU} objects.
 * Ensures required fields are present with correct types.
 */
function isSKU(data) {
    if (!data || typeof data !== "object")
        return false;
    const sku = data;
    return (typeof sku.id === "string" &&
        typeof sku.slug === "string" &&
        typeof sku.price === "number" &&
        typeof sku.stock === "number");
}
/** Helper to fetch one product (could be remote PIM later) */
function getProductBySlug(slug) {
    const sku = exports.PRODUCTS.find((p) => p.slug === slug);
    return isSKU(sku) ? { ...SKU_DEFAULTS, ...sku } : undefined;
}
/** Lookup a product by SKU id */
function getProductById(id) {
    const sku = exports.PRODUCTS.find((p) => p.id === id);
    return isSKU(sku) && sku.stock > 0 ? { ...SKU_DEFAULTS, ...sku } : undefined;
}
/* -------------------------------------------------------------------------- */
/*  Utility                                                                   */
/* -------------------------------------------------------------------------- */
/**
 * Exhaustiveness helper for switch statements on {@link Locale}.
 * (Compile-time only; returns the value unchanged.)
 */
function assertLocale(l) {
    return l;
}
