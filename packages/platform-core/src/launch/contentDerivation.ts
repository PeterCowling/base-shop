import { derivePages } from "./derivation";
import type { DeriveContentInput, DeriveContentOutput } from "./types";

export function deriveContent(input: DeriveContentInput): DeriveContentOutput {
  const start = Date.now();
  const { pages, navigation } = derivePages(input);
  const warningCount = pages.reduce((sum, page) => sum + page.warnings.length, 0);

  return {
    pages,
    navigation,
    derivationDurationMs: Date.now() - start,
    warningCount,
  };
}
