"use client";

import { Button } from "../../../atoms/shadcn";
import { cn } from "../../../../utils/style";
import { CampaignAudienceSection } from "./CampaignAudienceSection";
import { CampaignBasicsSection } from "./CampaignBasicsSection";
import { CampaignFormToast } from "./CampaignFormToast";
import { CampaignScheduleSection } from "./CampaignScheduleSection";
import {
  useCampaignForm,
  type CampaignErrors,
  type CampaignFormMessages,
} from "./useCampaignForm";
import {
  type CampaignFormSectionId,
  type CampaignFormValues,
  type CampaignPreviewData,
} from "./types";
import {
  type AsyncSubmissionHandler,
  type SubmissionStatus,
} from "../shared";

export interface CampaignFormProps {
  defaultValues?: Partial<CampaignFormValues>;
  sections?: CampaignFormSectionId[];
  validationErrors?: CampaignErrors;
  onSubmit?: AsyncSubmissionHandler<CampaignFormValues>;
  onStatusChange?: (status: SubmissionStatus) => void;
  onPreviewChange?: (preview: CampaignPreviewData) => void;
  submitLabel?: string;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  busy?: boolean;
  status?: SubmissionStatus;
  messages?: CampaignFormMessages;
  className?: string;
}

export function CampaignForm({
  defaultValues,
  sections = ["basics", "audience", "schedule"],
  validationErrors,
  onSubmit,
  onStatusChange,
  onPreviewChange,
  submitLabel = "Save campaign",
  secondaryAction,
  busy,
  status: statusProp,
  messages,
  className,
}: CampaignFormProps) {
  const {
    values,
    errors,
    status,
    toast,
    handleSubmit,
    updateValue,
    toggleChannel,
    dismissToast,
  } = useCampaignForm({
    defaultValues,
    sections,
    validationErrors,
    onSubmit,
    onStatusChange,
    onPreviewChange,
    status: statusProp,
    messages,
  });

  const visibleSections = new Set(sections);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-6", className)}
      noValidate
    >
      {visibleSections.has("basics") && (
        <CampaignBasicsSection
          values={values}
          errors={errors}
          onUpdateValue={updateValue}
        />
      )}

      {visibleSections.has("audience") && (
        <CampaignAudienceSection
          values={values}
          errors={errors}
          onUpdateValue={updateValue}
          onToggleChannel={toggleChannel}
        />
      )}

      {visibleSections.has("schedule") && (
        <CampaignScheduleSection
          values={values}
          errors={errors}
          onUpdateValue={updateValue}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {secondaryAction && (
          <Button
            type="button"
            variant="outline"
            onClick={secondaryAction.onClick}
          >
            {secondaryAction.label}
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {status === "submitting"
              ? "Saving campaign…"
              : status === "success"
              ? "Ready to launch"
              : undefined}
          </span>
          <Button type="submit" disabled={busy || status === "submitting"}>
            {submitLabel}
          </Button>
        </div>
      </div>

      <CampaignFormToast
        open={toast.open}
        message={toast.message}
        onClose={dismissToast}
      />
    </form>
  );
}

export default CampaignForm;
export type { CampaignFormMessages } from "./useCampaignForm";
