import { Tooltip } from "../../../../atoms";
import { Button } from "../../../../atoms/shadcn";

interface SaveToLibraryButtonProps {
  onSave: () => void;
}

const SaveToLibraryButton = ({ onSave }: SaveToLibraryButtonProps) => (
  <Tooltip text="Save selected blocks as a reusable snippet">
    <Button type="button" variant="outline" onClick={onSave}>
      Save to My Library
    </Button>
  </Tooltip>
);

export default SaveToLibraryButton;
