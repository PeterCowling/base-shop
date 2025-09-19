import { Tag } from "@ui/components/atoms";
import { Button } from "@/components/atoms/shadcn";

interface TelemetryHeaderProps {
  onReload?: () => void | Promise<void>;
}

export function TelemetryHeader({ onReload }: TelemetryHeaderProps) {
  return (
    <header className="space-y-3">
      <Tag variant="default" className="bg-sky-500/10 text-foreground">
        Telemetry analytics
      </Tag>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-foreground">Live product signals</h2>
          <p className="text-sm text-muted-foreground">
            Track your key interactions in real time, compare spikes, and lock
            filters you love as presets.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-border/30 text-foreground hover:bg-muted/10"
          onClick={() => onReload?.()}
        >
          Refresh data
        </Button>
      </div>
    </header>
  );
}
