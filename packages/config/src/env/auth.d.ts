import "@acme/zod-utils/initZod";
import { z } from "zod";
export declare const authEnvSchema: z.ZodObject<{
    NEXTAUTH_SECRET: z.ZodString | z.ZodDefault<z.ZodString>;
    PREVIEW_TOKEN_SECRET: z.ZodOptional<z.ZodString>;
    UPGRADE_PREVIEW_TOKEN_SECRET: z.ZodOptional<z.ZodString>;
    SESSION_SECRET: z.ZodString | z.ZodDefault<z.ZodString>;
    COOKIE_DOMAIN: z.ZodOptional<z.ZodString>;
    LOGIN_RATE_LIMIT_REDIS_URL: z.ZodOptional<z.ZodString>;
    LOGIN_RATE_LIMIT_REDIS_TOKEN: z.ZodOptional<z.ZodString>;
    SESSION_STORE: z.ZodOptional<z.ZodEnum<["memory", "redis"]>>;
    UPSTASH_REDIS_REST_URL: z.ZodOptional<z.ZodString>;
    UPSTASH_REDIS_REST_TOKEN: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    NEXTAUTH_SECRET: string;
    SESSION_SECRET: string;
    PREVIEW_TOKEN_SECRET?: string | undefined;
    UPGRADE_PREVIEW_TOKEN_SECRET?: string | undefined;
    COOKIE_DOMAIN?: string | undefined;
    LOGIN_RATE_LIMIT_REDIS_URL?: string | undefined;
    LOGIN_RATE_LIMIT_REDIS_TOKEN?: string | undefined;
    SESSION_STORE?: "memory" | "redis" | undefined;
    UPSTASH_REDIS_REST_URL?: string | undefined;
    UPSTASH_REDIS_REST_TOKEN?: string | undefined;
}, {
    NEXTAUTH_SECRET?: string | undefined;
    PREVIEW_TOKEN_SECRET?: string | undefined;
    UPGRADE_PREVIEW_TOKEN_SECRET?: string | undefined;
    SESSION_SECRET?: string | undefined;
    COOKIE_DOMAIN?: string | undefined;
    LOGIN_RATE_LIMIT_REDIS_URL?: string | undefined;
    LOGIN_RATE_LIMIT_REDIS_TOKEN?: string | undefined;
    SESSION_STORE?: "memory" | "redis" | undefined;
    UPSTASH_REDIS_REST_URL?: string | undefined;
    UPSTASH_REDIS_REST_TOKEN?: string | undefined;
}>;
export declare const authEnv: {
    NEXTAUTH_SECRET: string;
    SESSION_SECRET: string;
    PREVIEW_TOKEN_SECRET?: string | undefined;
    UPGRADE_PREVIEW_TOKEN_SECRET?: string | undefined;
    COOKIE_DOMAIN?: string | undefined;
    LOGIN_RATE_LIMIT_REDIS_URL?: string | undefined;
    LOGIN_RATE_LIMIT_REDIS_TOKEN?: string | undefined;
    SESSION_STORE?: "memory" | "redis" | undefined;
    UPSTASH_REDIS_REST_URL?: string | undefined;
    UPSTASH_REDIS_REST_TOKEN?: string | undefined;
};
export type AuthEnv = z.infer<typeof authEnvSchema>;
//# sourceMappingURL=auth.d.ts.map