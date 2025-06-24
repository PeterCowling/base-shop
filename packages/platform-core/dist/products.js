"use strict";
// packages/platform-core/products.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRODUCTS = exports.LOCALES = void 0;
exports.getProductBySlug = getProductBySlug;
exports.assertLocale = assertLocale;
/**
 * Convenience list of all supported locales.
 * Use this instead of hard-coding the literals across the code-base.
 */
exports.LOCALES = ["en", "de", "it"];
/** Mock catalogue (3 items) */
exports.PRODUCTS = [
    {
        id: "green-sneaker",
        slug: "green-sneaker",
        title: "Eco Runner — Green",
        price: 119,
        image: "/shop/green.jpg",
        sizes: ["36", "37", "38", "39", "40", "41", "42", "43"],
        description: "Lightweight upper knit from 90 % recycled PET. Natural cork insole.",
    },
    {
        id: "sand-sneaker",
        slug: "sand-sneaker",
        title: "Eco Runner — Sand",
        price: 119,
        image: "/shop/sand.jpg",
        sizes: ["36", "37", "38", "39", "40", "41", "42", "43", "44"],
        description: "Earth-tone edition coloured with mineral pigments; zero water waste.",
    },
    {
        id: "black-sneaker",
        slug: "black-sneaker",
        title: "Eco Runner — Black",
        price: 119,
        image: "/shop/black.jpg",
        sizes: ["38", "39", "40", "41", "42", "43", "44"],
        description: "All-black favourite with algae-based foam midsole for extra bounce.",
    },
];
/** Helper to fetch one product (could be remote PIM later) */
function getProductBySlug(slug) {
    return exports.PRODUCTS.find(function (p) { return p.slug === slug; });
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
