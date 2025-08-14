import { ReloadIcon } from "@radix-ui/react-icons";
import { Button } from "../atoms/shadcn";
import DeviceSelectorCommon from "../common/DeviceSelector";

interface Props {
  deviceId: string;
  orientation: "portrait" | "landscape";
  setDeviceId: (id: string) => void;
  toggleOrientation: () => void;
  showLegacyButtons?: boolean;
}

export default function DeviceSelector({
  deviceId,
  orientation,
  setDeviceId,
  toggleOrientation,
  showLegacyButtons,
}: Props): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <DeviceSelectorCommon
        deviceId={deviceId}
        onChange={setDeviceId}
        showLegacyButtons={showLegacyButtons}
      />
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

