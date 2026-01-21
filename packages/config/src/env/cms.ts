import { type CmsEnv,cmsEnvSchema } from "./cms.schema.js";

const parsed = cmsEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "❌ Invalid CMS environment variables:", // i18n-exempt: developer log
    parsed.error.format(),
  ); // i18n-exempt: developer log
  throw new Error("Invalid CMS environment variables"); // i18n-exempt: developer error
}

export const cmsEnv: CmsEnv = parsed.data;
export { cmsEnvSchema };
export type { CmsEnv };
