import { AlignCenterHorizontallyIcon, AlignCenterVerticallyIcon } from "@radix-ui/react-icons";

import { Button } from "@acme/design-system/shadcn";

interface CenterInParentButtonsProps {
  onCenterX: () => void;
  onCenterY: () => void;
}

const CenterInParentButtons = ({ onCenterX, onCenterY }: CenterInParentButtonsProps) => (
  <div className="flex flex-wrap items-center gap-1">
    <Button type="button" variant="outline" size="icon" title="Center Horizontally in parent" onClick={onCenterX}>
      <AlignCenterHorizontallyIcon className="h-4 w-4" />
    </Button>
    <Button type="button" variant="outline" size="icon" title="Center Vertically in parent" onClick={onCenterY}>
      <AlignCenterVerticallyIcon className="h-4 w-4" />
    </Button>
  </div>
);

export default CenterInParentButtons;
