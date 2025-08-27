// packages/config/src/index.ts
// Re-export compiled env in a stable, root entry for all consumers.
// Explicit `.js` extension required for NodeNext module resolution
// so that generated JavaScript has proper relative paths.
import { coreEnv } from "./env/core.js";

export const env = coreEnv;
export type { CoreEnv as Env } from "./env/core.js";
