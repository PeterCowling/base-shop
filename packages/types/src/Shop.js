"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopSchema = exports.shopSeoFieldsSchema = void 0;
var zod_1 = require("zod");
var Product_1 = require("./Product");
exports.shopSeoFieldsSchema = zod_1.z.object({
  canonicalBase: zod_1.z.string().optional(),
  title: zod_1.z.string().optional(),
  description: zod_1.z.string().optional(),
  image: zod_1.z.string().optional(),
  openGraph: zod_1.z
    .object({
      title: zod_1.z.string().optional(),
      description: zod_1.z.string().optional(),
      url: zod_1.z.string().optional(),
      image: zod_1.z.string().optional(),
    })
    .optional(),
  twitter: zod_1.z
    .object({
      card: zod_1.z.string().optional(),
      title: zod_1.z.string().optional(),
      description: zod_1.z.string().optional(),
      image: zod_1.z.string().optional(),
    })
    .optional(),
  structuredData: zod_1.z.string().optional(),
});
exports.shopSchema = zod_1.z.object({
  id: zod_1.z.string(),
  name: zod_1.z.string(),
  catalogFilters: zod_1.z.array(zod_1.z.string()),
  themeId: zod_1.z.string(),
  /** Mapping of design tokens to theme values */
  themeTokens: zod_1.z.record(zod_1.z.string()),
  /** Mapping of logical filter keys to catalog attributes */
  filterMappings: zod_1.z.record(zod_1.z.string()),
  /** Optional price overrides per locale (minor units) */
  priceOverrides: zod_1.z
    .record(Product_1.localeSchema, zod_1.z.number())
    .default({}),
  /** Optional redirect overrides for locale detection */
  localeOverrides: zod_1.z
    .record(zod_1.z.string(), Product_1.localeSchema)
    .default({}),
  homeTitle: zod_1.z
    .record(Product_1.localeSchema, zod_1.z.string())
    .optional(),
  homeDescription: zod_1.z
    .record(Product_1.localeSchema, zod_1.z.string())
    .optional(),
  homeImage: zod_1.z.string().optional(),
});
