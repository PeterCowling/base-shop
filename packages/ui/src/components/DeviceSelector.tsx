import { DesktopIcon, LaptopIcon, MobileIcon } from "@radix-ui/react-icons";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./atoms/shadcn";
import { devicePresets, getLegacyPreset } from "../utils/devicePresets";

interface Props {
  deviceId: string;
  setDeviceId: (id: string) => void;
}

export default function DeviceSelector({ deviceId, setDeviceId }: Props) {
  return (
    <div className="flex justify-start gap-2">
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
          {devicePresets.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

