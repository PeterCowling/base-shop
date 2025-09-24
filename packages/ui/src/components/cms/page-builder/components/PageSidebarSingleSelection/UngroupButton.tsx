import { Tooltip } from "../../../../atoms";
import { Button } from "../../../../atoms/shadcn";

interface UngroupButtonProps {
  show: boolean;
  onUngroup: () => void;
}

const UngroupButton = ({ show, onUngroup }: UngroupButtonProps) => {
  if (!show) return null;

  return (
    <Tooltip text="Ungroup children from container">
      <Button type="button" variant="outline" onClick={onUngroup}>
        Ungroup
      </Button>
    </Tooltip>
  );
};

export default UngroupButton;
