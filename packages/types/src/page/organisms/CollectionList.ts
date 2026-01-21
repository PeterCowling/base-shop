import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface CollectionListComponent extends PageComponentBase {
  type: "CollectionList";
  collections?: { id: string; title: string; image: string }[];
  desktopItems?: number;
  tabletItems?: number;
  mobileItems?: number;
}

export const collectionListComponentSchema = baseComponentSchema.extend({
  type: z.literal("CollectionList"),
  collections: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        image: z.string(),
      })
    )
    .optional(),
  desktopItems: z.number().optional(),
  tabletItems: z.number().optional(),
  mobileItems: z.number().optional(),
});

