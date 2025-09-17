"use client";

import { useCallback, type FormEvent } from "react";

import {
  useServiceEditorForm,
  type UseServiceEditorFormOptions,
} from "./useServiceEditorForm";

export interface UseSettingsSaveFormOptions<TResult>
  extends UseServiceEditorFormOptions<TResult> {
  normalizeFormData?: (formData: FormData) => FormData | Promise<FormData>;
}

export function useSettingsSaveForm<TResult>({
  normalizeFormData,
  ...options
}: UseSettingsSaveFormOptions<TResult>) {
  const { submit: baseSubmit, ...rest } = useServiceEditorForm(options);

  const submit = useCallback(
    async (formData: FormData) => {
      const normalized = normalizeFormData
        ? await normalizeFormData(formData)
        : formData;
      return baseSubmit(normalized);
    },
    [baseSubmit, normalizeFormData],
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
    ...rest,
    submit,
    handleSubmit,
  };
}

export default useSettingsSaveForm;
