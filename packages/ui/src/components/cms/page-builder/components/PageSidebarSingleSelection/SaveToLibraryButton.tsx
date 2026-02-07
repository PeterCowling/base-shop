import { useTranslations } from "@acme/i18n";

import { Tooltip } from "../../../../atoms";
import { Button } from "../../../../atoms/shadcn";

interface SaveToLibraryButtonProps {
  onSave: () => void;
}

const SaveToLibraryButton = ({ onSave }: SaveToLibraryButtonProps) => {
  const t = useTranslations();
  return (
    <Tooltip text={t("Save selected blocks as a reusable snippet")}>
      <Button type="button" variant="outline" onClick={onSave}>
        {t("Save to My Library")}
      </Button>
    </Tooltip>
  );
};

export default SaveToLibraryButton;
