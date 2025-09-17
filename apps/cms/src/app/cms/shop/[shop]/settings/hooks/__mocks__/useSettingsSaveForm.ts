import { useCallback, useMemo, useState, type FormEvent } from "react";

import type {
  UseSettingsSaveFormOptions,
  ValidationErrors,
} from "../useSettingsSaveForm";

type ToastStatus = "success" | "error";

interface ToastLogEntry {
  status: ToastStatus;
  message: string;
}

const submitMock = jest.fn<void, [FormData]>();
const toastLog: ToastLogEntry[] = [];

export function __resetUseSettingsSaveFormMock() {
  submitMock.mockReset();
  toastLog.length = 0;
}

export function __getUseSettingsSaveFormSubmitMock() {
  return submitMock;
}

export function __getUseSettingsSaveFormToastLog() {
  return toastLog;
}

export const useSettingsSaveForm = <TResult,>(
  options: UseSettingsSaveFormOptions<TResult>,
) => {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [toast, setToast] = useState({
    open: false,
    status: "success" as ToastStatus,
    message: "",
  });

  const announce = useCallback((status: ToastStatus, message: string) => {
    toastLog.push({ status, message });
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

  const submit = useCallback(
    async (formData: FormData) => {
      submitMock(formData);
      setSaving(true);
      try {
        const result = await options.action(formData);
        const normalizedErrors =
          options.normalizeErrors?.(result) ??
          ((result && typeof result === "object" && "errors" in result
            ? ((result as { errors?: ValidationErrors }).errors ?? {})
            : {}) as ValidationErrors);

        if (normalizedErrors && Object.keys(normalizedErrors).length > 0) {
          setErrors(normalizedErrors);
          announceError(options.errorMessage ?? "Unable to save settings.");
          options.onError?.(result);
          return { ok: false as const, result };
        }

        setErrors({});
        options.onSuccess?.(result);
        announceSuccess(options.successMessage ?? "Settings saved.");
        return { ok: true as const, result };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : options.errorMessage ?? "Unable to save settings.";
        announceError(message);
        return { ok: false as const, error };
      } finally {
        setSaving(false);
      }
    },
    [announceError, announceSuccess, options],
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
      ? "mock-error-toast"
      : "mock-success-toast";
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
};

export default useSettingsSaveForm;

export type {
  ValidationErrors,
  UseSettingsSaveFormOptions,
} from "../useSettingsSaveForm";
