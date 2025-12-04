"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "@acme/i18n";

import {
  defaultDiscountValues,
  getDiscountPreview,
  type DiscountFormValues,
  type DiscountPreviewData,
} from "../types";
import {
  type AsyncSubmissionHandler,
  type SubmissionStatus,
  type ValidationErrors,
} from "../../shared";

export type DiscountField = keyof DiscountFormValues;
export type DiscountErrors = ValidationErrors<DiscountField>;

export interface UseDiscountFormStateOptions {
  defaultValues?: Partial<DiscountFormValues>;
  validationErrors?: DiscountErrors;
  onSubmit?: AsyncSubmissionHandler<DiscountFormValues>;
  onPreviewChange?: (preview: DiscountPreviewData) => void;
  onStatusChange?: (status: SubmissionStatus) => void;
}

export type DiscountFormUpdater = <K extends DiscountField>(
  key: K,
  value: DiscountFormValues[K]
) => void;

interface DiscountToastState {
  open: boolean;
  message: string;
}

function validate(values: DiscountFormValues): DiscountErrors {
  const t = (s: string) => s; // i18n-exempt: pure validation helper; hook adds i18n to surfaced messages
  const errors: DiscountErrors = {};
  if (!values.code) errors.code = t("Promo code is required.");
  if (values.value <= 0) errors.value = t("Discount must be greater than zero.");
  if (values.minPurchase < 0)
    errors.minPurchase = t("Minimum purchase cannot be negative.");
  if (!values.startDate) errors.startDate = t("Start date required.");
  if (values.endDate && values.startDate && values.endDate < values.startDate) {
    errors.endDate = t("End date must be after start date.");
  }
  if (!values.appliesTo)
    errors.appliesTo = t("Describe the scope of the discount.");
  return errors;
}

export interface DiscountFormState {
  values: DiscountFormValues;
  errors: DiscountErrors;
  status: SubmissionStatus;
  toast: DiscountToastState;
  update: DiscountFormUpdater;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  dismissToast: () => void;
}

export function useDiscountFormState({
  defaultValues,
  validationErrors,
  onSubmit,
  onPreviewChange,
  onStatusChange,
}: UseDiscountFormStateOptions): DiscountFormState {
  const t = useTranslations();
  const [values, setValues] = useState<DiscountFormValues>({
    ...defaultDiscountValues,
    ...defaultValues,
  });
  const [internalErrors, setInternalErrors] = useState<DiscountErrors>({});
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [toast, setToast] = useState<DiscountToastState>({ open: false, message: "" });

  useEffect(() => {
    setValues({ ...defaultDiscountValues, ...defaultValues });
  }, [defaultValues]);

  useEffect(() => {
    onPreviewChange?.(getDiscountPreview(values, t));
  }, [values, onPreviewChange, t]);

  const errors = useMemo(
    () => ({ ...internalErrors, ...(validationErrors ?? {}) }),
    [internalErrors, validationErrors]
  );

  const update: DiscountFormUpdater = useCallback((key, value) => {
    setValues((prev: DiscountFormValues) => ({ ...prev, [key]: value }));
    setInternalErrors((prev: DiscountErrors) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const dismissToast = useCallback(() => {
    setToast((prev: DiscountToastState) => ({ ...prev, open: false }));
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
          message: t("Resolve the highlighted issues before continuing.") as string,
        });
        return;
      }

      if (!onSubmit) {
        setStatus("success");
        onStatusChange?.("success");
        setToast({ open: true, message: t("Discount draft saved.") as string });
        return;
      }

      try {
        setStatus("submitting");
        onStatusChange?.("submitting");
        await onSubmit(values);
        setStatus("success");
        onStatusChange?.("success");
        setToast({ open: true, message: t("Discount saved.") as string });
      } catch (error) {
        setStatus("error");
        onStatusChange?.("error");
        const fallback =
          error instanceof Error ? error.message : (t("Unable to save discount.") as string);
        setToast({ open: true, message: fallback });
      }
    },
    [onStatusChange, onSubmit, t, values]
  );

  return {
    values,
    errors,
    status,
    toast,
    update,
    handleSubmit,
    dismissToast,
  };
}
