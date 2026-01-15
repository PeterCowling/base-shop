import React from 'react';
import { type LucideIcon } from 'lucide-react';

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
  className = '',
  emptyMessage = 'No events yet',
}: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className={`rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-800 ${className}`}>
        <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  const formatDate = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const iconColorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
    green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300',
    red: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
    gray: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  };

  return (
    <div className={`space-y-0 ${className}`}>
      {events.map((event, index) => {
        const Icon = event.icon;
        const isLast = index === events.length - 1;
        const iconColor = event.iconColor || 'gray';

        return (
          <div key={event.id} className="relative flex gap-4 pb-8">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-5 top-10 h-full w-0.5 bg-slate-200 dark:bg-slate-700" />
            )}

            {/* Icon */}
            <div className="relative z-10 flex-shrink-0">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${iconColorClasses[iconColor]}`}
              >
                {Icon ? <Icon className="h-5 w-5" /> : null}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {event.title}
                  </h4>

                  {event.description && (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {event.description}
                    </p>
                  )}

                  {event.user && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                      by {event.user}
                    </p>
                  )}

                  {event.metadata && <div className="mt-2">{event.metadata}</div>}
                </div>

                {/* Timestamp */}
                <div className="flex-shrink-0 text-right">
                  {showDate && (
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      {formatDate(event.timestamp)}
                    </p>
                  )}
                  {showTime && (
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      {formatTime(event.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
