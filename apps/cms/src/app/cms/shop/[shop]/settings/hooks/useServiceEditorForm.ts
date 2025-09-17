"use client";

import { useCallback, useState } from "react";
import type { ActionStatus } from "@/app/cms/components/actionResult";

export type ServiceEditorErrors = Record<string, string[]>;

export interface ServiceEditorToast {
  open: boolean;
  status: ActionStatus;
  message: string;
}

const defaultToast: ServiceEditorToast = {
  open: false,
  status: "success",
  message: "",
};

export const toastStyles: Record<ActionStatus, string> = {
  success: "bg-primary text-primary-foreground",
  error: "bg-destructive text-destructive-foreground",
};

interface UseServiceEditorFormOptions<Result> {
  submit: (formData: FormData) => Promise<Result>;
  successMessage: string;
  errorMessage?: string;
  parseErrors?: (result: Result) => ServiceEditorErrors | undefined;
  onSuccess?: (result: Result) => void;
  validate?: (formData: FormData) => ServiceEditorErrors | undefined;
}

export function useServiceEditorForm<Result>({
  submit,
  successMessage,
  errorMessage = "Unable to save changes.",
  parseErrors,
  onSuccess,
  validate,
}: UseServiceEditorFormOptions<Result>) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ServiceEditorErrors>({});
  const [toast, setToast] = useState<ServiceEditorToast>(defaultToast);

  const closeToast = useCallback(() => {
    setToast((current) => ({ ...current, open: false }));
  }, []);

  const run = useCallback(
    async (formData: FormData): Promise<Result | undefined> => {
      setSaving(true);
      setErrors({});

      try {
        const validationErrors = validate?.(formData);
        if (validationErrors && Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          setToast({ open: true, status: "error", message: errorMessage });
          return undefined;
        }

        const result = await submit(formData);
        const derivedErrors =
          parseErrors?.(result) ??
          (result &&
          typeof result === "object" &&
          "errors" in (result as Record<string, unknown>)
            ? ((result as { errors?: ServiceEditorErrors }).errors ?? undefined)
            : undefined);

        if (derivedErrors && Object.keys(derivedErrors).length > 0) {
          setErrors(derivedErrors);
          setToast({ open: true, status: "error", message: errorMessage });
        } else {
          onSuccess?.(result);
          setToast({ open: true, status: "success", message: successMessage });
        }

        return result;
      } catch (error) {
        console.error(error);
        setToast({ open: true, status: "error", message: errorMessage });
        return undefined;
      } finally {
        setSaving(false);
      }
    },
    [errorMessage, onSuccess, parseErrors, submit, successMessage, validate],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await run(new FormData(event.currentTarget));
    },
    [run],
  );

  return {
    saving,
    errors,
    toast,
    closeToast,
    handleSubmit,
    run,
    setErrors,
  } as const;
}
