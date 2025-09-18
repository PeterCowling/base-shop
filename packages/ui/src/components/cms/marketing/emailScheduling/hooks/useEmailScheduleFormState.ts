"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  defaultEmailScheduleValues,
  getEmailSchedulePreview,
  type EmailScheduleFormValues,
  type EmailSchedulePreviewData,
} from "../types";
import {
  type AsyncSubmissionHandler,
  type SubmissionStatus,
  type ValidationErrors,
} from "../../shared";

export type EmailScheduleField = keyof EmailScheduleFormValues;
export type EmailScheduleErrors = ValidationErrors<EmailScheduleField>;

export interface EmailScheduleToastState {
  open: boolean;
  message: string;
}

export interface UseEmailScheduleFormStateOptions {
  defaultValues?: Partial<EmailScheduleFormValues>;
  validationErrors?: EmailScheduleErrors;
  onSubmit?: AsyncSubmissionHandler<EmailScheduleFormValues>;
  onPreviewChange?: (preview: EmailSchedulePreviewData) => void;
  onStatusChange?: (status: SubmissionStatus) => void;
}

export interface EmailScheduleFormState {
  values: EmailScheduleFormValues;
  errors: EmailScheduleErrors;
  status: SubmissionStatus;
  toast: EmailScheduleToastState;
  updateValue: <K extends EmailScheduleField>(
    key: K,
    value: EmailScheduleFormValues[K]
  ) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  dismissToast: () => void;
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

export function useEmailScheduleFormState({
  defaultValues,
  validationErrors,
  onSubmit,
  onPreviewChange,
  onStatusChange,
}: UseEmailScheduleFormStateOptions): EmailScheduleFormState {
  const [values, setValues] = useState<EmailScheduleFormValues>({
    ...defaultEmailScheduleValues,
    ...defaultValues,
  });
  const [internalErrors, setInternalErrors] = useState<EmailScheduleErrors>({});
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [toast, setToast] = useState<EmailScheduleToastState>({
    open: false,
    message: "",
  });

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

  const updateValue = useCallback(
    <K extends EmailScheduleField>(
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
    },
    []
  );

  const dismissToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
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
    },
    [values, onSubmit, onStatusChange]
  );

  return {
    values,
    errors,
    status,
    toast,
    updateValue,
    handleSubmit,
    dismissToast,
  };
}
