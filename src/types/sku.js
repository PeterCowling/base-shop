"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skuSchema = void 0;
// src/types/sku.ts
var zod_1 = require("zod");
/** Runtime validator + compile-time source of truth */
exports.skuSchema = zod_1.z.object({
    id: zod_1.z.string(),
    slug: zod_1.z.string(),
    title: zod_1.z.string(),
    /** Unit price in minor currency units (e.g. cents) */
    price: zod_1.z.number(),
    /** Refundable deposit, required by business rules */
    deposit: zod_1.z.number(), // 👈  add the missing field
    image: zod_1.z.string(),
    sizes: zod_1.z.array(zod_1.z.string()),
    description: zod_1.z.string(),
});
