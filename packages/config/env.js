"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = exports.envSchema = void 0;
var zod_1 = require("zod");
exports.envSchema = zod_1.z.object({
    STRIPE_SECRET_KEY: zod_1.z.string(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: zod_1.z.string(),
    NEXTAUTH_SECRET: zod_1.z.string().optional(),
    PREVIEW_TOKEN_SECRET: zod_1.z.string().optional(),
    NODE_ENV: zod_1.z.string().optional(),
    OUTPUT_EXPORT: zod_1.z.string().optional(),
    NEXT_PUBLIC_PHASE: zod_1.z.string().optional(),
    NEXT_PUBLIC_DEFAULT_SHOP: zod_1.z.string().optional(),
    NEXT_PUBLIC_SHOP_ID: zod_1.z.string().optional(),
});
exports.env = exports.envSchema.parse(process.env);
