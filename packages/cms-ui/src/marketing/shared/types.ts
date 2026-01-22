export type SubmissionStatus =
  | "idle"
  | "validating"
  | "submitting"
  | "success"
  | "error";

export type ValidationErrors<TField extends string = string> = Partial<
  Record<TField, string | undefined>
>;

export type AsyncSubmissionHandler<TValues> = (
  values: TValues
) => Promise<void> | void;

export interface PreviewUpdate<TPreview> {
  data: TPreview;
  /** When available we surface granular changes for analytics */
  changedKeys?: readonly string[];
}
