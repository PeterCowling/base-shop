"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@ui/components/atoms";
import DeviceSelector from "@ui/components/common/DeviceSelector";
import { ReloadIcon } from "@radix-ui/react-icons";
import { usePreviewDevice } from "@ui/hooks";
import { devicePresets, type DevicePreset } from "@ui/utils/devicePresets";

interface Props {
  onChange?: (device: DevicePreset) => void;
  showRotate?: boolean;
}

export default function PreviewDeviceSelector({ onChange, showRotate = false }: Props) {
  const [deviceId, setDeviceId] = usePreviewDevice(devicePresets[0].id);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );

  const device = useMemo<DevicePreset>(() => {
    const preset =
      devicePresets.find((d: DevicePreset) => d.id === deviceId) ??
      devicePresets[0];
    return orientation === "portrait"
      ? { ...preset, orientation }
      : {
          ...preset,
          width: preset.height,
          height: preset.width,
          orientation,
        };
  }, [deviceId, orientation]);

  useEffect(() => {
    onChange?.(device);
  }, [device, onChange]);

  return (
    <div className="flex justify-end gap-2">
      <DeviceSelector
        deviceId={deviceId}
        onChange={(id: string) => {
          setDeviceId(id);
          setOrientation("portrait");
        }}
        showLegacyButtons
      />
      {showRotate && (
        <Button
          variant="outline"
          onClick={() =>
            setOrientation((o) => (o === "portrait" ? "landscape" : "portrait"))
          }
          aria-label="Rotate"
        >
          <ReloadIcon
            className={orientation === "landscape" ? "rotate-90" : ""}
          />
        </Button>
      )}
    </div>
  );
}
