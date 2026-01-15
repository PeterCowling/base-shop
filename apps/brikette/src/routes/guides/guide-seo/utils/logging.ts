 
import { IS_DEV, IS_TEST } from "@/config/env";

const isTestMode = IS_TEST;

export function logStructuredToc(...args: unknown[]): void {
  if (isTestMode || !IS_DEV) return;
  try {
    console.info(...args);
  } catch {
    /* noop: some runtimes may not expose console */
  }
}
