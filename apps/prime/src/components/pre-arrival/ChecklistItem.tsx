/**
 * ChecklistItem.tsx
 *
 * Individual checklist item for pre-arrival readiness.
 * Can be interactive (clickable) or informational.
 */

import { type FC, memo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Check,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  Navigation,
} from 'lucide-react';

import type { ChecklistProgress } from '../../types/preArrival';

export type ChecklistItemType = keyof ChecklistProgress;

interface ChecklistItemProps {
  /** Which checklist item this represents */
  type: ChecklistItemType;
  /** Whether the item is completed */
  completed: boolean;
  /** Optional description override */
  description?: string;
  /** Click handler - if provided, item is interactive */
  onClick?: () => void;
  /** Optional class name */
  className?: string;
}

/**
 * Get icon for checklist item type.
 */
function getItemIcon(type: ChecklistItemType, completed: boolean): ReactNode {
  if (completed) {
    return <Check className="h-5 w-5" />;
  }

  switch (type) {
    case 'routePlanned':
      return <Navigation className="h-5 w-5" />;
    case 'etaConfirmed':
      return <Clock className="h-5 w-5" />;
    case 'cashPrepared':
      return <DollarSign className="h-5 w-5" />;
    case 'rulesReviewed':
      return <FileText className="h-5 w-5" />;
    case 'locationSaved':
      return <MapPin className="h-5 w-5" />;
    default:
      return <ChevronRight className="h-5 w-5" />;
  }
}

export const ChecklistItem: FC<ChecklistItemProps> = memo(function ChecklistItem({
  type,
  completed,
  description,
  onClick,
  className = '',
}) {
  const { t } = useTranslation('PreArrival');

  const isInteractive = !!onClick && !completed;
  const icon = getItemIcon(type, completed);

  // Styling based on state
  const containerClasses = completed
    ? 'bg-success-soft border-success-soft'
    : isInteractive
      ? 'bg-card border-border hover:border-primary/30 hover:shadow-sm cursor-pointer'
      : 'bg-muted border-border';

  const iconContainerClasses = completed
    ? 'bg-success-soft text-success-foreground'
    : 'bg-muted text-muted-foreground';

  const titleClasses = completed
    ? 'text-success-foreground'
    : 'text-foreground';

  return (
    <button
      type="button"
      onClick={isInteractive ? onClick : undefined}
      disabled={!isInteractive}
      className={`
        w-full flex items-center gap-3 p-3 rounded-xl border
        transition-all duration-200
        ${containerClasses}
        ${className}
      `}
    >
      {/* Icon */}
      <div
        className={`
          flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full
          transition-colors duration-200
          ${iconContainerClasses}
        `}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 text-start">
        <h4 className={`font-medium ${titleClasses}`}>
          {t(`checklist.${type}.title`)}
        </h4>
        {description && !completed && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {description}
          </p>
        )}
        {completed && (
          <p className="text-sm text-success-foreground mt-0.5">
            {t('checklist.completed')}
          </p>
        )}
      </div>

      {/* Arrow for interactive items */}
      {isInteractive && (
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      )}
    </button>
  );
});

export default ChecklistItem;
