'use client'

import { type ReactNode } from 'react'
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'
import { cn } from '../../../../utils/style/cn'

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
  default: 'bg-white dark:bg-darkSurface border-gray-200 dark:border-darkSurface',
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
}

const iconColorStyles = {
  default: 'text-gray-500 dark:text-gray-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  danger: 'text-red-600 dark:text-red-400',
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

  return (
    <div
      className={cn(
        'rounded-lg border',
        'p-[var(--card-padding)]',
        'transition-all duration-200',
        variantStyles[variant],
        isInteractive && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
        className
      )}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Label */}
          <div className="text-[var(--label-size)] font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {label}
          </div>

          {/* Value */}
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-darkAccentGreen">
            {value}
          </div>

          {/* Description */}
          {description && (
            <div className="mt-1 text-[var(--label-size)] text-gray-500 dark:text-gray-400">
              {description}
            </div>
          )}

          {/* Trend */}
          {trend && (
            <div
              className={cn(
                'mt-2 inline-flex items-center gap-1 text-sm font-medium',
                trend.direction === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>
                {trend.value > 0 ? '+' : ''}
                {trend.value}%
              </span>
            </div>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <div
            className={cn(
              'flex-shrink-0 p-2 rounded-lg bg-white/50 dark:bg-black/20',
              iconColorStyles[variant]
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  )
}

export default MetricsCard
