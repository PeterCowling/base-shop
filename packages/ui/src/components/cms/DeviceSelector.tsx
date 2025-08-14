"use client";

import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../atoms/shadcn";
import {
  DesktopIcon,
  LaptopIcon,
  MobileIcon,
  RotateCounterClockwiseIcon,
} from "@radix-ui/react-icons";
import { devicePresets, getLegacyPreset } from "@ui/utils/devicePresets";

interface Props {
  deviceId: string;
  onDeviceChange: (id: string) => void;
  onRotate: () => void;
}

const DeviceSelector = ({ deviceId, onDeviceChange, onRotate }: Props) => (
  <div className="flex gap-2">
    {(["desktop", "tablet", "mobile"] as const).map((t) => {
      const preset = getLegacyPreset(t);
      const Icon =
        t === "desktop" ? DesktopIcon : t === "tablet" ? LaptopIcon : MobileIcon;
      return (
        <Button
          key={t}
          variant={deviceId === preset.id ? "default" : "outline"}
          onClick={() => onDeviceChange(preset.id)}
          aria-label={t}
        >
          <Icon />
          <span className="sr-only">
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </span>
        </Button>
      );
    })}
    <Select value={deviceId} onValueChange={onDeviceChange}>
      <SelectTrigger aria-label="Device" className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {devicePresets.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <Button variant="outline" onClick={onRotate} aria-label="Rotate">
      <RotateCounterClockwiseIcon />
    </Button>
  </div>
);

export default DeviceSelector;

