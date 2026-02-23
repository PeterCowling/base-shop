export type OverflowContainmentVariant = "dialogContent" | "menuSurface";

const OVERFLOW_CONTAINMENT_CLASS: Record<OverflowContainmentVariant, string> = {
  dialogContent: "overflow-x-hidden",
  menuSurface: "overflow-hidden",
};

export function overflowContainmentClass(variant: OverflowContainmentVariant): string {
  return OVERFLOW_CONTAINMENT_CLASS[variant];
}
