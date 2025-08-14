import { z } from "zod";
import { PageComponentBase, baseComponentSchema } from "./base";

export interface BlogListingComponent extends PageComponentBase {
  type: "BlogListing";
  posts?: { title: string; excerpt?: string; url?: string }[];
}

export const blogListingComponentSchema = baseComponentSchema.extend({
  type: z.literal("BlogListing"),
  posts: z
    .array(
      z.object({
        title: z.string(),
        excerpt: z.string().optional(),
        url: z.string().optional(),
      })
    )
    .optional(),
});
