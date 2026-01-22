"use client";

import { Toast } from "@acme/design-system/atoms";
import {
  Button,
  Card,
  CardContent,
  Input,
  Textarea,
} from "@acme/design-system/shadcn";
import { cn } from "@acme/design-system/utils/style";
import { useTranslations } from "@acme/i18n";

import {
  type AsyncSubmissionHandler,
  type SubmissionStatus,
} from "../shared";

import { FollowUpControls } from "./FollowUpControls";
import {
  type EmailScheduleErrors,
  useEmailScheduleFormState,
} from "./hooks/useEmailScheduleFormState";
import { ScheduleTimingFields } from "./ScheduleTimingFields";
import {
  type EmailScheduleFormValues,
  type EmailSchedulePreviewData,
} from "./types";

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
  submitLabel,
  className,
  busy,
}: EmailScheduleFormProps) {
  const t = useTranslations();
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
            <label
              /* i18n-exempt -- DS-1234 [ttl=2025-11-30] */
              htmlFor="email-subject"
              className="text-sm font-medium"
            >
              {t("emailScheduling.subjectLabel")}
            </label>
            <Input
              /* i18n-exempt -- DS-1234 [ttl=2025-11-30] */
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
                /* i18n-exempt -- DS-1234 [ttl=2025-11-30] */
                id="email-subject-error"
                className="text-danger text-xs"
                /* i18n-exempt -- DS-1234 [ttl=2025-11-30] */
                data-token="--color-danger"
              >
                {errors.subject}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label
              /* i18n-exempt -- DS-1234 [ttl=2025-11-30] */
              htmlFor="email-preheader"
              className="text-sm font-medium"
            >
              {t("emailScheduling.preheaderLabel")}
            </label>
            <Textarea
              /* i18n-exempt -- DS-1234 [ttl=2025-11-30] */
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
          {status === "submitting" ? t("emailScheduling.scheduling") : submitLabel ?? t("emailScheduling.scheduleSend")}
        </Button>
      </div>

      <Toast open={toast.open} message={toast.message} onClose={dismissToast} />
    </form>
  );
}

export default EmailScheduleForm;
