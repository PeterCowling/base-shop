import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { StepDefinition } from "../shared/StepIndicator";
import {
  defaultSegmentDefinition,
  getSegmentPreview,
  type SegmentDefinition,
  type SegmentPreviewData,
  type SegmentRule,
} from "./types";
import type {
  AsyncSubmissionHandler,
  SubmissionStatus,
  ValidationErrors,
} from "../shared";

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

const wizardSteps: StepDefinition[] = [
  {
    id: "details",
    label: "Details",
    description: "Name the segment and provide context for teammates.",
  },
  {
    id: "rules",
    label: "Rules",
    description: "Add filters to define the audience membership.",
  },
  {
    id: "review",
    label: "Review",
    description: "Validate the output before syncing downstream.",
  },
];

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
}: UseSegmentBuilderWizardOptions) {
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
  }, []);

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
        nextErrors.name = "Segment name is required.";
      }
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) {
        setToast({
          open: true,
          message: nextErrors.name ?? "Validation error.",
        });
        return;
      }
      goToStep(stepIndex + 1);
    },
    [definition.name, goToStep, stepIndex]
  );

  const handleRulesNext = useCallback(() => {
    const nextErrors: SegmentValidationErrors = {};
    if (definition.rules.length === 0) {
      nextErrors.rules = "Add at least one rule.";
    } else if (
      definition.rules.some(
        (rule) => !rule.attribute || !rule.operator || !rule.value
      )
    ) {
      nextErrors.rules = "Complete each rule before continuing.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setToast({
        open: true,
        message: nextErrors.rules ?? "Validation error.",
      });
      return;
    }
    goToStep(stepIndex + 1);
  }, [definition.rules, goToStep, stepIndex]);

  const handleFinish = useCallback(async () => {
    if (status === "submitting") return;
    if (!onSubmit) {
      setToast({ open: true, message: "Segment ready to activate." });
      return;
    }
    try {
      setStatus("submitting");
      await onSubmit(definition);
      setStatus("success");
      setToast({ open: true, message: "Segment created." });
    } catch (error) {
      setStatus("error");
      const fallback =
        error instanceof Error ? error.message : "Failed to create segment.";
      setToast({ open: true, message: fallback });
    }
  }, [definition, onSubmit, status]);

  const derivedErrors = useMemo(
    () => ({ ...errors, ...(validationErrors ?? {}) }),
    [errors, validationErrors]
  );

  const currentStep = wizardSteps[stepIndex];

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    steps: wizardSteps,
    stepIndex,
    currentStep,
    definition,
    preview,
    status,
    errors: derivedErrors,
    goToStep,
    updateDefinition,
    updateRule,
    addRule,
    removeRule,
    handleDetailsSubmit,
    handleRulesNext,
    handleFinish,
    toast,
    closeToast,
  };
}

export type UseSegmentBuilderWizardReturn = ReturnType<
  typeof useSegmentBuilderWizard
>;
