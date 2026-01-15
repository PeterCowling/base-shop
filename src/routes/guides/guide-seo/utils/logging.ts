/* eslint-disable no-console -- DEBUG output should be gated by the helper below. */

const isTestMode = (() => {
  if (typeof import.meta !== "object" || typeof import.meta.env !== "object") {
    return false;
  }
  return import.meta.env.MODE === "test";
})();

export function logStructuredToc(...args: unknown[]): void {
  if (isTestMode) return;
  try {
    console.log(...args);
  } catch {
    /* noop: some runtimes may not expose console */
  }
}