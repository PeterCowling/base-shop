import "@acme/zod-utils/initZod";
import { z } from "zod";

export const cmsEnvSchema = z.object({
  CMS_SPACE_URL: z.string().url().default("https://cms.example.com"),
  CMS_ACCESS_TOKEN: z.string().default("cms-access-token"),
  SANITY_API_VERSION: z.string().default("2023-01-01"),
});

const parsed = cmsEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.warn(
    "⚠️ Invalid CMS environment variables:",
    parsed.error.format(),
  );
}

export const cmsEnv = parsed.success ? parsed.data : cmsEnvSchema.parse({});
export type CmsEnv = z.infer<typeof cmsEnvSchema>;
