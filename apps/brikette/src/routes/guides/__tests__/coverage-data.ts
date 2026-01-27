import type { GuideMeta } from "@/data/guides.index";
import type { TagSummary } from "@/data/tags.index";

export const createMockGuidesIndex = (): GuideMeta[] => [
  // Updated to use GuideNamespaceKey values (TASK-03)
  { key: "naplesPositano", section: "howToGetHere", tags: ["transport", "ferry"] },
  { key: "reachBudget", section: "assistance", tags: ["transport", "budgeting"] },
  { key: "ferrySchedules", section: "assistance", tags: ["transport", "ferry"] },
  { key: "sunsetViewpoints", section: "experiences", tags: ["photography", "viewpoints"] },
];

export const createMockTagsSummary = (): TagSummary[] => [
  { tag: "photography", count: 1 },
  { tag: "transport", count: 3 },
  { tag: "viewpoints", count: 1 },
];