import React from "react";
import { type LucideIcon } from "lucide-react";
import { useTranslations } from "@acme/i18n";
import { Cluster, Inline, Stack } from "../../../atoms/primitives";
import { cn } from "../../../../utils/style/cn";

export interface TimelineEvent {
  id: string;
  timestamp: Date | string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  user?: string;
  metadata?: React.ReactNode;
}

export interface TimelineProps {
  events: TimelineEvent[];
  showTime?: boolean;
  showDate?: boolean;
  className?: string;
  emptyMessage?: string;
}

/**
 * Timeline component for activity/audit trail visualization
 *
 * Features:
 * - Chronological event display
 * - Custom icons per event
 * - Color-coded status indicators
 * - Optional timestamps
 * - User attribution
 * - Custom metadata support
 * - Empty state handling
 *
 * @example
 * ```tsx
 * <Timeline
 *   events={[
 *     {
 *       id: '1',
 *       timestamp: new Date(),
 *       title: 'Order created',
 *       description: 'New order #1234',
 *       icon: Package,
 *       iconColor: 'blue',
 *       user: 'John Doe'
 *     }
 *   ]}
 *   showTime
 *   showDate
 * />
 * ```
 */
export function Timeline({
  events,
  showTime = true,
  showDate = false,
  className = "",
  emptyMessage,
}: TimelineProps) {
  const t = useTranslations();
  const resolvedEmptyMessage = emptyMessage ?? t("timeline.empty");
  if (events.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border-1 bg-surface-2 px-4 py-8 text-center",
          className
        )}
      >
        <p className="text-sm text-muted">{resolvedEmptyMessage}</p>
      </div>
    );
  }

  const formatDate = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const iconColorClasses = {
    blue: "bg-info-soft text-info-foreground",
    green: "bg-success-soft text-success-foreground",
    yellow: "bg-warning-soft text-warning-foreground",
    red: "bg-danger-soft text-danger-foreground",
    gray: "bg-muted text-muted",
  };

  return (
    <Stack gap={0} className={cn(className)}>
      {events.map((event, index) => {
        const Icon = event.icon;
        const isLast = index === events.length - 1;
        const iconColor = event.iconColor || "gray";

        return (
          <div key={event.id} className={cn(!isLast && "pb-8")}>
            <div className="relative">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute start-5 top-10 h-full w-0.5 bg-border-2" />
              )}

              <Inline gap={4} alignY="start" wrap={false} className="relative">
              {/* Icon */}
              <div className="shrink-0">
                <div
                  className={cn(
                    "inline-grid h-10 w-10 place-items-center rounded-full",
                    iconColorClasses[iconColor]
                  )}
                >
                  {Icon ? <Icon className="h-5 w-5" /> : null}
                </div>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pt-1">
                <Cluster alignY="start" justify="between" className="gap-4">
                  <Stack gap={2} className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium text-fg">
                      {event.title}
                    </h4>

                    {event.description && (
                      <p className="text-sm text-muted">{event.description}</p>
                    )}

                    {event.user && (
                      <p className="text-xs text-muted">
                        {t("timeline.byUser", { user: event.user })}
                      </p>
                    )}

                    {event.metadata && <div>{event.metadata}</div>}
                  </Stack>

                  {/* Timestamp */}
                  <Stack gap={1} className="shrink-0 text-end">
                    {showDate && (
                      <p className="text-xs text-muted">
                        {formatDate(event.timestamp)}
                      </p>
                    )}
                    {showTime && (
                      <p className="text-xs text-muted">
                        {formatTime(event.timestamp)}
                      </p>
                    )}
                  </Stack>
                </Cluster>
              </div>
              </Inline>
            </div>
          </div>
        );
      })}
    </Stack>
  );
}
