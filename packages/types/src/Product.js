"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skuSchema = exports.localeSchema = void 0;
var zod_1 = require("zod");
var constants_1 = require("./constants");
exports.localeSchema = zod_1.z.enum(constants_1.LOCALES);
/** Runtime validator + compile-time source of truth */
exports.skuSchema = zod_1.z.object({
    id: zod_1.z.string(),
    slug: zod_1.z.string(),
    title: zod_1.z.string(),
    /** Unit price in minor currency units (e.g. cents) */
    price: zod_1.z.number(),
    /** Refundable deposit, required by business rules */
    deposit: zod_1.z.number(),
    image: zod_1.z.string(),
    sizes: zod_1.z.array(zod_1.z.string()),
    description: zod_1.z.string(),
});
