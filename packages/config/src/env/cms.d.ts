import "@acme/zod-utils/initZod";
import { z } from "zod";
export declare const cmsEnvSchema: z.ZodObject<{
    CMS_SPACE_URL: z.ZodOptional<z.ZodString>;
    CMS_ACCESS_TOKEN: z.ZodOptional<z.ZodString>;
    SANITY_API_VERSION: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    CMS_SPACE_URL?: string | undefined;
    CMS_ACCESS_TOKEN?: string | undefined;
    SANITY_API_VERSION?: string | undefined;
}, {
    CMS_SPACE_URL?: string | undefined;
    CMS_ACCESS_TOKEN?: string | undefined;
    SANITY_API_VERSION?: string | undefined;
}>;
export declare const cmsEnv: {
    CMS_SPACE_URL?: string | undefined;
    CMS_ACCESS_TOKEN?: string | undefined;
    SANITY_API_VERSION?: string | undefined;
};
export type CmsEnv = z.infer<typeof cmsEnvSchema>;
