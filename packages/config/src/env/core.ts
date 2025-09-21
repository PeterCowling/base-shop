// packages/config/src/env/core.ts
import "@acme/zod-utils/initZod";

export { requireEnv } from "./core/require-env.js";
export { coreEnvBaseSchema } from "./core/schema.base-merge.js";
export { depositReleaseEnvRefinement } from "./core/refinement.deposit.js";
export { coreEnvSchema } from "./core/schema.core.js";
export type { CoreEnv } from "./core/schema.core.js";
export { loadCoreEnv } from "./core/loader.parse.js";
export { coreEnv } from "./core/runtime.proxy.js";

// Side-effect modules to keep behavior parity.
import "./core/runtime.prod-failfast.js";
import "./core/runtime.test-auth-init.js";
