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
    label: "Plan", // i18n-exempt: translated at render time
    description: "Define goals, KPIs, and the campaign overview.", // i18n-exempt: translated at render time
  },
  {
    id: "audience",
    label: "Audience", // i18n-exempt: translated at render time
    description: "Choose who should receive this campaign.", // i18n-exempt: translated at render time
  },
  {
    id: "schedule",
    label: "Schedule", // i18n-exempt: translated at render time
    description: "Confirm flight dates before review.", // i18n-exempt: translated at render time
  },
  {
    id: "review",
    label: "Review", // i18n-exempt: translated at render time
    description: "Double-check details and submit for approval.", // i18n-exempt: translated at render time
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
  const resolvedFinishLabel = (finishLabel ?? t("Submit for approval")) as string;
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
          (t("Campaign wizard completed. Ready for launch.") as string),
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
          messages?.complete ?? (t("Campaign submitted for approval.") as string),
      });
    } catch (error) {
      setStatus("error");
      const fallback =
        error instanceof Error
          ? error.message
          : messages?.error ?? (t("Unable to finalize campaign.") as string);
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
            statusLabel={status === "success" ? (t("Approved") as string) : (t("Pending") as string)}
            statusTone={status === "success" ? "success" : "warning"}
            actions={
              <Button
                variant="outline"
                onClick={() => goToStep(stepIndex - 1)}
              >
                {t("Back")}
              </Button>
            }
            footer={
              <Inline className="justify-end" gap={2}>
                <Button
                  variant="outline"
                  onClick={() => goToStep(stepIndex - 1)}
                >
                  {t("Edit details")}
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={status === "submitting"}
                >
                  {status === "submitting" ? (t("Submitting…") as string) : resolvedFinishLabel}
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
              ? (t("Review campaign") as string)
              : (t("Continue") as string)
          }
          secondaryAction={
            stepIndex > 0
              ? {
                  label: t("Back") as string,
                  onClick: () => goToStep(stepIndex - 1),
                }
              : undefined
          }
          messages={{
            success: messages?.success ?? (t("Step saved") as string),
            validation:
              messages?.validation ?? (t("Please resolve validation errors.") as string),
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
