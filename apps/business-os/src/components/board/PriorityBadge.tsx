import type { Priority } from "@/lib/types";

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityStyles: Record<Priority, { bg: string; text: string }> = {
  P0: { bg: "bg-red-100", text: "text-red-800" },
  P1: { bg: "bg-orange-100", text: "text-orange-800" },
  P2: { bg: "bg-yellow-100", text: "text-yellow-800" },
  P3: { bg: "bg-blue-100", text: "text-blue-800" },
  P4: { bg: "bg-gray-100", text: "text-gray-800" },
  P5: { bg: "bg-gray-100", text: "text-gray-600" },
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
