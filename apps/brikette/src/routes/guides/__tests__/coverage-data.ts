import type { GuideMeta } from "@/data/guides.index";
import type { TagSummary } from "@/data/tags.index";

export const createMockGuidesIndex = (): GuideMeta[] => [
  { key: "naplesPositano", section: "experiences", tags: ["transport", "ferry"] },
  { key: "reachBudget", section: "help", tags: ["transport", "budgeting"] },
  { key: "ferrySchedules", section: "help", tags: ["transport", "ferry"] },
  { key: "sunsetViewpoints", section: "experiences", tags: ["photography", "viewpoints"] },
];

export const createMockTagsSummary = (): TagSummary[] => [
  { tag: "photography", count: 1 },
  { tag: "transport", count: 3 },
  { tag: "viewpoints", count: 1 },
];