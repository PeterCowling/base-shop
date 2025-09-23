"use client";
import { DesktopIcon, LaptopIcon, MobileIcon } from "@radix-ui/react-icons";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../atoms/shadcn";
import {
  devicePresets,
  getLegacyPreset,
  type DevicePreset,
  getAllDevicePresets,
  getCustomDevicePresets,
  saveCustomDevicePresets,
} from "../../utils/devicePresets";
// (no additional shadcn imports needed)
import { useEffect, useMemo, useState } from "react";

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
  const [custom, setCustom] = useState<DevicePreset[]>([]);
  useEffect(() => {
    setCustom(getCustomDevicePresets());
  }, []);
  const allPresets = useMemo<DevicePreset[]>(() => {
    const base = [...getCustomDevicePresets(), ...devicePresets];
    const map = new Map<string, DevicePreset>();
    [...base, ...extraDevices].forEach((p) => { if (!map.has(p.id)) map.set(p.id, p); });
    return Array.from(map.values());
  }, [custom, extraDevices]);
  // Note: custom device management UI removed per spec; existing custom presets
  // (if any) remain supported and will appear in the list.

  return (
    <div className="flex items-center gap-2">
      {showLegacyButtons &&
        (["desktop", "tablet", "mobile"] as const).map((t) => {
          const preset = getLegacyPreset(t);
          const Icon =
            t === "desktop" ? DesktopIcon : t === "tablet" ? LaptopIcon : MobileIcon;
          return (
            <Button
              key={t}
              variant={deviceId === preset.id ? "default" : "outline"}
              size="icon"
              className={compact ? "hidden sm:inline-flex" : undefined}
              onClick={() => onChange(preset.id)}
              aria-label={t}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </span>
            </Button>
          );
        })}
      <Select value={deviceId} onValueChange={onChange}>
        <SelectTrigger aria-label="Device" className="w-28 sm:w-36">
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
