 
import { IS_TEST } from "@/config/env";

const isTestMode = IS_TEST;

export function logStructuredToc(...args: unknown[]): void {
  if (isTestMode) return;
  try {
    console.log(...args);
  } catch {
    /* noop: some runtimes may not expose console */
  }
}
