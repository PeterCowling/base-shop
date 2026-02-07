import { Button } from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";

interface LinkedGlobalNoticeProps {
  globalId?: string;
  linkedLabel: string | null;
  onEditGlobally: () => void;
  onUnlink: () => void;
}

const LinkedGlobalNotice = ({ globalId, linkedLabel, onEditGlobally, onUnlink }: LinkedGlobalNoticeProps) => {
  const t = useTranslations();
  if (!globalId || !linkedLabel) return null;

  return (
    <div
      className="flex items-center justify-between gap-2 rounded border bg-muted/60 px-2 py-1 text-xs"
      title={t("This block is linked to a Global template") as string}
    >
      <div className="truncate">
        {t("Linked to Global:")}{" "}
        <span className="font-medium">{linkedLabel}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" className="h-7 px-2 text-xs" onClick={onEditGlobally}>
          {t("Edit globally")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={onUnlink}
          title={t("Unlink from Global") as string}
        >
          {t("Unlink")}
        </Button>
      </div>
    </div>
  );
};

export default LinkedGlobalNotice;
