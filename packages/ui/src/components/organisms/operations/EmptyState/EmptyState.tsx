import React, { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { Inline, Stack } from "../../../atoms/primitives";
import { cn } from "../../../../utils/style/cn";

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
  className = "",
  size = "default",
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: "py-8",
      icon: "h-10 w-10",
      title: "text-base",
      description: "text-sm",
      gap: 3,
    },
    default: {
      container: "py-12",
      icon: "h-16 w-16",
      title: "text-lg",
      description: "text-base",
      gap: 4,
    },
    lg: {
      container: "py-16",
      icon: "h-20 w-20",
      title: "text-xl",
      description: "text-lg",
      gap: 6,
    },
  } as const;

  const sizes = sizeClasses[size];

  return (
    <Stack
      gap={4}
      align="center"
      className={cn("text-center", sizes.container, className)}
    >
      {/* Icon */}
      {Icon && (
        <div className="rounded-full bg-muted p-4">
          <Icon
            className={cn(sizes.icon, "text-muted")}
            strokeWidth={1.5}
          />
        </div>
      )}

      {/* Content */}
      <Stack gap={sizes.gap} align="center" className="w-full">
        <h3
          className={cn(sizes.title, "font-semibold text-fg")}
        >
          {title}
        </h3>

        <p className={cn(sizes.description, "text-muted")}>
          {description}
        </p>

        {/* Custom content */}
        {children && <div className="mt-2">{children}</div>}

        {/* Actions */}
        {actions.length > 0 && (
          <Inline gap={3} className="mt-6 justify-center">
            {actions.map((action) => {
              const ActionIcon = action.icon;
              const isPrimary =
                action.variant === "primary" || action.variant === undefined;

              return (
                <button
                  key={`${action.label}-${action.variant ?? "primary"}`}
                  type="button"
                  onClick={action.onClick}
                  className={cn(
                    "inline-flex min-h-11 min-w-11 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isPrimary
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border-2 bg-surface-1 text-fg hover:bg-muted/40"
                  )}
                >
                  {ActionIcon && <ActionIcon className="h-4 w-4" />}
                  {action.label}
                </button>
              );
            })}
          </Inline>
        )}
      </Stack>
    </Stack>
  );
}

export default EmptyState;
