"use client";
// (no additional shadcn imports needed)
import { useEffect, useMemo, useState } from "react";
import { DesktopIcon, LaptopIcon, MobileIcon } from "@radix-ui/react-icons";

import { useTranslations } from "@acme/i18n";

import {
  type DevicePreset,
  devicePresets,
  getCustomDevicePresets,
  getLegacyPreset,
} from "../../utils/devicePresets";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../atoms/shadcn";

interface Props {
  deviceId: string;
  onChange: (id: string) => void;
  showLegacyButtons?: boolean;
  /** Additional devices to include in the dropdown (e.g., page breakpoints). */
  extraDevices?: DevicePreset[];
  /** Hide the quick device icon buttons on small screens to save space. */
  compact?: boolean;
}

export default function DeviceSelector({
  deviceId,
  onChange,
  showLegacyButtons = false,
  extraDevices = [],
  compact = false,
}: Props): React.JSX.Element {
  const t = useTranslations();
  const [custom, setCustom] = useState<DevicePreset[]>([]);
  useEffect(() => {
    setCustom(getCustomDevicePresets());
  }, []);
  const allPresets = useMemo<DevicePreset[]>(() => {
    const base = [...custom, ...devicePresets];
    const map = new Map<string, DevicePreset>();
    [...base, ...extraDevices].forEach((p) => { if (!map.has(p.id)) map.set(p.id, p); });
    return Array.from(map.values());
  }, [custom, extraDevices]);
  // Note: custom device management UI removed per spec; existing custom presets
  // (if any) remain supported and will appear in the list.

  return (
    <div className="flex items-center gap-2">
      {showLegacyButtons &&
        (["desktop", "tablet", "mobile"] as const).map((type) => {
          const preset = getLegacyPreset(type);
          const Icon =
            type === "desktop" ? DesktopIcon : type === "tablet" ? LaptopIcon : MobileIcon;
          // Extract non-user-facing class names to satisfy i18n lint
          const buttonClass = compact ? "hidden sm:inline-flex" : undefined; // i18n-exempt -- DS-1234 [ttl=2025-11-30]
          return (
            <Button
              key={type}
              variant={deviceId === preset.id ? "default" : "outline"}
              size="icon"
              className={buttonClass}
              onClick={() => onChange(preset.id)}
              // Accessible name should be the lowercase legacy key
              // to satisfy tests and avoid localization variance.
              aria-label={type as string}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">
                {t(`devices.${type}`)}
              </span>
            </Button>
          );
        })}
      <Select value={deviceId} onValueChange={onChange}>
        <SelectTrigger aria-label={t("devices.selectLabel") as string} className="w-28 sm:w-36">
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
      {null}
    </div>
  );
}
