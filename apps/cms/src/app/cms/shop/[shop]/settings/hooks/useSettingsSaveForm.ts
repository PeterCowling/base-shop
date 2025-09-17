import {
  useServiceEditorForm,
  type UseServiceEditorFormOptions,
} from "./useServiceEditorForm";

export type UseSettingsSaveFormOptions<TResult> = UseServiceEditorFormOptions<TResult>;

export function useSettingsSaveForm<TResult>(
  options: UseSettingsSaveFormOptions<TResult>,
) {
  return useServiceEditorForm(options);
}

export default useSettingsSaveForm;
