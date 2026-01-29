/**
 * Format a date string to a human-readable format
 * For display in compact card views
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Show relative time for recent dates
  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}w ago`;
  }

  // For older dates, show absolute date
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Format due date for display
 * BOS-UX-07
 */
export function formatDueDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Get color class for due date based on how soon it's due
 * BOS-UX-07
 */
export function getDueDateColor(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day

  const dueDate = new Date(date);
  dueDate.setHours(0, 0, 0, 0); // Reset to start of day

  const diffMs = dueDate.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Overdue (past today)
  if (diffDays < 0) {
    return "text-danger";
  }

  // Due soon (within 7 days)
  if (diffDays <= 7) {
    return "text-warning";
  }

  // Normal (future)
  return "text-muted-foreground";
}

/**
 * Extract initials from a person's name
 * BOS-UX-07
 */
export function getOwnerInitials(ownerName: string): string {
  return ownerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
