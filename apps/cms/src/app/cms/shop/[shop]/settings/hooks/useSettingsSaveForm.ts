"use client";

import { type FormEvent,useCallback, useMemo, useState } from "react";

export type ValidationErrors = Record<string, string[]>;

type ToastStatus = "success" | "error";

interface ToastState {
  open: boolean;
  status: ToastStatus;
  message: string;
}

interface SubmitResult<TResult> {
  ok: boolean;
  result?: TResult;
  error?: unknown;
}

const DEFAULT_SUCCESS_MESSAGE = "Settings saved.";
const DEFAULT_ERROR_MESSAGE = "Unable to save settings.";

type ServiceAction<TResult> = (formData: FormData) => Promise<TResult>;

type SuccessHandler<TResult> = (result: TResult) => void;

type ErrorHandler<TResult> = (result: TResult) => void;

type ErrorNormalizer<TResult> = (result: TResult) => ValidationErrors | undefined;

const defaultNormalizeErrors: ErrorNormalizer<unknown> = (result) => {
  if (result && typeof result === "object" && "errors" in result) {
    const errors = (result as { errors?: ValidationErrors }).errors;
    if (errors && Object.keys(errors).length > 0) {
      return errors;
    }
  }
  return undefined;
};

export interface UseSettingsSaveFormOptions<TResult> {
  action: ServiceAction<TResult>;
  onSuccess?: SuccessHandler<TResult>;
  onError?: ErrorHandler<TResult>;
  successMessage?: string;
  errorMessage?: string;
  normalizeErrors?: ErrorNormalizer<TResult>;
}

export function useSettingsSaveForm<TResult>({
  action,
  onSuccess,
  onError,
  successMessage = DEFAULT_SUCCESS_MESSAGE,
  errorMessage = DEFAULT_ERROR_MESSAGE,
  normalizeErrors,
}: UseSettingsSaveFormOptions<TResult>) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [toast, setToast] = useState<ToastState>({
    open: false,
    status: "success",
    message: "",
  });

  const announce = useCallback((status: ToastStatus, message: string) => {
    setToast({ open: true, status, message });
  }, []);

  const announceSuccess = useCallback(
    (message: string) => announce("success", message),
    [announce],
  );

  const announceError = useCallback(
    (message: string) => announce("error", message),
    [announce],
  );

  const closeToast = useCallback(() => {
    setToast((current) => ({ ...current, open: false }));
  }, []);

  const getNormalizedErrors = normalizeErrors
    ? normalizeErrors
    : (defaultNormalizeErrors as ErrorNormalizer<TResult>);

  const submit = useCallback(
    async (formData: FormData): Promise<SubmitResult<TResult>> => {
      setSaving(true);
      try {
        const result = await action(formData);
        const validationErrors = getNormalizedErrors(result) ?? {};

        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          announceError(errorMessage);
          onError?.(result);
          return { ok: false, result };
        }

        setErrors({});
        onSuccess?.(result);
        announceSuccess(successMessage);
        return { ok: true, result };
      } catch (error) {
        const message = error instanceof Error ? error.message : errorMessage;
        announceError(message);
        return { ok: false, error };
      } finally {
        setSaving(false);
      }
    },
    [
      action,
      announceError,
      announceSuccess,
      errorMessage,
      getNormalizedErrors,
      onError,
      onSuccess,
      successMessage,
    ],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      return submit(formData);
    },
    [submit],
  );

  const toastClassName = useMemo(() => {
    return toast.status === "error"
      ? "bg-destructive text-destructive-foreground"
      : "bg-success text-success-fg";
  }, [toast.status]);

  return {
    saving,
    errors,
    setErrors,
    submit,
    handleSubmit,
    toast,
    toastClassName,
    closeToast,
    announceSuccess,
    announceError,
  };
}

export default useSettingsSaveForm;

// Test helpers - only work when jest.mock is active
// These are re-exported from __mocks__/useSettingsSaveForm.ts
export function __resetUseSettingsSaveFormMock(): void {
  throw new Error("__resetUseSettingsSaveFormMock is only available in tests with jest.mock");
}

export function __getUseSettingsSaveFormToastLog(): { status: string; message: string }[] {
  throw new Error("__getUseSettingsSaveFormToastLog is only available in tests with jest.mock");
}
