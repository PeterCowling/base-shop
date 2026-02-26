import { memo } from "react";

interface StatPanelProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

export const StatPanel = memo(function StatPanel({
  label,
  value,
  icon,
}: StatPanelProps) {
  return (
    <div className="bg-surface-2 rounded-lg p-4 flex items-center gap-4">
      {icon != null && <div className="shrink-0">{icon}</div>}
      <div>
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
        <div className="text-2xl font-semibold text-foreground">
          {value ?? "—"}
        </div>
      </div>
    </div>
  );
});
