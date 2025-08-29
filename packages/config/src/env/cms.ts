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
