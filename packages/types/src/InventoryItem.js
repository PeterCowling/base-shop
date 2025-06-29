"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryItemSchema = void 0;
var zod_1 = require("zod");
exports.inventoryItemSchema = zod_1.z.object({
    sku: zod_1.z.string(),
    quantity: zod_1.z.number(),
});
