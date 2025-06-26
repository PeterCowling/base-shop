"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rentalOrderSchema = void 0;
var zod_1 = require("zod");
exports.rentalOrderSchema = zod_1.z.object({
    id: zod_1.z.string(),
    sessionId: zod_1.z.string(),
    shop: zod_1.z.string(),
    deposit: zod_1.z.number(),
    expectedReturnDate: zod_1.z.string().optional(),
    startedAt: zod_1.z.string(),
    returnedAt: zod_1.z.string().optional(),
    refundedAt: zod_1.z.string().optional(),
});
