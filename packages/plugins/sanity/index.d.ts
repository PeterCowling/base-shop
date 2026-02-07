import { type Mutation } from "@sanity/client";
import { z } from "zod";

import type { Plugin } from "@acme/types";

export declare const configSchema: z.ZodObject<{
    projectId: z.ZodString;
    dataset: z.ZodString;
    token: z.ZodString;
}, "strict", z.ZodTypeAny, {
    projectId: string;
    dataset: string;
    token: string;
}, {
    projectId: string;
    dataset: string;
    token: string;
}>;
export type SanityConfig = z.infer<typeof configSchema>;
export declare const defaultConfig: SanityConfig;
export declare function verifyCredentials(config: SanityConfig): Promise<boolean>;
export declare function publishPost(config: SanityConfig, post: Record<string, unknown>): Promise<import("@sanity/client").SanityDocument<Record<string, any>>>;
export declare function query<T>(config: SanityConfig, q: string): Promise<T>;
interface MutateBody {
    mutations: Mutation<Record<string, any>>[];
    returnIds?: boolean;
}
export declare function mutate(config: SanityConfig, body: MutateBody): Promise<import("@sanity/client").SanityDocument<Record<string, any>>>;
export declare function slugExists(config: SanityConfig, slug: string, excludeId?: string): Promise<boolean>;
declare const sanityPlugin: Plugin<SanityConfig>;
export default sanityPlugin;
//# sourceMappingURL=index.d.ts.map