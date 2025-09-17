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
import { Switch, Toast } from "../../../atoms";
import { cn } from "../../../../utils/style";
import {
  defaultEmailScheduleValues,
  getEmailSchedulePreview,
  type EmailScheduleFormValues,
  type EmailSchedulePreviewData,
} from "./types";
import {
  type AsyncSubmissionHandler,
  type SubmissionStatus,
  type ValidationErrors,
} from "../shared";

type EmailScheduleField = keyof EmailScheduleFormValues;
type EmailScheduleErrors = ValidationErrors<EmailScheduleField>;

const timezoneOptions = [
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Berlin",
  "Europe/London",
  "Asia/Tokyo",
];

const segmentOptions = [
  "All subscribers",
  "VIP customers",
  "Winback cohort",
  "Abandoned checkout",
];

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

function validate(values: EmailScheduleFormValues): EmailScheduleErrors {
  const errors: EmailScheduleErrors = {};
  if (!values.subject) errors.subject = "Subject is required.";
  if (!values.sendDate) errors.sendDate = "Choose a send date.";
  if (!values.sendTime) errors.sendTime = "Choose a send time.";
  if (!values.timezone) errors.timezone = "Select a timezone.";
  if (!values.segment) errors.segment = "Select a segment.";
  if (values.followUpEnabled && values.followUpDelayHours <= 0) {
    errors.followUpDelayHours = "Delay must be greater than zero.";
  }
  return errors;
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
  const [values, setValues] = useState<EmailScheduleFormValues>({
    ...defaultEmailScheduleValues,
    ...defaultValues,
  });
  const [internalErrors, setInternalErrors] =
    useState<EmailScheduleErrors>({});
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [toast, setToast] = useState<{ open: boolean; message: string }>(
    { open: false, message: "" }
  );

  useEffect(() => {
    setValues({ ...defaultEmailScheduleValues, ...defaultValues });
  }, [defaultValues]);

  useEffect(() => {
    onPreviewChange?.(getEmailSchedulePreview(values));
  }, [values, onPreviewChange]);

  const errors = useMemo(
    () => ({ ...internalErrors, ...(validationErrors ?? {}) }),
    [internalErrors, validationErrors]
  );

  const update = <K extends EmailScheduleField>(
    key: K,
    value: EmailScheduleFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setInternalErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("validating");
    onStatusChange?.("validating");
    const nextErrors = validate(values);
    setInternalErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      onStatusChange?.("error");
      setToast({
        open: true,
        message: "Please resolve the highlighted fields.",
      });
      return;
    }

    if (!onSubmit) {
      setStatus("success");
      onStatusChange?.("success");
      setToast({ open: true, message: "Draft schedule saved." });
      return;
    }

    try {
      setStatus("submitting");
      onStatusChange?.("submitting");
      await onSubmit(values);
      setStatus("success");
      onStatusChange?.("success");
      setToast({ open: true, message: "Email scheduled." });
    } catch (error) {
      setStatus("error");
      onStatusChange?.("error");
      const fallback =
        error instanceof Error ? error.message : "Scheduling failed.";
      setToast({ open: true, message: fallback });
    }
  };

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
              onChange={(event) => update("subject", event.target.value)}
              aria-invalid={errors.subject ? "true" : "false"}
              aria-describedby={errors.subject ? "email-subject-error" : undefined}
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
              onChange={(event) => update("preheader", event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="email-send-date" className="text-sm font-medium">
              Send date
            </label>
            <Input
              id="email-send-date"
              type="date"
              value={values.sendDate}
              onChange={(event) => update("sendDate", event.target.value)}
              aria-invalid={errors.sendDate ? "true" : "false"}
              aria-describedby={errors.sendDate ? "email-send-date-error" : undefined}
            />
            {errors.sendDate && (
              <p
                id="email-send-date-error"
                className="text-danger text-xs"
                data-token="--color-danger"
              >
                {errors.sendDate}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="email-send-time" className="text-sm font-medium">
              Send time
            </label>
            <Input
              id="email-send-time"
              type="time"
              value={values.sendTime}
              onChange={(event) => update("sendTime", event.target.value)}
              aria-invalid={errors.sendTime ? "true" : "false"}
              aria-describedby={errors.sendTime ? "email-send-time-error" : undefined}
            />
            {errors.sendTime && (
              <p
                id="email-send-time-error"
                className="text-danger text-xs"
                data-token="--color-danger"
              >
                {errors.sendTime}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Timezone</label>
            <Select
              value={values.timezone}
              onValueChange={(value) => update("timezone", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezoneOptions.map((zone) => (
                  <SelectItem key={zone} value={zone}>
                    {zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.timezone && (
              <p className="text-danger text-xs" data-token="--color-danger">
                {errors.timezone}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Segment</label>
            <Select
              value={values.segment}
              onValueChange={(value) => update("segment", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select segment" />
              </SelectTrigger>
              <SelectContent>
                {segmentOptions.map((segment) => (
                  <SelectItem key={segment} value={segment}>
                    {segment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.segment && (
              <p className="text-danger text-xs" data-token="--color-danger">
                {errors.segment}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-medium">Follow-up email</h3>
              <p className="text-muted-foreground text-xs">
                Send a reminder to non-openers after a delay.
              </p>
            </div>
            <Switch
              checked={values.followUpEnabled}
              onChange={(event) => update("followUpEnabled", event.target.checked)}
              aria-checked={values.followUpEnabled}
            />
          </div>
          {values.followUpEnabled && (
            <div className="space-y-1">
              <label htmlFor="follow-up-delay" className="text-sm font-medium">
                Delay in hours
              </label>
              <Input
                id="follow-up-delay"
                type="number"
                min={1}
                value={String(values.followUpDelayHours)}
                onChange={(event) =>
                  update(
                    "followUpDelayHours",
                    Number(event.target.value || 0)
                  )
                }
                aria-invalid={errors.followUpDelayHours ? "true" : "false"}
                aria-describedby={
                  errors.followUpDelayHours ? "follow-up-delay-error" : undefined
                }
              />
              {errors.followUpDelayHours && (
                <p
                  id="follow-up-delay-error"
                  className="text-danger text-xs"
                  data-token="--color-danger"
                >
                  {errors.followUpDelayHours}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={busy || status === "submitting"}>
          {status === "submitting" ? "Scheduling…" : submitLabel}
        </Button>
      </div>

      <Toast
        open={toast.open}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </form>
  );
}

export default EmailScheduleForm;
