import { z } from "zod";

import type { Lane, Priority } from "@/lib/types";

type Translator = (
  key: string,
  vars?: Record<string, string | number>
) => string;

function buildCardEditorSchema(t: Translator) {
  return z.object({
    business: z.string().min(1, t("businessOs.forms.businessRequired")),
    title: z
      .string()
      .min(1, t("businessOs.forms.titleRequired"))
      .max(200, t("businessOs.forms.titleTooLong")),
    description: z.string().min(1, t("businessOs.forms.descriptionRequired")),
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
    owner: z.string().min(1, t("businessOs.forms.ownerRequired")),
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
}

export type CardEditorFormData = z.infer<ReturnType<typeof buildCardEditorSchema>>;

export function createCardEditorSchema(t: Translator) {
  return buildCardEditorSchema(t);
}

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
