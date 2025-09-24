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

const wizardSteps: StepDefinition[] = [
  {
    id: "plan",
    label: "Plan",
    description: "Define goals, KPIs, and the campaign overview.",
  },
  {
    id: "audience",
    label: "Audience",
    description: "Choose who should receive this campaign.",
  },
  {
    id: "schedule",
    label: "Schedule",
    description: "Confirm flight dates before review.",
  },
  {
    id: "review",
    label: "Review",
    description: "Double-check details and submit for approval.",
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
  finishLabel = "Submit for approval",
  messages,
  className,
}: CampaignWizardProps) {
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
          messages?.complete ?? "Campaign wizard completed. Ready for launch.",
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
          messages?.complete ?? "Campaign submitted for approval.",
      });
    } catch (error) {
      setStatus("error");
      const fallback =
        error instanceof Error
          ? error.message
          : messages?.error ?? "Unable to finalize campaign.";
      setToast({
        open: true,
        message: messages?.error ?? fallback,
      });
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <StepIndicator
        steps={wizardSteps}
        currentStep={stepIndex}
        onStepSelect={(index) => {
          if (index <= stepIndex) {
            goToStep(index);
          }
        }}
      />

      {currentStep?.id === "review" ? (
        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <CampaignPreviewPanel data={preview} />
          <CampaignSummaryCard
            data={preview}
            statusLabel={status === "success" ? "Approved" : "Pending"}
            statusTone={status === "success" ? "success" : "warning"}
            actions={
              <Button
                variant="outline"
                onClick={() => goToStep(stepIndex - 1)}
              >
                Back
              </Button>
            }
            footer={
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => goToStep(stepIndex - 1)}
                >
                  Edit details
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={status === "submitting"}
                >
                  {status === "submitting" ? "Submitting…" : finishLabel}
                </Button>
              </div>
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
              ? "Review campaign"
              : "Continue"
          }
          secondaryAction={
            stepIndex > 0
              ? {
                  label: "Back",
                  onClick: () => goToStep(stepIndex - 1),
                }
              : undefined
          }
          messages={{
            success: messages?.success ?? "Step saved",
            validation:
              messages?.validation ?? "Please resolve validation errors.",
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
