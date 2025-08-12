import { z } from "zod";

export const mediaItemSchema = z.object({
  url: z.string(),
  type: z.enum(["image", "video"]).optional(),
  title: z.string().optional(),
  altText: z.string().optional(),
});

export type MediaItem = z.infer<typeof mediaItemSchema>;
