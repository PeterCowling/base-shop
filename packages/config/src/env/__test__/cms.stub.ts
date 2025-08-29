import { z } from "zod";

export const cmsEnvSchema = z.object({
  CMS_SPACE_URL: z.string().url(),
  CMS_ACCESS_TOKEN: z.string(),
  SANITY_API_VERSION: z.string(),
});

const defaults = {
  CMS_SPACE_URL: "https://cms.example.com",
  CMS_ACCESS_TOKEN: "test-token",
  SANITY_API_VERSION: "2021-10-21",
} as const;

export const cmsEnv = cmsEnvSchema.parse(defaults);
export type CmsEnv = typeof cmsEnv;
