import { Tooltip } from "@acme/design-system/atoms";
import { Button } from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";

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
