import { describe, expect, it } from "vitest";

import { applyLocaleAwareTranslationChecklist } from "./checklistLocalization";
import { checklistNote, type ChecklistSnapshot } from "../guide-manifest";

const baseSnapshot: ChecklistSnapshot = {
  status: "draft",
  items: [
    { id: "translations", status: "missing" },
    { id: "content", status: "inProgress" },
  ],
};

describe("applyLocaleAwareTranslationChecklist", () => {
  it("keeps manifest values when no changes are required", () => {
    const result = applyLocaleAwareTranslationChecklist(baseSnapshot, false);
    expect(result).toBe(baseSnapshot);
  });

  it("marks translations complete when localized content exists for the active locale", () => {
    const result = applyLocaleAwareTranslationChecklist(baseSnapshot, true);
    const translationsItem = result.items.find((item) => item.id === "translations");
    expect(translationsItem?.status).toBe("complete");
  });

  it("downgrades translation status when the active locale falls back to English", () => {
    const snapshot: ChecklistSnapshot = {
      status: "draft",
      items: [
        { id: "translations", status: "complete" },
        { id: "jsonLd", status: "complete" },
      ],
    };
    const result = applyLocaleAwareTranslationChecklist(snapshot, false);
    const translationsItem = result.items.find((item) => item.id === "translations");
    expect(translationsItem?.status).toBe("inProgress");
    expect(translationsItem?.note).toBe(checklistNote("active-locale-fallback"));
  });
});
