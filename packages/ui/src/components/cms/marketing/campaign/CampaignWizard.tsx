"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../../atoms/shadcn";
import { Toast } from "../../../atoms";
import { cn } from "../../../../utils/style";
import { StepIndicator } from "../shared";
import type { StepDefinition } from "../shared/StepIndicator";
import type { CampaignFormMessages } from "./CampaignForm";
import CampaignForm from "./CampaignForm";
import CampaignPreviewPanel from "./CampaignPreviewPanel";
import CampaignSummaryCard from "./CampaignSummaryCard";
import {
  defaultCampaignValues,
  getCampaignPreview,
  type CampaignFormSectionId,
  type CampaignFormValues,
  type CampaignPreviewData,
} from "./types";
import {
  type AsyncSubmissionHandler,
  type SubmissionStatus,
  type ValidationErrors,
} from "../shared";
import { useTranslations } from "@acme/i18n";
import { Inline } from "../../../atoms/primitives";

export interface CampaignWizardMessages extends CampaignFormMessages {
  complete?: string;
}

export interface CampaignWizardProps {
  initialValues?: Partial<CampaignFormValues>;
  onSubmit?: AsyncSubmissionHandler<CampaignFormValues>;
  validationErrors?: ValidationErrors<keyof CampaignFormValues>;
  onPreviewChange?: (preview: CampaignPreviewData) => void;
  finishLabel?: string;
  messages?: CampaignWizardMessages;
  className?: string;
}

// i18n-exempt — step copy is translated at render-time via useTranslations
/* i18n-exempt */
const wizardSteps: StepDefinition[] = [
  {
    id: "plan",
    label: "campaign.wizard.steps.plan.label",
    description: "campaign.wizard.steps.plan.desc",
  },
  {
    id: "audience",
    label: "campaign.wizard.steps.audience.label",
    description: "campaign.wizard.steps.audience.desc",
  },
  {
    id: "schedule",
    label: "campaign.wizard.steps.schedule.label",
    description: "campaign.wizard.steps.schedule.desc",
  },
  {
    id: "review",
    label: "campaign.wizard.steps.review.label",
    description: "campaign.wizard.steps.review.desc",
  },
];

const stepSections: Record<string, CampaignFormSectionId[]> = {
  plan: ["basics"],
  audience: ["audience"],
  schedule: ["schedule"],
};

export function CampaignWizard({
  initialValues,
  onSubmit,
  validationErrors,
  onPreviewChange,
  finishLabel,
  messages,
  className,
}: CampaignWizardProps) {
  const t = useTranslations();
  const resolvedFinishLabel = (finishLabel ?? t("campaign.wizard.finishLabel")) as string;
  const [values, setValues] = useState<CampaignFormValues>({
    ...defaultCampaignValues,
    ...initialValues,
  });
  const [preview, setPreview] = useState<CampaignPreviewData>(
    getCampaignPreview({ ...defaultCampaignValues, ...initialValues })
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [toast, setToast] = useState<{ open: boolean; message: string }>(
    { open: false, message: "" }
  );

  useEffect(() => {
    setValues({ ...defaultCampaignValues, ...initialValues });
  }, [initialValues]);

  useEffect(() => {
    setPreview(getCampaignPreview(values));
  }, [values]);

  useEffect(() => {
    if (onPreviewChange) {
      onPreviewChange(preview);
    }
  }, [preview, onPreviewChange]);

  const currentStep = wizardSteps[stepIndex];
  const steps = useMemo<StepDefinition[]>(
    () =>
      wizardSteps.map((s) => ({
        ...s,
        label: t(s.label) as string,
        description:
          typeof s.description === "string"
            ? (t(s.description) as string)
            : s.description,
      })),
    [t]
  );
  const sectionsForStep = useMemo(
    () => stepSections[currentStep?.id] ?? [],
    [currentStep]
  );

  const goToStep = (index: number) => {
    setStepIndex(Math.min(Math.max(index, 0), wizardSteps.length - 1));
  };

  const handleFormSubmit = (nextValues: CampaignFormValues) => {
    setValues(nextValues);
    goToStep(stepIndex + 1);
  };

  const handlePreview = useCallback(
    (nextPreview: CampaignPreviewData) => {
      setPreview(nextPreview);
      onPreviewChange?.(nextPreview);
    },
    [onPreviewChange]
  );

  const handleFinish = async () => {
    if (status === "submitting") return;
    if (!onSubmit) {
      setToast({
        open: true,
        message:
          messages?.complete ??
          (t("campaign.wizard.completed") as string),
      });
      return;
    }

    try {
      setStatus("submitting");
      await onSubmit(values);
      setStatus("success");
      setToast({
        open: true,
        message:
          messages?.complete ?? (t("campaign.wizard.submitted") as string),
      });
    } catch (error) {
      setStatus("error");
      const fallback =
        error instanceof Error
          ? error.message
          : messages?.error ?? (t("campaign.wizard.unable") as string);
      setToast({
        open: true,
        message: messages?.error ?? fallback,
      });
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <StepIndicator
        steps={steps}
        currentStep={stepIndex}
        onStepSelect={(index) => {
          if (index <= stepIndex) {
            goToStep(index);
          }
        }}
      />

      {currentStep?.id === "review" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <CampaignPreviewPanel data={preview} className="lg:col-span-2" />
          <CampaignSummaryCard
            data={preview}
            statusLabel={status === "success" ? (t("campaign.wizard.status.approved") as string) : (t("campaign.wizard.status.pending") as string)}
            statusTone={status === "success" ? "success" : "warning"}
            actions={
              <Button
                variant="outline"
                onClick={() => goToStep(stepIndex - 1)}
              >
                {t("actions.back")}
              </Button>
            }
            footer={
              <Inline className="justify-end" gap={2}>
                <Button
                  variant="outline"
                  onClick={() => goToStep(stepIndex - 1)}
                >
                  {t("campaign.wizard.editDetails")}
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={status === "submitting"}
                >
                  {status === "submitting" ? (t("campaign.wizard.submitting") as string) : resolvedFinishLabel}
                </Button>
              </Inline>
            }
          />
        </div>
      ) : (
        <CampaignForm
          key={currentStep?.id}
          defaultValues={values}
          sections={sectionsForStep}
          validationErrors={validationErrors as ValidationErrors<keyof CampaignFormValues>}
          onSubmit={handleFormSubmit}
          onStatusChange={setStatus}
          onPreviewChange={handlePreview}
          submitLabel={
            stepIndex === wizardSteps.length - 2
              ? (t("campaign.wizard.review") as string)
              : (t("actions.continue") as string)
          }
          secondaryAction={
            stepIndex > 0
              ? {
                  label: t("actions.back") as string,
                  onClick: () => goToStep(stepIndex - 1),
                }
              : undefined
          }
          messages={{
            success: messages?.success ?? (t("campaign.wizard.stepSaved") as string),
            validation:
              messages?.validation ?? (t("campaign.wizard.resolveValidation") as string),
            error: messages?.error,
          }}
        />
      )}

      <Toast
        open={toast.open}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}

export default CampaignWizard;
