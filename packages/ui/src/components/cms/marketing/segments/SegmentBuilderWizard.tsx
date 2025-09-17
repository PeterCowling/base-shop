"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "../../../atoms/shadcn";
import { Toast } from "../../../atoms";
import { cn } from "../../../../utils/style";
import { StepIndicator } from "../shared";
import type { StepDefinition } from "../shared/StepIndicator";
import SegmentPreviewPanel from "./SegmentPreviewPanel";
import SegmentSummaryCard from "./SegmentSummaryCard";
import {
  defaultSegmentDefinition,
  getSegmentPreview,
  type SegmentDefinition,
  type SegmentOperator,
  type SegmentPreviewData,
  type SegmentRule,
} from "./types";
import {
  type AsyncSubmissionHandler,
  type SubmissionStatus,
  type ValidationErrors,
} from "../shared";

const attributes = [
  { value: "lifetime_value", label: "Lifetime value" },
  { value: "purchase_count", label: "Orders placed" },
  { value: "country", label: "Country" },
  { value: "last_order_date", label: "Last order date" },
];

const operatorOptions: { value: SegmentOperator; label: string }[] = [
  { value: "equals", label: "Equals" },
  { value: "contains", label: "Contains" },
  { value: "greaterThan", label: "Greater than" },
  { value: "lessThan", label: "Less than" },
];

