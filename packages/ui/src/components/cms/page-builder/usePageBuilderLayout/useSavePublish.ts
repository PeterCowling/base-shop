// i18n-exempt -- Next.js directive literal (not user-facing copy)
"use client";
import usePageBuilderSave from "../hooks/usePageBuilderSave";
import usePublishWithValidation from "../hooks/usePublishWithValidation";
import useKeyboardShortcuts from "../hooks/useKeyboardShortcuts";
import { useToastState } from "../hooks/useToastState";
import type { PageComponent, HistoryState } from "@acme/types";
import type { PageBuilderProps } from "../PageBuilder.types";

interface SavePublishInput {
  page: PageBuilderProps["page"];
  components: PageComponent[];
  state: HistoryState;
  onSave?: PageBuilderProps["onSave"];
  onPublish?: PageBuilderProps["onPublish"];
  shop?: string | null;
  clearHistory: () => void;
  t: (key: string) => string;
  rotateDevice: (direction: "left" | "right") => void;
  togglePreview: () => void;
}

export default function useSavePublish({
  page,
  components,
  state,
  onSave,
  onPublish,
  shop,
  clearHistory,
  t,
  rotateDevice,
  togglePreview,
}: SavePublishInput) {
  const { setToast, toastProps } = useToastState();

  const safeOnSave = onSave ?? (async () => ({}));
  const safeOnPublish = onPublish ?? (async () => ({}));

  const { handlePublish, handleSave, autoSaveState } = usePageBuilderSave({
    page,
    components,
    state,
    onSave: safeOnSave,
    onPublish: safeOnPublish,
    formDataDeps: [components, state],
    shop,
    onAutoSaveError: (retry) => {
      setToast({
        open: true,
        message: t("Auto-save failed. Click to retry."),
        retry: () => {
          setToast((current) => ({ ...current, open: false }));
          retry();
        },
      });
    },
    clearHistory,
  });

  const publishWithValidation = usePublishWithValidation({
    components,
    handlePublish,
    setToast,
  });

  useKeyboardShortcuts({
    onPublish: () => publishWithValidation(),
    rotateDevice,
    togglePreview,
  });

  return { handleSave, publishWithValidation, autoSaveState, toastProps, setToast } as const;
}
