import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface SocialFeedComponent extends PageComponentBase {
  type: "SocialFeed";
  platform?: "twitter" | "instagram";
  account?: string;
  hashtag?: string;
}

export const socialFeedComponentSchema = baseComponentSchema.extend({
  type: z.literal("SocialFeed"),
  platform: z.enum(["twitter", "instagram"]).optional(),
  account: z.string().optional(),
  hashtag: z.string().optional(),
});

