/* i18n-exempt file -- OPS-001 [ttl=2026-12-31] class names and internal variants are not user-facing */
'use client'

import React from 'react'

import { cn } from '@acme/design-system/utils/style/cn'

export interface StatusChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Status variant determines color scheme */
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' | 'secondary'
  /** Display size */
  size?: 'sm' | 'md'
  /** Optional icon element to display before label */
  icon?: React.ReactNode
  /** Display as inline or block */
  display?: 'inline' | 'block'
}

/**
 * StatusChip - Colored badge for operational states
 *
 * Extends the base Badge component with semantic color variants
 * commonly used in operations interfaces (success, warning, error, etc.)
 *
 * Features:
 * - Semantic color variants
 * - Optional icon support
 * - Size variants
 * - Dark mode support
 *
 * @example
 * ```tsx
 * <StatusChip variant="success">Active</StatusChip>
 * <StatusChip variant="warning" icon={<AlertIcon />}>Pending</StatusChip>
 * <StatusChip variant="error">Failed</StatusChip>
 * ```
 */
export const StatusChip: React.FC<StatusChipProps> = ({
  variant = 'neutral',
  size = 'md',
  icon,
  display = 'inline',
  className,
  children,
  ...rest
}) => {
  const variants: Record<NonNullable<StatusChipProps['variant']>, string> = {
    success: 'bg-success-light text-success-main dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-warning-light text-warning-main dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-error-light text-danger-fg dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-info-light text-info-main dark:bg-blue-900/30 dark:text-blue-400',
    neutral: 'bg-surface-2 text-foreground dark:bg-gray-800 dark:text-gray-300',
    primary: 'bg-secondary-light text-secondary-main dark:bg-purple-900/30 dark:text-purple-400',
    secondary: 'bg-info-light text-info-main dark:bg-teal-900/30 dark:text-teal-400',
  }

  const sizes: Record<NonNullable<StatusChipProps['size']>, string> = {
    sm: 'text-xs px-2 py-0.5 rounded',
    md: 'text-sm px-3 py-1 rounded-md',
  }

  const displayStyles = {
    inline: 'inline-flex',
    block: 'flex w-full',
  }

  return (
    <span
      className={cn(
        'items-center justify-center font-medium whitespace-nowrap',
        variants[variant],
        sizes[size],
        displayStyles[display],
        icon && 'gap-1.5',
        className
      )}
      {...rest}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
}

export default StatusChip
