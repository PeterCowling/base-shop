import { Tag } from "@ui/components/atoms";
import { Button } from "@/components/atoms/shadcn";
import { useTranslations } from "@acme/i18n";

interface TelemetryHeaderProps {
  onReload?: () => void | Promise<void>;
}

export function TelemetryHeader({ onReload }: TelemetryHeaderProps) {
  const t = useTranslations();
  return (
    <header className="space-y-3">
      <Tag variant="default" className="bg-info/10 text-foreground">
        {t("cms.telemetry.analytics")}
      </Tag>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h2 className="text-2xl font-semibold text-foreground">{t("cms.telemetry.liveProductSignals")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("cms.telemetry.headerHelp")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0 border-border/30 text-foreground hover:bg-surface-3"
          onClick={() => onReload?.()}
        >
          {t("cms.telemetry.refreshData")}
        </Button>
      </div>
    </header>
  );
}
