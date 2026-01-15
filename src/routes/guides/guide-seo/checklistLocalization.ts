// src/routes/guides/guide-seo/checklistLocalization.ts
import {
  checklistNote,
  type ChecklistSnapshot,
  type ChecklistStatus,
} from "../guide-manifest";

const ACTIVE_LOCALE_FALLBACK_NOTE = checklistNote("active-locale-fallback");

export function applyLocaleAwareTranslationChecklist(
  snapshot: ChecklistSnapshot,
  hasLocalizedContent: boolean,
): ChecklistSnapshot {
  let mutated = false;

  const items = snapshot.items.map((item) => {
    if (item.id !== "translations") {
      return item;
    }

    const nextStatus: ChecklistStatus = hasLocalizedContent
      ? "complete"
      : item.status === "complete"
        ? "inProgress"
        : item.status;
    const nextNote = hasLocalizedContent ? item.note : item.note ?? ACTIVE_LOCALE_FALLBACK_NOTE;
    if (nextStatus === item.status && nextNote === item.note) {
      return item;
    }
    mutated = true;
    return {
      ...item,
      status: nextStatus,
      note: nextNote,
    };
  });

  if (!mutated) {
    return snapshot;
  }

  return {
    ...snapshot,
    items,
  };
}
