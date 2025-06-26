"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopSchema = void 0;
var zod_1 = require("zod");
exports.shopSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    catalogFilters: zod_1.z.array(zod_1.z.string()),
    themeId: zod_1.z.string(),
    /** Mapping of design tokens to theme values */
    themeTokens: zod_1.z.record(zod_1.z.string()),
    /** Mapping of logical filter keys to catalog attributes */
    filterMappings: zod_1.z.record(zod_1.z.string()),
});
