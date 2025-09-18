"use client";

import {
  Button,
  Card,
  CardContent,
  Input,
  Textarea,
} from "../../../atoms/shadcn";
import { Toast } from "../../../atoms";
import { cn } from "../../../../utils/style";
import {
  type EmailScheduleFormValues,
  type EmailSchedulePreviewData,
} from "./types";
import { ScheduleTimingFields } from "./ScheduleTimingFields";
import { FollowUpControls } from "./FollowUpControls";
import {
  type EmailScheduleErrors,
  useEmailScheduleFormState,
} from "./hooks/useEmailScheduleFormState";
import {
  type AsyncSubmissionHandler,
  type SubmissionStatus,
} from "../shared";

export interface EmailScheduleFormProps {
  defaultValues?: Partial<EmailScheduleFormValues>;
  validationErrors?: EmailScheduleErrors;
  onSubmit?: AsyncSubmissionHandler<EmailScheduleFormValues>;
  onPreviewChange?: (preview: EmailSchedulePreviewData) => void;
  onStatusChange?: (status: SubmissionStatus) => void;
  submitLabel?: string;
  className?: string;
  busy?: boolean;
}

export function EmailScheduleForm({
  defaultValues,
  validationErrors,
  onSubmit,
  onPreviewChange,
  onStatusChange,
  submitLabel = "Schedule send",
  className,
  busy,
}: EmailScheduleFormProps) {
  const {
    values,
    errors,
    status,
    toast,
    updateValue,
    handleSubmit,
    dismissToast,
  } = useEmailScheduleFormState({
    defaultValues,
    validationErrors,
    onSubmit,
    onPreviewChange,
    onStatusChange,
  });

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn("space-y-6", className)}
    >
      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email-subject" className="text-sm font-medium">
              Subject line
            </label>
            <Input
              id="email-subject"
              value={values.subject}
              onChange={(event) => updateValue("subject", event.target.value)}
              aria-invalid={errors.subject ? "true" : "false"}
              aria-describedby={
                errors.subject ? "email-subject-error" : undefined
              }
            />
            {errors.subject && (
              <p
                id="email-subject-error"
                className="text-danger text-xs"
                data-token="--color-danger"
              >
                {errors.subject}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="email-preheader" className="text-sm font-medium">
              Preheader
            </label>
            <Textarea
              id="email-preheader"
              rows={2}
              value={values.preheader}
              onChange={(event) => updateValue("preheader", event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <ScheduleTimingFields values={values} errors={errors} onUpdate={updateValue} />

      <FollowUpControls
        values={values}
        error={errors.followUpDelayHours}
        onUpdate={updateValue}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={busy || status === "submitting"}>
          {status === "submitting" ? "Scheduling…" : submitLabel}
        </Button>
      </div>

      <Toast open={toast.open} message={toast.message} onClose={dismissToast} />
    </form>
  );
}

export default EmailScheduleForm;
