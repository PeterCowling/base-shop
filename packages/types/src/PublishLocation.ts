import { z } from "zod";

import { imageOrientationSchema } from "./ImageOrientation";
/**
 * Definition of a publish-to location within the shop-front.
 */
export const publishLocationSchema = z
  .object({
    /** Unique, stable identifier (e.g. slug or UUID). */
    id: z.string(),

    /** Human-readable name shown to content editors. */
    name: z.string(),

    /** Optional richer description for tooltips or secondary text. */
    description: z.string().optional(),

    /** Hierarchical path (e.g. "homepage/hero", "product/:id/upsell"). */
    path: z.string(),

    /** Required orientation for images displayed at this location. */
    requiredOrientation: imageOrientationSchema,
  })
  .strict();

export type PublishLocation = z.infer<typeof publishLocationSchema>;
