"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useTranslations } from "@acme/i18n";

import {
  type AsyncSubmissionHandler,
  type SubmissionStatus,
  type ValidationErrors,
} from "../../shared";
import {
  defaultEmailScheduleValues,
  type EmailScheduleFormValues,
  type EmailSchedulePreviewData,
} from "../types";

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

function validate(values: EmailScheduleFormValues, t: (k: string) => string): EmailScheduleErrors {
  const errors: EmailScheduleErrors = {};
  if (!values.subject) errors.subject = t("emailScheduling.validation.subjectRequired");
  if (!values.sendDate) errors.sendDate = t("emailScheduling.validation.sendDateRequired");
  if (!values.sendTime) errors.sendTime = t("emailScheduling.validation.sendTimeRequired");
  if (!values.timezone) errors.timezone = t("emailScheduling.validation.timezoneRequired");
  if (!values.segment) errors.segment = t("emailScheduling.validation.segmentRequired");
  if (values.followUpEnabled && values.followUpDelayHours <= 0) {
    errors.followUpDelayHours = t("emailScheduling.validation.delayGreaterThanZero");
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
  const tHook = useTranslations();
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => String(tHook(key, vars)),
    [tHook]
  );
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
    if (!onPreviewChange) return;
    const preview: EmailSchedulePreviewData = {
      subject: values.subject || t("emailScheduling.preview.untitled"),
      sendAtLabel: values.sendDate
        ? t("emailScheduling.preview.sendAt", { date: values.sendDate, time: values.sendTime })
        : t("emailScheduling.preview.pending"),
      timezone: values.timezone,
      segment: t(`emailScheduling.segment.${values.segment}`),
      followUpSummary: values.followUpEnabled
        ? t("emailScheduling.preview.followUpEnabled", { hours: values.followUpDelayHours })
        : t("emailScheduling.preview.followUpDisabled"),
    };
    onPreviewChange(preview);
  }, [values, onPreviewChange, t]);

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

      const nextErrors = validate(values, t);
      setInternalErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) {
        setStatus("error");
        onStatusChange?.("error");
        setToast({
          open: true,
          message: t("emailScheduling.toast.resolveHighlighted"),
        });
        return;
      }

      if (!onSubmit) {
        setStatus("success");
        onStatusChange?.("success");
        setToast({ open: true, message: t("emailScheduling.toast.draftSaved") });
        return;
      }

      try {
        setStatus("submitting");
        onStatusChange?.("submitting");
        await onSubmit(values);
        setStatus("success");
        onStatusChange?.("success");
        setToast({ open: true, message: t("emailScheduling.toast.emailScheduled") });
      } catch (error) {
        setStatus("error");
        onStatusChange?.("error");
        const fallback =
          error instanceof Error ? error.message : t("emailScheduling.toast.schedulingFailed");
        setToast({ open: true, message: fallback });
      }
    },
    [values, onSubmit, onStatusChange, t]
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
