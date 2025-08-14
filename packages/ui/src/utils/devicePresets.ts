export type DevicePreset = {
  id: string;
  label: string;
  width: number;
  height: number;
  type: "desktop" | "tablet" | "mobile";
  orientation: "portrait" | "landscape";
};

export const devicePresets: DevicePreset[] = [
  {
    id: "desktop-1280",
    label: "Desktop 1280",
    width: 1280,
    height: 800,
    type: "desktop",
    orientation: "portrait",
  },
  {
    id: "desktop-1440",
    label: "Desktop 1440",
    width: 1440,
    height: 900,
    type: "desktop",
    orientation: "portrait",
  },
  {
    id: "ipad",
    label: "iPad",
    width: 768,
    height: 1024,
    type: "tablet",
    orientation: "portrait",
  },
  {
    id: "ipad-pro",
    label: "iPad Pro",
    width: 1024,
    height: 1366,
    type: "tablet",
    orientation: "portrait",
  },
  {
    id: "ipad-mini",
    label: "iPad Mini",
    width: 744,
    height: 1133,
    type: "tablet",
    orientation: "portrait",
  },
  {
    id: "iphone-se",
    label: "iPhone SE",
    width: 375,
    height: 667,
    type: "mobile",
    orientation: "portrait",
  },
  {
    id: "iphone-12",
    label: "iPhone 12",
    width: 390,
    height: 844,
    type: "mobile",
    orientation: "portrait",
  },
  {
    id: "iphone-14",
    label: "iPhone 14",
    width: 390,
    height: 844,
    type: "mobile",
    orientation: "portrait",
  },
  {
    id: "pixel-7",
    label: "Pixel 7",
    width: 412,
    height: 915,
    type: "mobile",
    orientation: "portrait",
  },
  {
    id: "galaxy-note",
    label: "Galaxy Note",
    width: 412,
    height: 869,
    type: "mobile",
    orientation: "portrait",
  },
  {
    id: "galaxy-s8",
    label: "Galaxy S8",
    width: 360,
    height: 740,
    type: "mobile",
    orientation: "portrait",
  },
];

export function getLegacyPreset(
  type: "desktop" | "tablet" | "mobile"
): DevicePreset {
  const preset = devicePresets.find((p) => p.type === type) || devicePresets[0];
  return { ...preset };
}

export default devicePresets;