const steps: StepDefinition[] = [
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

interface SegmentBuilderWizardProps {
  initialDefinition?: Partial<SegmentDefinition>;
  onSubmit?: AsyncSubmissionHandler<SegmentDefinition>;
  validationErrors?: ValidationErrors<"name" | "rules">;
  onPreviewChange?: (preview: SegmentPreviewData) => void;
  finishLabel?: string;
  className?: string;
}

export function SegmentBuilderWizard({
  initialDefinition,
  onSubmit,
  validationErrors,
  onPreviewChange,
  finishLabel = "Create segment",
  className,
}: SegmentBuilderWizardProps) {
  const [definition, setDefinition] = useState<SegmentDefinition>({
    ...defaultSegmentDefinition,
    ...initialDefinition,
    rules: initialDefinition?.rules?.length
      ? initialDefinition.rules
      : defaultSegmentDefinition.rules,
  });
  const [preview, setPreview] = useState<SegmentPreviewData>(
    getSegmentPreview({
      ...defaultSegmentDefinition,
      ...initialDefinition,
      rules: initialDefinition?.rules?.length
        ? initialDefinition.rules
        : defaultSegmentDefinition.rules,
    })
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [errors, setErrors] = useState<ValidationErrors<"name" | "rules">>({});
  const [toast, setToast] = useState<{ open: boolean; message: string }>(
    { open: false, message: "" }
  );

  useEffect(() => {
    setDefinition({
      ...defaultSegmentDefinition,
      ...initialDefinition,
      rules: initialDefinition?.rules?.length
        ? initialDefinition.rules
        : defaultSegmentDefinition.rules,
    });
  }, [initialDefinition]);

  useEffect(() => {
    const nextPreview = getSegmentPreview(definition);
    setPreview(nextPreview);
    onPreviewChange?.(nextPreview);
  }, [definition, onPreviewChange]);

  const currentStep = steps[stepIndex];

  const goToStep = (index: number) => {
    setStepIndex(Math.min(Math.max(index, 0), steps.length - 1));
  };

  const updateRule = (ruleId: string, patch: Partial<SegmentRule>) => {
    setDefinition((prev) => ({
      ...prev,
      rules: prev.rules.map((rule) =>
        rule.id === ruleId ? { ...rule, ...patch } : rule
      ),
    }));
  };

  const addRule = () => {
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
  };

  const removeRule = (ruleId: string) => {
    setDefinition((prev) => ({
      ...prev,
      rules: prev.rules.filter((rule) => rule.id !== ruleId),
    }));
  };

  const handleDetailsSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: ValidationErrors<"name" | "rules"> = {};
    if (!definition.name) {
      nextErrors.name = "Segment name is required.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setToast({ open: true, message: nextErrors.name ?? "Validation error." });
      return;
    }
    goToStep(stepIndex + 1);
  };

  const handleRulesNext = () => {
    const nextErrors: ValidationErrors<"name" | "rules"> = {};
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
  };

  const handleFinish = async () => {
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
  };

  const derivedErrors = useMemo(
    () => ({ ...errors, ...(validationErrors ?? {}) }),
    [errors, validationErrors]
  );

  return (
    <div className={cn("space-y-6", className)}>
      <StepIndicator
        steps={steps}
        currentStep={stepIndex}
        onStepSelect={(index) => {
          if (index < stepIndex) goToStep(index);
        }}
      />

      {currentStep.id === "details" && (
        <form onSubmit={handleDetailsSubmit} className="space-y-4" noValidate>
          <Card>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="segment-name" className="text-sm font-medium">
                  Segment name
                </label>
                <Input
                  id="segment-name"
                  value={definition.name}
                  onChange={(event) =>
                    setDefinition((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  aria-invalid={derivedErrors.name ? "true" : "false"}
                  aria-describedby={
                    derivedErrors.name ? "segment-name-error" : undefined
                  }
                />
                {derivedErrors.name && (
                  <p
                    id="segment-name-error"
                    className="text-danger text-xs"
                    data-token="--color-danger"
                  >
                    {derivedErrors.name}
                  </p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label
                    htmlFor="segment-description"
                    className="text-sm font-medium"
                  >
                    Description
                  </label>
                  <Textarea
                    id="segment-description"
                    rows={3}
                    value={definition.description}
                    onChange={(event) =>
                      setDefinition((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="segment-size" className="text-sm font-medium">
                    Estimated size
                  </label>
                  <Input
                    id="segment-size"
                    type="number"
                    min={0}
                    value={String(definition.estimatedSize)}
                    onChange={(event) =>
                      setDefinition((prev) => ({
                        ...prev,
                        estimatedSize: Number(event.target.value || 0),
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2">
            <Button type="submit">Continue</Button>
          </div>
        </form>
      )}

      {currentStep.id === "rules" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4">
              {definition.rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                >
                  <Select
                    value={rule.attribute}
                    onValueChange={(value) =>
                      updateRule(rule.id, { attribute: value })
                    }
                  >
                    <SelectTrigger className="min-w-[180px]">
                      <SelectValue placeholder="Attribute" />
                    </SelectTrigger>
                    <SelectContent>
                      {attributes.map((attr) => (
                        <SelectItem key={attr.value} value={attr.value}>
                          {attr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={rule.operator}
                    onValueChange={(value) =>
                      updateRule(rule.id, {
                        operator: value as SegmentOperator,
                      })
                    }
                  >
                    <SelectTrigger className="min-w-[140px]">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={rule.value}
                    onChange={(event) =>
                      updateRule(rule.id, { value: event.target.value })
                    }
                    className="min-w-[160px]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeRule(rule.id)}
                    disabled={definition.rules.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {derivedErrors.rules && (
                <p className="text-danger text-xs" data-token="--color-danger">
                  {derivedErrors.rules}
                </p>
              )}
              <Button type="button" variant="outline" onClick={addRule}>
                Add rule
              </Button>
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => goToStep(stepIndex - 1)}>
              Back
            </Button>
            <Button onClick={handleRulesNext}>Review segment</Button>
          </div>
        </div>
      )}

      {currentStep.id === "review" && (
        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <SegmentPreviewPanel data={preview} />
          <SegmentSummaryCard
            data={preview}
            statusLabel={status === "success" ? "Ready" : "Draft"}
            actions={
              <Button variant="outline" onClick={() => goToStep(stepIndex - 1)}>
                Edit rules
              </Button>
            }
            footer={
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => goToStep(stepIndex - 2)}
                >
                  Update details
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={status === "submitting"}
                >
                  {status === "submitting" ? "Saving…" : finishLabel}
                </Button>
              </div>
            }
          />
        </div>
      )}

      <Toast
        open={toast.open}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}

export default SegmentBuilderWizard;
