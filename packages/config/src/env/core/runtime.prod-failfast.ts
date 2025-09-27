import { isProd } from "./constants.js";
import { coreEnv } from "./runtime.proxy.js";

// Fail fast in prod only (forces a single parse early).
if (isProd) {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- ENG-1234 eager-parse in prod to fail fast
  coreEnv.NODE_ENV;
}
