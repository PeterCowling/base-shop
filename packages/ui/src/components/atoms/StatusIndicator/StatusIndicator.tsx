'use client'

import { cn } from '../../../utils/style/cn'

export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance'
export type StockStatus = 'low' | 'ok' | 'high'
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled'
export type GeneralStatus = 'success' | 'warning' | 'error' | 'info' | 'neutral'

export interface StatusIndicatorProps {
  /** The status to display */
  status: RoomStatus | StockStatus | OrderStatus | GeneralStatus | string
  /** Visual variant determines the color scheme */
  variant?: 'room' | 'stock' | 'order' | 'general'
  /** Display size */
  size?: 'sm' | 'md' | 'lg'
  /** Show as dot only (no label) */
  dotOnly?: boolean
  /** Custom label override */
  label?: string
  /** Additional CSS classes */
  className?: string
}

const sizeStyles = {
  sm: {
    dot: 'h-2 w-2',
    text: 'text-xs',
    container: 'gap-1.5 px-2 py-0.5',
  },
  md: {
    dot: 'h-2.5 w-2.5',
    text: 'text-sm',
    container: 'gap-2 px-2.5 py-1',
  },
  lg: {
    dot: 'h-3 w-3',
    text: 'text-base',
    container: 'gap-2 px-3 py-1.5',
  },
}

// Status-specific color mappings using CSS variables from operations context
const roomStatusStyles: Record<RoomStatus, string> = {
  available: 'bg-[var(--status-available)] ring-[var(--status-available)]',
  occupied: 'bg-[var(--status-occupied)] ring-[var(--status-occupied)]',
  cleaning: 'bg-[var(--status-cleaning)] ring-[var(--status-cleaning)]',
  maintenance: 'bg-[var(--status-maintenance)] ring-[var(--status-maintenance)]',
}

const stockStatusStyles: Record<StockStatus, string> = {
  low: 'bg-[var(--stock-low)] ring-[var(--stock-low)]',
  ok: 'bg-[var(--stock-ok)] ring-[var(--stock-ok)]',
  high: 'bg-[var(--stock-high)] ring-[var(--stock-high)]',
}

const orderStatusStyles: Record<OrderStatus, string> = {
  pending: 'bg-warning ring-warning',
  processing: 'bg-info ring-info',
  completed: 'bg-success ring-success',
  cancelled: 'bg-danger ring-danger',
}

const generalStatusStyles: Record<GeneralStatus, string> = {
  success: 'bg-success ring-success',
  warning: 'bg-warning ring-warning',
  error: 'bg-danger ring-danger',
  info: 'bg-info ring-info',
  neutral: 'bg-muted ring-muted',
}

const roomStatusLabels: Record<RoomStatus, string> = {
  available: 'Available',
  occupied: 'Occupied',
  cleaning: 'Cleaning',
  maintenance: 'Maintenance',
}

const stockStatusLabels: Record<StockStatus, string> = {
  low: 'Low Stock',
  ok: 'In Stock',
  high: 'Overstocked',
}

const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const generalStatusLabels: Record<GeneralStatus, string> = {
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
  info: 'Info',
  neutral: 'Neutral',
}

function getStatusStyle(
  status: string,
  variant: StatusIndicatorProps['variant']
): string {
  if (variant === 'room' && status in roomStatusStyles) {
    return roomStatusStyles[status as RoomStatus]
  }
  if (variant === 'stock' && status in stockStatusStyles) {
    return stockStatusStyles[status as StockStatus]
  }
  if (variant === 'order' && status in orderStatusStyles) {
    return orderStatusStyles[status as OrderStatus]
  }
  if (variant === 'general' && status in generalStatusStyles) {
    return generalStatusStyles[status as GeneralStatus]
  }
  // Default fallback
  return 'bg-muted ring-muted'
}

function getStatusLabel(
  status: string,
  variant: StatusIndicatorProps['variant'],
  customLabel?: string
): string {
  if (customLabel) return customLabel

  if (variant === 'room' && status in roomStatusLabels) {
    return roomStatusLabels[status as RoomStatus]
  }
  if (variant === 'stock' && status in stockStatusLabels) {
    return stockStatusLabels[status as StockStatus]
  }
  if (variant === 'order' && status in orderStatusLabels) {
    return orderStatusLabels[status as OrderStatus]
  }
  if (variant === 'general' && status in generalStatusLabels) {
    return generalStatusLabels[status as GeneralStatus]
  }

  // Fallback: capitalize status string
  return status.charAt(0).toUpperCase() + status.slice(1)
}

/**
 * StatusIndicator - Visual status badge with color-coded dot
 *
 * Displays status with a colored dot and optional label. Supports multiple
 * status variants (room, stock, order, general) with semantic colors from
 * the design token system.
 *
 * Features:
 * - Context-aware colors (uses CSS variables from operations context)
 * - Multiple variants for different use cases
 * - Dot-only mode for compact displays
 * - Custom label override
 * - Accessible (uses ring for focus states)
 *
 * @example
 * ```tsx
 * // Room status
 * <StatusIndicator status="available" variant="room" />
 * <StatusIndicator status="occupied" variant="room" size="lg" />
 *
 * // Stock levels
 * <StatusIndicator status="low" variant="stock" />
 *
 * // Order status
 * <StatusIndicator status="pending" variant="order" />
 *
 * // Dot only
 * <StatusIndicator status="available" variant="room" dotOnly />
 * ```
 */
export function StatusIndicator({
  status,
  variant = 'general',
  size = 'md',
  dotOnly = false,
  label,
  className,
}: StatusIndicatorProps) {
  const statusStyle = getStatusStyle(status, variant)
  const statusLabel = getStatusLabel(status, variant, label)
  const sizes = sizeStyles[size]

  if (dotOnly) {
    return (
      <span
        className={cn('inline-block rounded-full ring-2 ring-offset-2', statusStyle, sizes.dot, className)}
        aria-label={statusLabel}
        title={statusLabel}
      />
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        'bg-surface-2',
        sizes.container,
        sizes.text,
        className
      )}
    >
      <span className={cn('inline-block rounded-full', statusStyle, sizes.dot)} />
      <span className="text-foreground">{statusLabel}</span>
    </span>
  )
}

export default StatusIndicator
