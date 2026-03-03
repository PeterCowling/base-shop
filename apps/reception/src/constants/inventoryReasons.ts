export type VarianceReasonCode =
  | "Scarto"
  | "Consumo staff"
  | "Rottura"
  | "Furto"
  | "Altro";

export const VARIANCE_REASON_CODES: ReadonlyArray<{
  value: VarianceReasonCode;
  label: string;
}> = [
  { value: "Scarto", label: "Scarto" },
  { value: "Consumo staff", label: "Consumo staff" },
  { value: "Rottura", label: "Rottura" },
  { value: "Furto", label: "Furto" },
  { value: "Altro", label: "Altro" },
];
