"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryItemDtoSchema = exports.inventoryItemSchema = exports.variantAttributesSchema = void 0;
exports.variantKey = variantKey;
const zod_1 = require("zod");
exports.variantAttributesSchema = zod_1.z.record(zod_1.z.string());
exports.inventoryItemSchema = zod_1.z
    .object({
    sku: zod_1.z.string().min(1, "sku is required"), // i18n-exempt -- CORE-1014 validation message
    productId: zod_1.z.string().min(1, "productId is required"), // i18n-exempt -- CORE-1014 validation message
    quantity: zod_1.z.number().int().min(0),
    variantAttributes: exports.variantAttributesSchema,
    lowStockThreshold: zod_1.z.number().int().min(0).optional(),
    wearCount: zod_1.z.number().int().min(0).optional(),
    wearAndTearLimit: zod_1.z.number().int().min(0).optional(),
    maintenanceCycle: zod_1.z.number().int().min(0).optional(),
})
    .strict();
function variantKey(sku, attrs) {
    const variantPart = Object.entries(attrs)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join("|");
    return variantPart ? `${sku}#${variantPart}` : sku;
}
exports.inventoryItemDtoSchema = zod_1.z
    .object({
    sku: zod_1.z.string().min(1, "sku is required"), // i18n-exempt -- CORE-1014 validation message
    productId: zod_1.z.string().min(1, "productId is required"), // i18n-exempt -- CORE-1014 validation message
    quantity: zod_1.z.number().int().min(0),
    variant: exports.variantAttributesSchema.optional(),
    variantAttributes: exports.variantAttributesSchema.optional(),
    lowStockThreshold: zod_1.z.number().int().min(0).optional(),
    wearCount: zod_1.z.number().int().min(0).optional(),
    wearAndTearLimit: zod_1.z.number().int().min(0).optional(),
    maintenanceCycle: zod_1.z.number().int().min(0).optional(),
})
    .strict();
