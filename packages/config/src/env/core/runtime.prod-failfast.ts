import { isProd } from "./constants.js";
import { coreEnv } from "./runtime.proxy.js";

// Fail fast in prod only (forces a single parse early).
if (isProd) {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  coreEnv.NODE_ENV;
}
