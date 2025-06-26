"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopSettingsSchema = void 0;
var zod_1 = require("zod");
var Product_1 = require("./Product");
exports.shopSettingsSchema = zod_1.z.object({
    languages: zod_1.z.array(Product_1.localeSchema),
});
