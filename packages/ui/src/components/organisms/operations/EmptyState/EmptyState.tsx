import React, { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

export interface EmptyStateAction {
  /**
   * Action label
   */
  label: string;

  /**
   * Callback when action is clicked
   */
  onClick: () => void;

  /**
   * Button variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary';

  /**
   * Optional icon to display before label
   */
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  /**
   * Icon to display above the title
   */
  icon?: LucideIcon;

  /**
   * Main heading text
   */
  title: string;

  /**
   * Description text explaining the empty state
   */
  description: string;

  /**
   * Optional list of action buttons
   */
  actions?: EmptyStateAction[];

  /**
   * Optional custom content to display below description
   */
  children?: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Size variant
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
}

/**
 * EmptyState - Placeholder component for empty states with action CTAs
 *
 * Features:
 * - Optional icon at the top
 * - Title and description text
 * - Call-to-action buttons
 * - Custom content support
 * - Three size variants
 * - Dark mode support
 * - Context-aware spacing
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Package}
 *   title="No inventory items"
 *   description="Get started by adding your first item to the inventory."
 *   actions={[
 *     {
 *       label: 'Add Item',
 *       onClick: () => navigate('/inventory/new'),
 *       variant: 'primary',
 *       icon: Plus,
 *     },
 *     {
 *       label: 'Import Items',
 *       onClick: () => setShowImportModal(true),
 *       variant: 'secondary',
 *     },
 *   ]}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actions = [],
  children,
  className = '',
  size = 'default',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'h-10 w-10',
      title: 'text-base',
      description: 'text-sm',
      gap: 'gap-3',
    },
    default: {
      container: 'py-12',
      icon: 'h-16 w-16',
      title: 'text-lg',
      description: 'text-base',
      gap: 'gap-4',
    },
    lg: {
      container: 'py-16',
      icon: 'h-20 w-20',
      title: 'text-xl',
      description: 'text-lg',
      gap: 'gap-6',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        ${sizes.container}
        ${className}
      `}
    >
      {/* Icon */}
      {Icon && (
        <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-darkBg">
          <Icon
            className={`${sizes.icon} text-gray-400 dark:text-gray-500`}
            strokeWidth={1.5}
          />
        </div>
      )}

      {/* Content */}
      <div className={`flex max-w-md flex-col ${sizes.gap}`}>
        <h3
          className={`${sizes.title} font-semibold text-gray-900 dark:text-darkAccentGreen`}
        >
          {title}
        </h3>

        <p className={`${sizes.description} text-gray-600 dark:text-gray-400`}>
          {description}
        </p>

        {/* Custom content */}
        {children && <div className="mt-2">{children}</div>}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {actions.map((action, index) => {
              const ActionIcon = action.icon;
              const isPrimary = action.variant === 'primary' || action.variant === undefined;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={action.onClick}
                  className={`
                    inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm
                    transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${
                      isPrimary
                        ? 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-green-600'
                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500 dark:border-darkSurface dark:bg-darkSurface dark:text-darkAccentGreen dark:hover:bg-darkBg'
                    }
                  `}
                >
                  {ActionIcon && <ActionIcon className="h-4 w-4" />}
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmptyState;
