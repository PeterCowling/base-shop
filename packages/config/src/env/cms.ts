import "@acme/zod-utils/initZod";
import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";

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
    : z.string().min(1).default("test-project"),
  SANITY_DATASET: z.string().min(1).default("production"),
  SANITY_API_TOKEN: z.string().min(1).optional(),
  SANITY_PREVIEW_SECRET: z.string().min(1).optional(),
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
  CMS_DRAFTS_ENABLED: z.coerce.boolean().default(false),
  CMS_DRAFTS_DISABLED_PATHS: z
    .string()
    .default("")
    .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)),
  CMS_SEARCH_ENABLED: z.coerce.boolean().default(false),
  CMS_SEARCH_DISABLED_PATHS: z
    .string()
    .default("")
    .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)),
});

const parsed = cmsEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "❌ Invalid CMS environment variables:",
    parsed.error.format(),
  );
  throw new Error("Invalid CMS environment variables");
}

export const cmsEnv = parsed.data;
export type CmsEnv = z.infer<typeof cmsEnvSchema>;
