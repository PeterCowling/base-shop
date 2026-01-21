import { useTranslations } from "@acme/i18n";

import { Tooltip } from "../../../../atoms";
import { Button } from "../../../../atoms/shadcn";

interface CenterInParentActionButtonsProps {
  onCenterX: () => void;
  onCenterY: () => void;
}

const CenterInParentActionButtons = ({ onCenterX, onCenterY }: CenterInParentActionButtonsProps) => {
  const t = useTranslations();
  return (
    <div className="flex flex-wrap gap-2">
      <Tooltip text={t("Center horizontally in parent (absolute only)") as string}>
        <Button type="button" variant="outline" aria-label={t("Center horizontally in parent") as string} onClick={onCenterX}>
          {t("Center H in parent")}
        </Button>
      </Tooltip>
      <Tooltip text={t("Center vertically in parent (absolute only)") as string}>
        <Button type="button" variant="outline" aria-label={t("Center vertically in parent") as string} onClick={onCenterY}>
          {t("Center V in parent")}
        </Button>
      </Tooltip>
    </div>
  );
};

export default CenterInParentActionButtons;
