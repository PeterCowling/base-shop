"use client";

import {
  useServiceEditorForm,
  type UseServiceEditorFormOptions,
} from "./useServiceEditorForm";

export function useSettingsSaveForm<TResult>(
  options: UseServiceEditorFormOptions<TResult>,
) {
  const { closeToast, ...rest } = useServiceEditorForm(options);

  return {
    ...rest,
    dismissToast: closeToast,
  };
}

export type { ValidationErrors } from "./useServiceEditorForm";
export type { UseServiceEditorFormOptions as UseSettingsSaveFormOptions } from "./useServiceEditorForm";

export default useSettingsSaveForm;
