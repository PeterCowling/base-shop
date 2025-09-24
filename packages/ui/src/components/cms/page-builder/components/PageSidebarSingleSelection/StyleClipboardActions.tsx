import { Button } from "../../../../atoms/shadcn";

interface StyleClipboardActionsProps {
  onCopy: () => void;
  onPaste: () => void;
}

const StyleClipboardActions = ({ onCopy, onPaste }: StyleClipboardActionsProps) => (
  <div className="flex flex-wrap gap-2">
    <Button type="button" variant="outline" onClick={onCopy} aria-label="Copy styles">
      Copy Styles
    </Button>
    <Button type="button" variant="outline" onClick={onPaste} aria-label="Paste styles">
      Paste Styles
    </Button>
  </div>
);

export default StyleClipboardActions;
