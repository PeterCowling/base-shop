"use client";

import { useMemo, useState } from "react";

import { type DevicePreset,devicePresets } from "@acme/ui/utils/devicePresets";

export function useThemePreviewDevice() {
  const [deviceId, setDeviceIdState] = useState(devicePresets[0].id);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");

  const device = useMemo<DevicePreset>(() => {
    const preset =
      devicePresets.find((d: DevicePreset) => d.id === deviceId) ?? devicePresets[0];
    return orientation === "portrait"
      ? { ...preset, orientation }
      : {
          ...preset,
          width: preset.height,
          height: preset.width,
          orientation,
        };
  }, [deviceId, orientation]);

  const setDeviceId = (id: string) => {
    setDeviceIdState(id);
    setOrientation("portrait");
  };

  const toggleOrientation = () =>
    setOrientation((o) => (o === "portrait" ? "landscape" : "portrait"));

  return { deviceId, orientation, setDeviceId, toggleOrientation, device };
}

