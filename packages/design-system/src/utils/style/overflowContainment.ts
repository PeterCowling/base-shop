export type OverflowContainmentVariant =
  | "dialogContent"
  | "menuSurface"
  | "popoverSurface"
  | "comboboxSurface"
  | "tooltipSurface"
  | "inlineNoticeSurface";

const OVERFLOW_CONTAINMENT_CLASS: Record<OverflowContainmentVariant, string> = {
  dialogContent: "overflow-x-hidden",
  menuSurface: "overflow-hidden",
  popoverSurface: "overflow-hidden",
  comboboxSurface: "overflow-hidden",
  tooltipSurface: "overflow-hidden",
  inlineNoticeSurface: "overflow-hidden",
};

export function overflowContainmentClass(variant: OverflowContainmentVariant): string {
  return OVERFLOW_CONTAINMENT_CLASS[variant];
}
