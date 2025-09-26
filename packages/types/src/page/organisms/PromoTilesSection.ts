import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";

export interface PromoTilesSectionComponent extends PageComponentBase {
  type: "PromoTilesSection";
  density?: "editorial" | "utilitarian";
  tiles?: Array<{
    imageSrc?: string;
    imageAlt?: string;
    caption?: string;
    ctaLabel?: string;
    ctaHref?: string;
    badge?: "rental" | "buy";
  }>;
}

export const promoTilesSectionComponentSchema = baseComponentSchema.extend({
  type: z.literal("PromoTilesSection"),
  density: z.enum(["editorial", "utilitarian"]).optional(),
  tiles: z
    .array(
      z
        .object({
          imageSrc: z.string().optional(),
          imageAlt: z.string().optional(),
          caption: z.string().optional(),
          ctaLabel: z.string().optional(),
          ctaHref: z.string().optional(),
          badge: z.enum(["rental", "buy"]).optional(),
        })
        .strict()
    )
    .optional(),
});

