'use client'

import { type LucideIcon } from 'lucide-react'

import { cn } from '../../../../utils/style/cn'

export interface QuickAction {
  /** Unique identifier for the action */
  id: string
  /** Display label */
  label: string
  /** Icon component from lucide-react */
  icon: LucideIcon
  /** Click handler */
  onClick: () => void
  /** Disabled state */
  disabled?: boolean
  /** Badge count (e.g., pending items) */
  badge?: number
  /** Visual variant */
  variant?: 'default' | 'primary' | 'danger'
}

export interface QuickActionBarProps {
  /** Array of actions to display */
  actions: QuickAction[]
  /** Display size */
  size?: 'sm' | 'md' | 'lg'
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical'
  /** Additional CSS classes */
  className?: string
}

const sizeStyles = {
  sm: {
    button: 'p-2 gap-1.5',
    icon: 'h-4 w-4',
    text: 'text-xs',
    badge: 'text-[10px] min-w-[16px] h-4 px-1',
  },
  md: {
    button: 'p-3 gap-2',
    icon: 'h-5 w-5',
    text: 'text-sm',
    badge: 'text-xs min-w-[20px] h-5 px-1.5',
  },
  lg: {
    button: 'p-4 gap-3',
    icon: 'h-6 w-6',
    text: 'text-base',
    badge: 'text-sm min-w-[24px] h-6 px-2',
  },
}

const variantStyles = {
  default: {
    base: 'bg-white dark:bg-darkSurface text-gray-700 dark:text-darkAccentGreen border-gray-300 dark:border-darkSurface',
    hover: 'hover:bg-gray-50 dark:hover:bg-gray-800',
    active: 'active:bg-gray-100 dark:active:bg-gray-700',
  },
  primary: {
    base: 'bg-blue-600 text-white border-blue-600',
    hover: 'hover:bg-blue-700',
    active: 'active:bg-blue-800',
  },
  danger: {
    base: 'bg-red-600 text-white border-red-600',
    hover: 'hover:bg-red-700',
    active: 'active:bg-red-800',
  },
}

/**
 * QuickActionBar - Toolbar for frequently used operations
 *
 * Displays a set of action buttons with icons and labels, commonly used
 * in operations interfaces for quick access to key functions.
 *
 * Features:
 * - Context-aware sizing (operations = compact, consumer = comfortable)
 * - Horizontal or vertical layout
 * - Badge counts for pending items
 * - Touch-friendly (large size for POS/mobile)
 * - Keyboard accessible
 * - Visual variants (default, primary, danger)
 *
 * @example
 * ```tsx
 * <QuickActionBar
 *   actions={[
 *     { id: 'new', label: 'New Booking', icon: Plus, onClick: handleNew },
 *     { id: 'checkin', label: 'Check In', icon: UserPlus, onClick: handleCheckIn, badge: 3 },
 *     { id: 'reports', label: 'Reports', icon: FileText, onClick: showReports },
 *   ]}
 *   size="lg" // For touch interfaces
 * />
 * ```
 */
export function QuickActionBar({
  actions,
  size = 'md',
  orientation = 'horizontal',
  className,
}: QuickActionBarProps) {
  const sizes = sizeStyles[size]

  return (
    <div
      className={cn(
        'flex gap-2',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        className
      )}
      role="toolbar"
      aria-label="Quick actions"
    >
      {actions.map((action) => {
        const variant = variantStyles[action.variant || 'default']
        const Icon = action.icon

        return (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className={cn(
              'relative flex items-center justify-center',
              'rounded-lg border font-medium',
              'transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              sizes.button,
              sizes.text,
              variant.base,
              variant.hover,
              variant.active,
              action.disabled && 'opacity-50 cursor-not-allowed',
              orientation === 'horizontal' ? 'flex-col min-w-[4rem]' : 'flex-row justify-start'
            )}
            aria-label={action.label}
            title={action.label}
          >
            <div className="relative">
              <Icon className={cn(sizes.icon)} />
              {action.badge !== undefined && action.badge > 0 && (
                <span
                  className={cn(
                    'absolute -top-1 -right-1',
                    'flex items-center justify-center',
                    'rounded-full',
                    'bg-red-500 text-white font-bold',
                    sizes.badge
                  )}
                >
                  {action.badge > 99 ? '99+' : action.badge}
                </span>
              )}
            </div>
            <span className={cn('whitespace-nowrap', sizes.text)}>
              {action.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default QuickActionBar
