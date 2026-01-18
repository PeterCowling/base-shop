"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_SORTS = exports.MAX_LIMIT = exports.assertLocale = exports.PRODUCTS = void 0;
exports.getProductBySlug = getProductBySlug;
exports.getProductById = getProductById;
exports.validateQuery = validateQuery;
exports.getProducts = getProducts;
exports.searchProducts = searchProducts;
const base = __importStar(require("./products/index"));
const defaultFilterMappings_1 = require("./defaultFilterMappings");
/** Simple in-memory list for legacy/sync call sites (stories, demos, cart sync path). */
exports.PRODUCTS = [...base.PRODUCTS];
/** Quick slug lookup for demos. */
function getProductBySlug(slug) {
    return base.getProductBySlug(slug) ?? null;
}
function getProductById(a, b) {
    if (typeof b === "undefined") {
        // Legacy sync path: look up in local PRODUCTS
        return base.getProductById(a) ?? null;
    }
    return Promise.resolve().then(() => __importStar(require("./repositories/products.server"))).then(async (m) => {
        try {
            const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 100));
            const product = await Promise.race([
                m.getProductById(a, b),
                timeout,
            ]);
            return product ?? base.getProductById(b) ?? null;
        }
        catch {
            return base.getProductById(b) ?? null;
        }
    })
        .catch(() => base.getProductById(b) ?? null);
}
// Non-conflicting re-exports are safe:
var index_1 = require("./products/index");
Object.defineProperty(exports, "assertLocale", { enumerable: true, get: function () { return index_1.assertLocale; } });
/** Maximum allowed page size when listing products. */
exports.MAX_LIMIT = 100;
exports.ALLOWED_SORTS = ["title", "price"];
/**
 * Validate query options for product listings.
 *
 * Sort and filter are passed through for now, but page and limit are
 * normalized so callers can't request out-of-range values.
 */
function validateQuery({ sort, filter, page, limit, } = {}) {
    const safeSort = exports.ALLOWED_SORTS.includes(sort)
        ? sort
        : exports.ALLOWED_SORTS[0];
    const allowedFilters = new Set(Object.keys(defaultFilterMappings_1.defaultFilterMappings));
    const safeFilter = Object.fromEntries(Object.entries(filter ?? {}).filter(([key]) => allowedFilters.has(key)));
    const pageNum = Math.max(1, Math.floor(page ?? 1));
    const limitRaw = Math.floor(limit ?? exports.MAX_LIMIT);
    const limitNum = Math.min(exports.MAX_LIMIT, Math.max(1, limitRaw));
    return { sort: safeSort, filter: safeFilter, page: pageNum, limit: limitNum };
}
async function getProducts(a) {
    if (typeof a !== "string" || a.trim() === "") {
        return [...base.PRODUCTS];
    }
    try {
        const { readRepo } = await Promise.resolve().then(() => __importStar(require("./repositories/products.server")));
        return await readRepo(a);
    }
    catch {
        return [...base.PRODUCTS];
    }
}
async function searchProducts(a, b) {
    if (typeof b === "undefined") {
        if (a.trim() === "") {
            throw new Error("searchProducts requires a query string");
        }
        const q = a.toLowerCase();
        return base.PRODUCTS.filter((p) => (p.title ?? "").toLowerCase().includes(q));
    }
    if (a.trim() === "" || b.trim() === "") {
        throw new Error("searchProducts requires both shop and query string");
    }
    try {
        const { readRepo } = await Promise.resolve().then(() => __importStar(require("./repositories/products.server")));
        const products = await readRepo(a);
        const q = b.toLowerCase();
        return products.filter((p) => (p.title ?? "").toLowerCase().includes(q));
    }
    catch {
        return [];
    }
}
