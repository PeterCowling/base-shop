import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useTranslations } from "@acme/i18n";

import type {
  AsyncSubmissionHandler,
  SubmissionStatus,
  ValidationErrors,
} from "../shared";
import type { StepDefinition } from "../shared/StepIndicator";

import {
  defaultSegmentDefinition,
  getSegmentPreview,
  type SegmentDefinition,
  type SegmentPreviewData,
  type SegmentRule,
} from "./types";

type SegmentValidationErrors = ValidationErrors<"name" | "rules">;

interface UseSegmentBuilderWizardOptions {
  initialDefinition?: Partial<SegmentDefinition>;
  onSubmit?: AsyncSubmissionHandler<SegmentDefinition>;
  validationErrors?: SegmentValidationErrors;
  onPreviewChange?: (preview: SegmentPreviewData) => void;
}

interface ToastState {
  open: boolean;
  message: string;
}

export interface UseSegmentBuilderWizardReturn {
  steps: StepDefinition[];
  stepIndex: number;
  currentStep: StepDefinition;
  definition: SegmentDefinition;
  preview: SegmentPreviewData;
  status: SubmissionStatus;
  errors: SegmentValidationErrors;
  goToStep: (index: number) => void;
  updateDefinition: (patch: Partial<SegmentDefinition>) => void;
  updateRule: (ruleId: string, patch: Partial<SegmentRule>) => void;
  addRule: () => void;
  removeRule: (ruleId: string) => void;
  handleDetailsSubmit: (event: FormEvent<HTMLFormElement>) => void;
  handleRulesNext: () => void;
  handleFinish: () => Promise<void>;
  toast: ToastState;
  closeToast: () => void;
}



function buildDefinition(
  initialDefinition?: Partial<SegmentDefinition>
): SegmentDefinition {
  const baseDefinition = {
    ...defaultSegmentDefinition,
    ...initialDefinition,
  } satisfies SegmentDefinition;

  return {
    ...baseDefinition,
    rules: initialDefinition?.rules?.length
      ? initialDefinition.rules
      : defaultSegmentDefinition.rules,
  };
}

