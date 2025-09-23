// Root mock for @acme/config package
// Provide a minimal API surface compatible with consumers that import
// `@acme/config` and expect `{ env }` and `Env` types.
export { coreEnv as env, coreEnvSchema, loadCoreEnv } from "./config-env-core";
export type { TestCoreEnv as Env } from "./config-env-core";

