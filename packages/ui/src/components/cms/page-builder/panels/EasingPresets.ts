// packages/ui/src/components/cms/page-builder/panels/EasingPresets.ts
export type EasingPreset = { label: string; value: string };

// Common easing curves (CSS cubic-bezier approximations)
export const easingPresets: EasingPreset[] = [
  { label: "Default", value: "__none__" }, // i18n-exempt -- PB-237: preset label
  { label: "ease", value: "ease" }, // i18n-exempt -- PB-237
  { label: "linear", value: "linear" }, // i18n-exempt -- PB-237
  { label: "ease-in", value: "ease-in" }, // i18n-exempt -- PB-237
  { label: "ease-out", value: "ease-out" }, // i18n-exempt -- PB-237
  { label: "ease-in-out", value: "ease-in-out" }, // i18n-exempt -- PB-237
  { label: "Sine In", value: "cubic-bezier(0.12, 0, 0.39, 0)" }, // i18n-exempt -- PB-237
  { label: "Sine Out", value: "cubic-bezier(0.61, 1, 0.88, 1)" }, // i18n-exempt -- PB-237
  { label: "Sine InOut", value: "cubic-bezier(0.37, 0, 0.63, 1)" }, // i18n-exempt -- PB-237
  { label: "Quad In", value: "cubic-bezier(0.11, 0, 0.5, 0)" }, // i18n-exempt -- PB-237
  { label: "Quad Out", value: "cubic-bezier(0.5, 1, 0.89, 1)" }, // i18n-exempt -- PB-237
  { label: "Quad InOut", value: "cubic-bezier(0.45, 0, 0.55, 1)" }, // i18n-exempt -- PB-237
  { label: "Cubic In", value: "cubic-bezier(0.32, 0, 0.67, 0)" }, // i18n-exempt -- PB-237
  { label: "Cubic Out", value: "cubic-bezier(0.33, 1, 0.68, 1)" }, // i18n-exempt -- PB-237
  { label: "Cubic InOut", value: "cubic-bezier(0.65, 0, 0.35, 1)" }, // i18n-exempt -- PB-237
  { label: "Quart In", value: "cubic-bezier(0.5, 0, 0.75, 0)" }, // i18n-exempt -- PB-237
  { label: "Quart Out", value: "cubic-bezier(0.25, 1, 0.5, 1)" }, // i18n-exempt -- PB-237
  { label: "Quart InOut", value: "cubic-bezier(0.76, 0, 0.24, 1)" }, // i18n-exempt -- PB-237
  { label: "Quint In", value: "cubic-bezier(0.64, 0, 0.78, 0)" }, // i18n-exempt -- PB-237
  { label: "Quint Out", value: "cubic-bezier(0.22, 1, 0.36, 1)" }, // i18n-exempt -- PB-237
  { label: "Quint InOut", value: "cubic-bezier(0.83, 0, 0.17, 1)" }, // i18n-exempt -- PB-237
  { label: "Expo In", value: "cubic-bezier(0.7, 0, 0.84, 0)" }, // i18n-exempt -- PB-237
  { label: "Expo Out", value: "cubic-bezier(0.16, 1, 0.3, 1)" }, // i18n-exempt -- PB-237
  { label: "Expo InOut", value: "cubic-bezier(0.87, 0, 0.13, 1)" }, // i18n-exempt -- PB-237
  { label: "Circ In", value: "cubic-bezier(0.55, 0, 1, 0.45)" }, // i18n-exempt -- PB-237
  { label: "Circ Out", value: "cubic-bezier(0, 0.55, 0.45, 1)" }, // i18n-exempt -- PB-237
  { label: "Circ InOut", value: "cubic-bezier(0.85, 0, 0.15, 1)" }, // i18n-exempt -- PB-237
  { label: "Back In", value: "cubic-bezier(0.36, 0, 0.66, -0.56)" }, // i18n-exempt -- PB-237
  { label: "Back Out", value: "cubic-bezier(0.34, 1.56, 0.64, 1)" }, // i18n-exempt -- PB-237
  { label: "Back InOut", value: "cubic-bezier(0.68, -0.6, 0.32, 1.6)" }, // i18n-exempt -- PB-237
];
