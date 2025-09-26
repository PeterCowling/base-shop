import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";

export interface CampaignHeroSectionComponent extends PageComponentBase {
  type: "CampaignHeroSection";
  mediaType?: "image" | "video";
  imageSrc?: string;
  imageAlt?: string;
  videoSrc?: string;
  videoPoster?: string;
  usps?: string[];
  hotspots?: { sku?: string; x: number; y: number }[];
  countdownTarget?: string;
  timezone?: string;
  onExpire?: "hide" | "swap";
  swapSectionId?: string;
  experimentKey?: string;
}

export const campaignHeroSectionComponentSchema = baseComponentSchema.extend({
  type: z.literal("CampaignHeroSection"),
  mediaType: z.enum(["image", "video"]).optional(),
  imageSrc: z.string().optional(),
  imageAlt: z.string().optional(),
  videoSrc: z.string().optional(),
  videoPoster: z.string().optional(),
  usps: z.array(z.string()).optional(),
  hotspots: z.array(z.object({ sku: z.string().optional(), x: z.number(), y: z.number() })).optional(),
  countdownTarget: z.string().optional(),
  timezone: z.string().optional(),
  onExpire: z.enum(["hide", "swap"]).optional(),
  swapSectionId: z.string().optional(),
  experimentKey: z.string().optional(),
});

