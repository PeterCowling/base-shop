// packages/config/src/env/core.ts
import "@acme/zod-utils/initZod";
// Side-effect modules to keep behavior parity.
import "./core/runtime.prod-failfast.js";
import "./core/runtime.test-auth-init.js";

export { loadCoreEnv } from "./core/loader.parse.js";
export { depositReleaseEnvRefinement } from "./core/refinement.deposit.js";
export { requireEnv } from "./core/require-env.js";
export { coreEnv } from "./core/runtime.proxy.js";
export { coreEnvBaseSchema } from "./core/schema.base-merge.js";
export type { CoreEnv } from "./core/schema.core.js";
export { coreEnvSchema } from "./core/schema.core.js";
