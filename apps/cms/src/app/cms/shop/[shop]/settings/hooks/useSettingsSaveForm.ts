"use client";

import { type FormEvent,useCallback, useState } from "react";

import { useToast } from "@acme/ui/operations";

export type ValidationErrors = Record<string, string[]>;

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
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const announceSuccess = useCallback(
    (message: string) => { toast.success(message); },
    [toast],
  );

  const announceError = useCallback(
    (message: string) => { toast.error(message); },
    [toast],
  );

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

  return {
    saving,
    errors,
    setErrors,
    submit,
    handleSubmit,
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
