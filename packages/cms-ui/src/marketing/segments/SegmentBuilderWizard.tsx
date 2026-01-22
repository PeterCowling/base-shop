"use client";

import { Toast } from "@acme/design-system/atoms";
import { useTranslations } from "@acme/i18n";

import type {
  AsyncSubmissionHandler,
  ValidationErrors,
} from "../shared";

import { SegmentBuilderWizardLayout } from "./SegmentBuilderWizardLayout";
import { SegmentDetailsStep } from "./SegmentDetailsStep";
import { SegmentReviewStep } from "./SegmentReviewStep";
import { SegmentRulesStep } from "./SegmentRulesStep";
import {
  type SegmentDefinition,
  type SegmentPreviewData,
} from "./types";
import { useSegmentBuilderWizard } from "./useSegmentBuilderWizard";

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
  finishLabel,
  className,
}: SegmentBuilderWizardProps) {
  const t = useTranslations();
  const resolvedFinishLabel = finishLabel ?? (t("segments.builder.finishLabel.create") as string);
  const {
    steps,
    stepIndex,
    currentStep,
    definition,
    preview,
    status,
    errors,
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
  } = useSegmentBuilderWizard({
    initialDefinition,
    onSubmit,
    validationErrors,
    onPreviewChange,
  });

  return (
    <SegmentBuilderWizardLayout
      steps={steps}
      currentStepIndex={stepIndex}
      onStepSelect={(index) => {
        if (index < stepIndex) {
          goToStep(index);
        }
      }}
      className={className}
    >
      {currentStep.id === "details" && (
        <SegmentDetailsStep
          definition={definition}
          errors={errors}
          onDefinitionChange={updateDefinition}
          onSubmit={handleDetailsSubmit}
        />
      )}

      {currentStep.id === "rules" && (
        <SegmentRulesStep
          definition={definition}
          errors={errors}
          onRuleChange={updateRule}
          onRuleAdd={addRule}
          onRuleRemove={removeRule}
          onBack={() => goToStep(stepIndex - 1)}
          onNext={handleRulesNext}
        />
      )}

      {currentStep.id === "review" && (
        <SegmentReviewStep
          preview={preview}
          status={status}
          finishLabel={resolvedFinishLabel}
          onEditRules={() => goToStep(stepIndex - 1)}
          onEditDetails={() => goToStep(stepIndex - 2)}
          onFinish={handleFinish}
        />
      )}

      <Toast open={toast.open} message={toast.message} onClose={closeToast} />
    </SegmentBuilderWizardLayout>
  );
}

export default SegmentBuilderWizard;
