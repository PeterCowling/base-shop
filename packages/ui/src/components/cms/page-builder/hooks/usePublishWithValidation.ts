import { useCallback } from "react";
import { useTranslations } from "@acme/i18n";
import { validateSectionRules } from "@acme/platform-core/validation/sectionRules";
import type { ValidationResult } from "@acme/platform-core/validation/sectionRules";
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
  const t = useTranslations();
  return useCallback(async () => {
    try {
      const sections: SectionTemplate[] = (components || [])
        .filter((c: PageComponent) => c.type === "Section")
        .map((c: PageComponent, idx: number) => ({
          id: `local-${idx}`,
          label: (c as { label?: string }).label || `Section ${idx + 1}`, // i18n-exempt: fallback for developer label
          status: "draft",
          template: c,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "editor",
        }));

      const result: ValidationResult = validateSectionRules(sections);
      if (result.ok === false) {
        const msg = result.errors?.join("\n") || (t("cms.builder.validation.failed") as string);
        setToast({ open: true, message: msg });
        return;
      }
    } catch {
      // non-blocking: proceed to publish if validation throws unexpectedly
    }
    await handlePublish();
  }, [components, handlePublish, setToast, t]);
}
