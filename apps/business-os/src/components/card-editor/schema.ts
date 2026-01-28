import { z } from "zod";

import type { Lane, Priority } from "@/lib/types";

/**
 * Form schema for creating/editing cards
 * Phase 0: Pete-only card management
 */
export const cardEditorSchema = z.object({
  business: z.string().min(1, "Please select a business"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(1, "Description is required"),
  lane: z.enum([
    "Inbox",
    "Fact-finding",
    "Planned",
    "In progress",
    "Blocked",
    "Done",
    "Reflected",
  ] as const),
  priority: z.enum(["P0", "P1", "P2", "P3", "P4", "P5"] as const),
  owner: z.string().min(1, "Owner is required"),
  proposedLane: z
    .enum([
      "",
      "Inbox",
      "Fact-finding",
      "Planned",
      "In progress",
      "Blocked",
      "Done",
      "Reflected",
    ] as const)
    .optional(),
  tags: z.string().optional(),
  dueDate: z.string().optional(),
});

export type CardEditorFormData = z.infer<typeof cardEditorSchema>;

// Helper to convert form data to API payload
export function formDataToApiPayload(data: CardEditorFormData) {
  const tags = data.tags
    ?.split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  // Filter out empty string for proposedLane
  const proposedLane =
    data.proposedLane && data.proposedLane.length > 0
      ? (data.proposedLane as Lane)
      : undefined;

  return {
    business: data.business,
    title: data.title,
    description: data.description,
    lane: data.lane as Lane,
    priority: data.priority as Priority,
    owner: data.owner,
    proposedLane,
    tags,
    dueDate: data.dueDate || undefined,
  };
}
