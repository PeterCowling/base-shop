import { snapshotForCoreEnv } from "./env.snapshot.js";
import { resolveLoadCoreEnvFn } from "./runtime.resolve-loader.js";
import type { CoreEnv } from "./schema.core.js";

let __cachedCoreEnv: CoreEnv | null = null;

function getCoreEnv(): CoreEnv {
  if (!__cachedCoreEnv) {
    const loader = resolveLoadCoreEnvFn();
    __cachedCoreEnv = loader(snapshotForCoreEnv());
  }
  return __cachedCoreEnv;
}

export const coreEnv: CoreEnv = new Proxy({} as CoreEnv, {
  get: (_t, prop: string) => {
    return getCoreEnv()[prop as keyof CoreEnv];
  },
  has: (_t, prop: string) => {
    return prop in getCoreEnv();
  },
  ownKeys: () => {
    return Reflect.ownKeys(getCoreEnv());
  },
  getOwnPropertyDescriptor: (_t, prop: string | symbol) => {
    return Object.getOwnPropertyDescriptor(getCoreEnv(), prop);
  },
}) as CoreEnv;
