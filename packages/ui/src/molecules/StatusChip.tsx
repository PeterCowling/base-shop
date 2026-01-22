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
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    primary: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    secondary: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
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
