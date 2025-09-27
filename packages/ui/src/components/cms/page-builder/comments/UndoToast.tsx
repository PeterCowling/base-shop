"use client";

import type { Thread } from "./types";
import { Toast } from "../../../atoms";
import { useTranslations } from "@acme/i18n";

export function UndoToast({ lastDeleted, onRestore, onDismiss }: {
  lastDeleted: Thread | null;
  onRestore: () => void | Promise<void>;
  onDismiss: () => void;
}) {
  const t = useTranslations();
  if (!lastDeleted) return null;
  return (
    <Toast
      open={!!lastDeleted}
      onClose={onDismiss}
      onClick={() => void onRestore()}
      message={t("comments.threadDeletedTapToUndo") as string}
    />
  );
}

export default UndoToast;
