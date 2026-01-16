'use client'

import { type ReactNode } from "react"
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react"
import { Cluster, Inline, Stack } from "../../../atoms/primitives"
import { cn } from "../../../../utils/style/cn"

export interface MetricsCardProps {
  /** Label describing the metric */
  label: string
  /** The main value to display (can be text, number, or custom component) */
  value: ReactNode
  /** Optional trend indicator showing percentage change */
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  /** Visual status variant */
  variant?: 'default' | 'success' | 'warning' | 'danger'
  /** Optional icon to display */
  icon?: LucideIcon
  /** Additional description or subtitle */
  description?: string
  /** Click handler for interactive cards */
  onClick?: () => void
  /** Additional CSS classes */
  className?: string
}

const variantStyles = {
  default: "bg-surface-1 border-border-2",
  success: "bg-success-soft border-success/30",
  warning: "bg-warning-soft border-warning/30",
  danger: "bg-danger-soft border-danger/30",
}

const iconColorStyles = {
  default: "text-muted",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
}

/**
 * MetricsCard - Displays a key performance indicator with optional trend and status
 *
 * Used in operations dashboards to show important metrics like revenue, occupancy,
 * stock levels, or transaction counts.
 *
 * Features:
 * - Context-aware spacing (operations = compact, consumer = comfortable)
 * - Dark mode support
 * - Optional trend indicator with up/down arrows
 * - Status variants for visual emphasis
 * - Optional icon
 * - Interactive (clickable) or static
 *
 * @example
 * ```tsx
 * <MetricsCard
 *   label="Total Revenue"
 *   value="€1,234.56"
 *   trend={{ value: 12.5, direction: 'up' }}
 *   variant="success"
 *   icon={DollarSign}
 * />
 * ```
 */
export function MetricsCard({
  label,
  value,
  trend,
  variant = 'default',
  icon: Icon,
  description,
  onClick,
  className,
}: MetricsCardProps) {
  const isInteractive = Boolean(onClick)
  const Wrapper = isInteractive ? "button" : "div"

  return (
    <Wrapper
      type={isInteractive ? "button" : undefined}
      className={cn(
        "rounded-lg border p-6 text-start transition-all duration-200",
        variantStyles[variant],
        isInteractive &&
          "cursor-pointer hover:-translate-y-0.5 hover:shadow-elevation-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      onClick={onClick}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
    >
      <Cluster alignY="start" justify="between" className="gap-4">
        <Stack gap={2} className="min-w-0 flex-1">
          {/* Label */}
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            {label}
          </span>

          {/* Value */}
          <div className="text-2xl font-bold text-fg">
            {value}
          </div>

          {/* Description */}
          {description && (
            <div className="text-xs text-muted">
              {description}
            </div>
          )}

          {/* Trend */}
          {trend && (
            <Inline
              gap={1}
              alignY="center"
              className={cn(
                "text-sm font-medium",
                trend.direction === "up" ? "text-success" : "text-danger"
              )}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>
                {trend.value > 0 ? "+" : ""}
                {trend.value}%
              </span>
            </Inline>
          )}
        </Stack>

        {/* Icon */}
        {Icon && (
          <div
            className={cn(
              "flex-shrink-0 rounded-lg bg-surface-2/60 p-2",
              iconColorStyles[variant]
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        )}
      </Cluster>
    </Wrapper>
  )
}

export default MetricsCard
