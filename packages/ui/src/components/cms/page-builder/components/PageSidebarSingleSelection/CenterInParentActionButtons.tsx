import { Tooltip } from "../../../../atoms";
import { Button } from "../../../../atoms/shadcn";

interface CenterInParentActionButtonsProps {
  onCenterX: () => void;
  onCenterY: () => void;
}

const CenterInParentActionButtons = ({ onCenterX, onCenterY }: CenterInParentActionButtonsProps) => (
  <div className="flex flex-wrap gap-2">
    <Tooltip text="Center horizontally in parent (absolute only)">
      <Button type="button" variant="outline" aria-label="Center horizontally in parent" onClick={onCenterX}>
        Center H in parent
      </Button>
    </Tooltip>
    <Tooltip text="Center vertically in parent (absolute only)">
      <Button type="button" variant="outline" aria-label="Center vertically in parent" onClick={onCenterY}>
        Center V in parent
      </Button>
    </Tooltip>
  </div>
);

export default CenterInParentActionButtons;
