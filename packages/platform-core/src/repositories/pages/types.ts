import type { Page } from "@acme/types";

export interface PageDiffEntry {
  timestamp: string;
  diff: Partial<Page>;
}
