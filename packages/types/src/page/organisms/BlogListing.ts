import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface BlogListingComponent extends PageComponentBase {
  type: "BlogListing";
  posts?: { title: string; excerpt?: string; url?: string; shopUrl?: string }[];
}

export const blogListingComponentSchema = baseComponentSchema.extend({
  type: z.literal("BlogListing"),
  posts: z
    .array(
      z.object({
        title: z.string(),
        excerpt: z.string().optional(),
        url: z.string().optional(),
        shopUrl: z.string().optional(),
      })
    )
    .optional(),
});

