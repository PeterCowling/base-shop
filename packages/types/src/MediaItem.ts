import { z } from "zod";

export type MediaType = "image" | "video" | "360" | "model";

export const mediaItemSchema = z.object({
  url: z.string(),
  type: z.enum(["image", "video", "360", "model"]).optional(),
  title: z.string().optional(),
  altText: z.string().optional(),
  thumbnail: z.string().optional(),
  frames: z.array(z.string()).optional(),
});

export type MediaItem = z.infer<typeof mediaItemSchema>;
