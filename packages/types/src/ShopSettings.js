"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopSettingsSchema = void 0;
var zod_1 = require("zod");
var Product_1 = require("./Product");
var Shop_1 = require("./Shop");
exports.shopSettingsSchema = zod_1.z.object({
  languages: zod_1.z.array(Product_1.localeSchema).readonly(),
  seo: zod_1.z.record(Product_1.localeSchema, Shop_1.shopSeoFieldsSchema),
  freezeTranslations: zod_1.z.boolean().optional(),
  updatedAt: zod_1.z.string(),
  updatedBy: zod_1.z.string(),
});
