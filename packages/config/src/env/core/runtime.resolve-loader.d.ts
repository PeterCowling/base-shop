import type { CoreEnv } from "./schema.core.js";

export type LoadCoreEnvFn = (raw?: NodeJS.ProcessEnv) => CoreEnv;
export declare function resolveLoadCoreEnvFn(): LoadCoreEnvFn;
