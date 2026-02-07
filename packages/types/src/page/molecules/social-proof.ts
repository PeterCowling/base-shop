import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface SocialProofComponent extends PageComponentBase {
  type: "SocialProof";
  source?: string;
  frequency?: number;
  ugc?: { src: string; alt?: string; author?: string; handle?: string; href?: string }[];
  influencers?: { name: string; handle?: string; avatarSrc?: string; href?: string; quote?: string }[];
  logos?: { src: string; alt?: string; href?: string }[];
  emitOrgSchema?: boolean;
  orgName?: string;
  orgSameAs?: string[];
}

export const socialProofComponentSchema = baseComponentSchema.extend({
  type: z.literal("SocialProof"),
  source: z.string().optional(),
  frequency: z.number().optional(),
  ugc: z.array(z.object({ src: z.string(), alt: z.string().optional(), author: z.string().optional(), handle: z.string().optional(), href: z.string().optional() })).optional(),
  influencers: z.array(z.object({ name: z.string(), handle: z.string().optional(), avatarSrc: z.string().optional(), href: z.string().optional(), quote: z.string().optional() })).optional(),
  logos: z.array(z.object({ src: z.string(), alt: z.string().optional(), href: z.string().optional() })).optional(),
  emitOrgSchema: z.boolean().optional(),
  orgName: z.string().optional(),
  orgSameAs: z.array(z.string()).optional(),
});
