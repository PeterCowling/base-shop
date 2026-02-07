import { Tooltip } from "@acme/design-system/atoms";
import { Button } from "@acme/design-system/shadcn";

interface UngroupButtonProps {
  show: boolean;
  onUngroup: () => void;
}

const UngroupButton = ({ show, onUngroup }: UngroupButtonProps) => {
  if (!show) return null;

  return (
    <Tooltip text={"Ungroup children from container" /* i18n-exempt -- PB-2412: editor-only tooltip */}>
      <Button type="button" variant="outline" onClick={onUngroup}>
        {/* i18n-exempt -- PB-2412: editor-only action label */}
        Ungroup
      </Button>
    </Tooltip>
  );
};

export default UngroupButton;
