"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishLocationSchema = void 0;
var zod_1 = require("zod");
var ImageOrientation_1 = require("./ImageOrientation");
/**
 * Definition of a publish-to location within the shop-front.
 */
exports.publishLocationSchema = zod_1.z.object({
    /** Unique, stable identifier (e.g. slug or UUID). */
    id: zod_1.z.string(),
    /** Human-readable name shown to content editors. */
    name: zod_1.z.string(),
    /** Optional richer description for tooltips or secondary text. */
    description: zod_1.z.string().optional(),
    /** Hierarchical path (e.g. "homepage/hero", "product/:id/upsell"). */
    path: zod_1.z.string(),
    /** Required orientation for images displayed at this location. */
    requiredOrientation: ImageOrientation_1.imageOrientationSchema,
});