export function useSegmentBuilderWizard({
  initialDefinition,
  onSubmit,
  validationErrors,
  onPreviewChange,
}: UseSegmentBuilderWizardOptions): UseSegmentBuilderWizardReturn {
  const t = useTranslations();
  const wizardSteps: StepDefinition[] = useMemo(
    () => [
      {
        id: "details",
        label: t("cms.marketing.segmentWizard.steps.details.label") as string,
        description: t(
          "cms.marketing.segmentWizard.steps.details.desc"
        ) as string,
      },
      {
        id: "rules",
        label: t("cms.marketing.segmentWizard.steps.rules.label") as string,
        description: t(
          "cms.marketing.segmentWizard.steps.rules.desc"
        ) as string,
      },
      {
        id: "review",
        label: t("cms.marketing.segmentWizard.steps.review.label") as string,
        description: t(
          "cms.marketing.segmentWizard.steps.review.desc"
        ) as string,
      },
    ],
    [t]
  );
  const [definition, setDefinition] = useState<SegmentDefinition>(() =>
    buildDefinition(initialDefinition)
  );
  const [preview, setPreview] = useState<SegmentPreviewData>(() =>
    getSegmentPreview(buildDefinition(initialDefinition))
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [errors, setErrors] = useState<SegmentValidationErrors>({});
  const [toast, setToast] = useState<ToastState>({ open: false, message: "" });

  useEffect(() => {
    setDefinition(buildDefinition(initialDefinition));
  }, [initialDefinition]);

  useEffect(() => {
    const nextPreview = getSegmentPreview(definition);
    setPreview(nextPreview);
    onPreviewChange?.(nextPreview);
  }, [definition, onPreviewChange]);

  const goToStep = useCallback((index: number) => {
    setStepIndex((current) => {
      const nextIndex = Math.min(Math.max(index, 0), wizardSteps.length - 1);
      return nextIndex === current ? current : nextIndex;
    });
  }, [wizardSteps.length]);

  const updateDefinition = useCallback(
    (patch: Partial<SegmentDefinition>) => {
      setDefinition((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  const updateRule = useCallback((ruleId: string, patch: Partial<SegmentRule>) => {
    setDefinition((prev) => ({
      ...prev,
      rules: prev.rules.map((rule) =>
        rule.id === ruleId ? { ...rule, ...patch } : rule
      ),
    }));
  }, []);

  const addRule = useCallback(() => {
    setDefinition((prev) => ({
      ...prev,
      rules: [
        ...prev.rules,
        {
          id: `rule-${prev.rules.length + 1}`,
          attribute: "country",
          operator: "equals",
          // i18n-exempt -- DS-000 seed example value; not user-facing copy and immediately editable [ttl=2026-01-01]
          value: "United States",
        },
      ],
    }));
  }, []);

  const removeRule = useCallback((ruleId: string) => {
    setDefinition((prev) => ({
      ...prev,
      rules: prev.rules.filter((rule) => rule.id !== ruleId),
    }));
  }, []);

  const handleDetailsSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const nextErrors: SegmentValidationErrors = {};
      if (!definition.name) {
        nextErrors.name = t("cms.marketing.segmentWizard.errors.nameRequired") as string;
      }
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) {
        setToast({
          open: true,
          message:
            nextErrors.name ?? (t("cms.marketing.segmentWizard.errors.validation") as string) ?? "",
        });
        return;
      }
      goToStep(stepIndex + 1);
    },
    [definition.name, goToStep, stepIndex, t]
  );

  const handleRulesNext = useCallback(() => {
    const nextErrors: SegmentValidationErrors = {};
    if (definition.rules.length === 0) {
      nextErrors.rules = t("cms.marketing.segmentWizard.errors.rulesRequired") as string;
    } else if (
      definition.rules.some(
        (rule) => !rule.attribute || !rule.operator || !rule.value
      )
    ) {
      nextErrors.rules = t("cms.marketing.segmentWizard.errors.completeRules") as string;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setToast({
        open: true,
        message:
          nextErrors.rules ?? (t("cms.marketing.segmentWizard.errors.validation") as string) ?? "",
      });
      return;
    }
    // Move directly to the Review step once rules are valid,
    // independent of current index.
    const reviewIndex = wizardSteps.findIndex((s) => s.id === "review");
    goToStep(reviewIndex === -1 ? stepIndex + 1 : reviewIndex);
  }, [definition.rules, goToStep, stepIndex, t, wizardSteps]);

  const handleFinish = useCallback(async () => {
    if (status === "submitting") return;
    if (!onSubmit) {
      setToast({
        open: true,
        message: t("cms.marketing.segmentWizard.success.readyToActivate") as string,
      });
      return;
    }
    try {
      setStatus("submitting");
      await onSubmit(definition);
      setStatus("success");
      setToast({ open: true, message: t("cms.marketing.segmentWizard.success.created") as string });
    } catch (error) {
      setStatus("error");
      const fallback =
        error instanceof Error
          ? error.message
          : (t("cms.marketing.segmentWizard.errors.createFailed") as string);
      setToast({ open: true, message: fallback });
    }
  }, [definition, onSubmit, status, t]);

  const derivedErrors = useMemo(
    () => ({ ...errors, ...(validationErrors ?? {}) }),
    [errors, validationErrors]
  );

  const currentStep = wizardSteps[stepIndex];

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  // Expose a stable API object so external holders of the reference
  // always observe the latest values after re-renders.
  const apiRef = useRef<UseSegmentBuilderWizardReturn>({} as UseSegmentBuilderWizardReturn);
  apiRef.current.steps = wizardSteps;
  apiRef.current.stepIndex = stepIndex;
  apiRef.current.currentStep = currentStep;
  apiRef.current.definition = definition;
  apiRef.current.preview = preview;
  apiRef.current.status = status;
  apiRef.current.errors = derivedErrors;
  apiRef.current.goToStep = goToStep;
  apiRef.current.updateDefinition = updateDefinition;
  apiRef.current.updateRule = updateRule;
  apiRef.current.addRule = addRule;
  apiRef.current.removeRule = removeRule;
  apiRef.current.handleDetailsSubmit = handleDetailsSubmit;
  apiRef.current.handleRulesNext = handleRulesNext;
  apiRef.current.handleFinish = handleFinish;
  apiRef.current.toast = toast;
  apiRef.current.closeToast = closeToast;

  return apiRef.current as UseSegmentBuilderWizardReturn;
}
// Exported above as explicit interface for clarity and type safety
