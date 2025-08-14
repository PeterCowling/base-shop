export type DevicePreset = {
  id: string;
  label: string;
  width: number;
  height: number;
  type: "desktop" | "tablet" | "mobile";
};

export const devicePresets: DevicePreset[] = [
  { id: "desktop-1280", label: "Desktop 1280", width: 1280, height: 800, type: "desktop" },
  { id: "desktop-1440", label: "Desktop 1440", width: 1440, height: 900, type: "desktop" },
  { id: "ipad", label: "iPad", width: 768, height: 1024, type: "tablet" },
  { id: "ipad-pro", label: "iPad Pro", width: 1024, height: 1366, type: "tablet" },
  { id: "iphone-se", label: "iPhone SE", width: 375, height: 667, type: "mobile" },
  { id: "iphone-12", label: "iPhone 12", width: 390, height: 844, type: "mobile" },
  { id: "galaxy-s8", label: "Galaxy S8", width: 360, height: 740, type: "mobile" },
  { id: "iphone-14", label: "iPhone 14", width: 390, height: 844, type: "mobile" },
  { id: "iphone-14-landscape", label: "iPhone 14 Landscape", width: 844, height: 390, type: "mobile" },
  { id: "pixel-7", label: "Pixel 7", width: 412, height: 915, type: "mobile" },
  { id: "pixel-7-landscape", label: "Pixel 7 Landscape", width: 915, height: 412, type: "mobile" },
  { id: "galaxy-note", label: "Galaxy Note", width: 412, height: 869, type: "mobile" },
  { id: "galaxy-note-landscape", label: "Galaxy Note Landscape", width: 869, height: 412, type: "mobile" },
  { id: "ipad-mini", label: "iPad Mini", width: 744, height: 1133, type: "tablet" },
  { id: "ipad-mini-landscape", label: "iPad Mini Landscape", width: 1133, height: 744, type: "tablet" },
];

export function getLegacyPreset(type: "desktop" | "tablet" | "mobile"): DevicePreset {
  return (
    devicePresets.find((p) => p.type === type) || devicePresets[0]
  );
}

export default devicePresets;
