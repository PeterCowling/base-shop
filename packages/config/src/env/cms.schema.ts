import "@acme/zod-utils/initZod";
import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";

const boolish = z.preprocess((val) => {
  if (typeof val === "boolean") {
    return val;
  }

  if (typeof val === "string") {
    const normalized = val.trim();
    if (normalized === "") return false;
    if (/^(true|1)$/i.test(normalized)) return true;
    if (/^(false|0)$/i.test(normalized)) return false;
    return val;
  }

  if (typeof val === "number") {
    if (val === 1) return true;
    if (val === 0) return false;
    return val;
  }

  return val;
}, z.boolean());

export const cmsEnvSchema = z.object({
  CMS_SPACE_URL: isProd
    ? z.string().url()
    : z.string().url().default("https://cms.example.com"),
  CMS_ACCESS_TOKEN: isProd
    ? z.string().min(1)
    : z.string().min(1).default("placeholder-token"),
  SANITY_API_VERSION: isProd
    ? z.string().min(1)
    : z.string().min(1).default("2021-10-21"),
  SANITY_PROJECT_ID: isProd
    ? z.string().min(1)
    : z.string().min(1).default("dummy-project-id"),
  SANITY_DATASET: isProd
    ? z.string().min(1)
    : z.string().min(1).default("production"),
  SANITY_API_TOKEN: isProd
    ? z.string().min(1)
    : z.string().min(1).default("dummy-api-token"),
  SANITY_PREVIEW_SECRET: isProd
    ? z.string().min(1)
    : z.string().min(1).default("dummy-preview-secret"),
  SANITY_BASE_URL: z
    .string()
    .url()
    .transform((url) => url.replace(/\/$/, ""))
    .optional(),
  CMS_BASE_URL: z
    .string()
    .url()
    .transform((url) => url.replace(/\/$/, ""))
    .optional(),
  CMS_PAGINATION_LIMIT: z.coerce.number().default(100),
  CMS_DRAFTS_ENABLED: boolish.default(false),
  CMS_DRAFTS_DISABLED_PATHS: z
    .string()
    .default("")
    .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)),
  CMS_SEARCH_ENABLED: boolish.default(false),
  CMS_SEARCH_DISABLED_PATHS: z
    .string()
    .default("")
    .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)),
});

export type CmsEnv = z.infer<typeof cmsEnvSchema>;
