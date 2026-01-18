import "@acme/zod-utils/initZod";
export declare function resolveNodeEnv(raw?: NodeJS.ProcessEnv): string | undefined;
export declare function hasJestContext(raw?: NodeJS.ProcessEnv): boolean;
export declare function shouldUseTestDefaults(raw?: NodeJS.ProcessEnv): boolean;
export declare const isTest: boolean;
export declare const isProd: boolean;
export declare const NON_STRING_ENV_SYMBOL: unique symbol;
export declare const AUTH_TTL_META_SYMBOL: unique symbol;
