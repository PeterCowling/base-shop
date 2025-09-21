"use client";

import { DesktopIcon, LaptopIcon, MobileIcon } from "@radix-ui/react-icons";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./atoms/shadcn";
import { getLegacyPreset, type DevicePreset, getAllDevicePresets } from "../utils/devicePresets";
import { useMemo } from "react";

interface DeviceSelectorProps {
  deviceId: string;
  setDeviceId: (id: string) => void;
}

export default function DeviceSelector({
  deviceId,
  setDeviceId,
}: DeviceSelectorProps) {
  const allPresets = useMemo(() => getAllDevicePresets(), []);
  return (
    <div className="flex justify-center gap-2">
      {(["desktop", "tablet", "mobile"] as const).map((t) => {
        const preset = getLegacyPreset(t);
        const Icon =
          t === "desktop" ? DesktopIcon : t === "tablet" ? LaptopIcon : MobileIcon;
        return (
          <Button
            key={t}
            variant={deviceId === preset.id ? "default" : "outline"}
            onClick={() => setDeviceId(preset.id)}
            aria-label={t}
          >
            <Icon />
            <span className="sr-only">
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </span>
          </Button>
        );
      })}
      <Select value={deviceId} onValueChange={setDeviceId}>
        <SelectTrigger aria-label="Device" className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allPresets.map((p: DevicePreset) => (
            <SelectItem key={p.id} value={p.id}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
