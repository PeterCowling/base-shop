import { useCallback } from "react";
import { validateSectionRules } from "@acme/platform-core/validation/sectionRules";
import type { SectionTemplate } from "@acme/types/section/template";
import type { PageComponent } from "@acme/types";

type ToastState = { open: boolean; message: string; retry?: () => void };

interface UsePublishWithValidationOptions {
  components: PageComponent[];
  handlePublish: () => Promise<void>;
  setToast: (updater: ToastState | ((current: ToastState) => ToastState)) => void;
}

/**
 * Wraps publish with validation guardrails (e.g., hero limit, image width hints).
 * Single purpose: validate current components and publish if ok.
 */
export default function usePublishWithValidation({
  components,
  handlePublish,
  setToast,
}: UsePublishWithValidationOptions) {
  return useCallback(async () => {
    try {
      const sections: SectionTemplate[] = (components || [])
        .filter((c: any) => (c as any)?.type === "Section")
        .map((c: any, idx: number) => ({
          id: `local-${idx}`,
          label: (c as any)?.label || `Section ${idx + 1}`,
          status: "draft",
          template: c,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "editor",
        }));

      const result = validateSectionRules(sections);
      if ((result as any).ok === false) {
        const msg = (result as any).errors?.join("\n") || "Validation failed";
        setToast({ open: true, message: msg });
        return;
      }
    } catch {
      // non-blocking: proceed to publish if validation throws unexpectedly
    }
    await handlePublish();
  }, [components, handlePublish, setToast]);
}

