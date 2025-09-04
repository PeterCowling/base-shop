import { z } from "zod";

export const cmsEnvSchema = z.object({
  CMS_SPACE_URL: z.string().url(),
  CMS_ACCESS_TOKEN: z.string(),
  SANITY_API_VERSION: z.string(),
  CMS_BASE_URL: z.string().url(),
  CMS_PAGINATION_LIMIT: z.number(),
  CMS_DRAFTS_ENABLED: z.boolean(),
  CMS_DRAFTS_DISABLED_PATHS: z.array(z.string()),
  CMS_SEARCH_ENABLED: z.boolean(),
  CMS_SEARCH_DISABLED_PATHS: z.array(z.string()),
});

const defaults = {
  CMS_SPACE_URL: "https://cms.example.com",
  CMS_ACCESS_TOKEN: "test-token",
  SANITY_API_VERSION: "2021-10-21",
  CMS_BASE_URL: "https://cms.example.com",
  CMS_PAGINATION_LIMIT: 100,
  CMS_DRAFTS_ENABLED: false,
  CMS_DRAFTS_DISABLED_PATHS: [],
  CMS_SEARCH_ENABLED: false,
  CMS_SEARCH_DISABLED_PATHS: [],
} as const;

export const cmsEnv = cmsEnvSchema.parse(defaults);
export type CmsEnv = typeof cmsEnv;
