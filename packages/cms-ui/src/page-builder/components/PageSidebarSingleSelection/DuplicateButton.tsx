import { Button } from "@acme/design-system/shadcn";

interface DuplicateButtonProps {
  onDuplicate: () => void;
}

const DuplicateButton = ({ onDuplicate }: DuplicateButtonProps) => (
  <Button type="button" variant="outline" onClick={onDuplicate}>
    Duplicate
  </Button>
);

export default DuplicateButton;
