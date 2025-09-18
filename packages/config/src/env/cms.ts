import { cmsEnvSchema, type CmsEnv } from "./cms.schema.js";

const parsed = cmsEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "❌ Invalid CMS environment variables:",
    parsed.error.format(),
  );
  throw new Error("Invalid CMS environment variables");
}

export const cmsEnv: CmsEnv = parsed.data;
export { cmsEnvSchema };
export type { CmsEnv };
