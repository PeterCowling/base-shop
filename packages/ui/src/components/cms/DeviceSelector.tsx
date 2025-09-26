"use client";
import { ReloadIcon } from "@radix-ui/react-icons";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../atoms/shadcn";
import { devicePresets, type DevicePreset } from "../../utils/devicePresets";

interface Props {
  deviceId: string;
  orientation: "portrait" | "landscape";
  setDeviceId: (id: string) => void;
  toggleOrientation: () => void;
}

export default function DeviceSelector({
  deviceId,
  orientation,
  setDeviceId,
  toggleOrientation,
}: Props): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <Select value={deviceId} onValueChange={setDeviceId}>
        <SelectTrigger aria-label="Device" className="w-28 sm:w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {devicePresets.map((p: DevicePreset) => (
            <SelectItem key={p.id} value={p.id}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        onClick={toggleOrientation}
        aria-label="Rotate"
      >
        <ReloadIcon
          className={orientation === "landscape" ? "rotate-90" : ""}
        />
      </Button>
    </div>
  );
}
