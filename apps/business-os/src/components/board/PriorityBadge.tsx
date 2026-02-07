import type { Priority } from "@/lib/types";

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityStyles: Record<Priority, { bg: string; text: string }> = {
  P0: { bg: "bg-danger-soft", text: "text-danger-foreground" },
  P1: { bg: "bg-warning-soft", text: "text-warning-foreground" },
  P2: { bg: "bg-warning/20", text: "text-warning-foreground" },
  P3: { bg: "bg-info-soft", text: "text-info-foreground" },
  P4: { bg: "bg-muted", text: "text-muted-foreground" },
  P5: { bg: "bg-surface-2", text: "text-muted-foreground" },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const styles = priorityStyles[priority];

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded font-medium ${styles.bg} ${styles.text}`}
    >
      {priority}
    </span>
  );
}
