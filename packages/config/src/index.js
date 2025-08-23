// packages/config/src/index.ts
// Re-export compiled env in a stable, root entry for all consumers.
import { coreEnv } from "./env/core";
export const env = coreEnv;
