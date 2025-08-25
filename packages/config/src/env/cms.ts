import "@acme/zod-utils/initZod";
import { z } from "zod";

export const cmsEnvSchema = z.object({
  CMS_SPACE_URL: z.string().url().optional(),
  CMS_ACCESS_TOKEN: z.string().optional(),
  SANITY_API_VERSION: z.string().optional(),
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
