import "@acme/zod-utils/initZod";

import { z } from "zod";

export declare const cmsEnvSchema: z.ZodObject<{
    CMS_SPACE_URL: z.ZodString | z.ZodDefault<z.ZodString>;
    CMS_ACCESS_TOKEN: z.ZodString | z.ZodDefault<z.ZodString>;
    SANITY_API_VERSION: z.ZodEffects<z.ZodDefault<z.ZodEffects<z.ZodString, string, string>>, string, unknown>;
    SANITY_PROJECT_ID: z.ZodString | z.ZodDefault<z.ZodString>;
    SANITY_DATASET: z.ZodString | z.ZodDefault<z.ZodString>;
    SANITY_API_TOKEN: z.ZodString | z.ZodDefault<z.ZodString>;
    SANITY_PREVIEW_SECRET: z.ZodString | z.ZodDefault<z.ZodString>;
    SANITY_BASE_URL: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    CMS_BASE_URL: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    CMS_PAGINATION_LIMIT: z.ZodDefault<z.ZodNumber>;
    CMS_DRAFTS_ENABLED: z.ZodDefault<z.ZodEffects<z.ZodBoolean, boolean, unknown>>;
    CMS_DRAFTS_DISABLED_PATHS: z.ZodEffects<z.ZodDefault<z.ZodString>, string[], string | undefined>;
    CMS_SEARCH_ENABLED: z.ZodDefault<z.ZodEffects<z.ZodBoolean, boolean, unknown>>;
    CMS_SEARCH_DISABLED_PATHS: z.ZodEffects<z.ZodDefault<z.ZodString>, string[], string | undefined>;
}, "strip", z.ZodTypeAny, {
    CMS_SPACE_URL: string;
    CMS_ACCESS_TOKEN: string;
    SANITY_API_VERSION: string;
    SANITY_PROJECT_ID: string;
    SANITY_DATASET: string;
    SANITY_API_TOKEN: string;
    SANITY_PREVIEW_SECRET: string;
    CMS_PAGINATION_LIMIT: number;
    CMS_DRAFTS_ENABLED: boolean;
    CMS_DRAFTS_DISABLED_PATHS: string[];
    CMS_SEARCH_ENABLED: boolean;
    CMS_SEARCH_DISABLED_PATHS: string[];
    SANITY_BASE_URL?: string | undefined;
    CMS_BASE_URL?: string | undefined;
}, {
    CMS_SPACE_URL?: string | undefined;
    CMS_ACCESS_TOKEN?: string | undefined;
    SANITY_API_VERSION?: unknown;
    SANITY_PROJECT_ID?: string | undefined;
    SANITY_DATASET?: string | undefined;
    SANITY_API_TOKEN?: string | undefined;
    SANITY_PREVIEW_SECRET?: string | undefined;
    SANITY_BASE_URL?: string | undefined;
    CMS_BASE_URL?: string | undefined;
    CMS_PAGINATION_LIMIT?: number | undefined;
    CMS_DRAFTS_ENABLED?: unknown;
    CMS_DRAFTS_DISABLED_PATHS?: string | undefined;
    CMS_SEARCH_ENABLED?: unknown;
    CMS_SEARCH_DISABLED_PATHS?: string | undefined;
}>;
export type CmsEnv = z.infer<typeof cmsEnvSchema>;
