/**
 * NextActionCard.tsx
 *
 * Prominent card showing the next recommended action for pre-arrival readiness.
 * Displays contextual messaging based on what's not yet completed.
 */

import {
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  Navigation,
  Sparkles,
} from 'lucide-react';
import { FC, memo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChecklistProgress } from '../../types/preArrival';
import { getNextChecklistItem } from '../../lib/preArrival';

interface NextActionCardProps {
  /** Current checklist progress */
  checklist: ChecklistProgress;
  /** Click handler for the action button */
  onAction: (item: keyof ChecklistProgress) => void;
  /** Optional: Cash amounts to display for cash prep action */
  cashAmounts?: {
    cityTax: number;
    deposit: number;
  };
  /** Optional class name */
  className?: string;
}

/**
 * Get action card content based on the next item.
 */
function getActionContent(
  item: keyof ChecklistProgress | null,
  t: (key: string, options?: Record<string, unknown>) => string,
  cashAmounts?: { cityTax: number; deposit: number },
): {
  icon: ReactNode;
  title: string;
  description: string;
  buttonText: string;
  gradient: string;
} {
  if (!item) {
    // All complete
    return {
      icon: <CheckCircle2 className="h-8 w-8" />,
      title: t('nextAction.allComplete.title'),
      description: t('nextAction.allComplete.description'),
      buttonText: t('nextAction.allComplete.button'),
      gradient: 'from-green-500 to-emerald-600',
    };
  }

  switch (item) {
    case 'routePlanned':
      return {
        icon: <Navigation className="h-8 w-8" />,
        title: t('nextAction.routePlanned.title'),
        description: t('nextAction.routePlanned.description'),
        buttonText: t('nextAction.routePlanned.button'),
        gradient: 'from-blue-500 to-indigo-600',
      };
    case 'etaConfirmed':
      return {
        icon: <Clock className="h-8 w-8" />,
        title: t('nextAction.etaConfirmed.title'),
        description: t('nextAction.etaConfirmed.description'),
        buttonText: t('nextAction.etaConfirmed.button'),
        gradient: 'from-purple-500 to-violet-600',
      };
    case 'cashPrepared':
      const totalCash = cashAmounts
        ? cashAmounts.cityTax + cashAmounts.deposit
        : 0;
      return {
        icon: <DollarSign className="h-8 w-8" />,
        title: t('nextAction.cashPrepared.title'),
        description: cashAmounts
          ? t('nextAction.cashPrepared.descriptionWithAmount', { amount: totalCash })
          : t('nextAction.cashPrepared.description'),
        buttonText: t('nextAction.cashPrepared.button'),
        gradient: 'from-amber-500 to-orange-600',
      };
    case 'rulesReviewed':
      return {
        icon: <FileText className="h-8 w-8" />,
        title: t('nextAction.rulesReviewed.title'),
        description: t('nextAction.rulesReviewed.description'),
        buttonText: t('nextAction.rulesReviewed.button'),
        gradient: 'from-teal-500 to-cyan-600',
      };
    case 'locationSaved':
      return {
        icon: <MapPin className="h-8 w-8" />,
        title: t('nextAction.locationSaved.title'),
        description: t('nextAction.locationSaved.description'),
        buttonText: t('nextAction.locationSaved.button'),
        gradient: 'from-rose-500 to-pink-600',
      };
    default:
      return {
        icon: <Sparkles className="h-8 w-8" />,
        title: t('nextAction.default.title'),
        description: t('nextAction.default.description'),
        buttonText: t('nextAction.default.button'),
        gradient: 'from-gray-500 to-slate-600',
      };
  }
}

export const NextActionCard: FC<NextActionCardProps> = memo(function NextActionCard({
  checklist,
  onAction,
  cashAmounts,
  className = '',
}) {
  const { t } = useTranslation('PreArrival');
  const nextItem = getNextChecklistItem(checklist);
  const content = getActionContent(nextItem, t, cashAmounts);
  const isComplete = !nextItem;

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-5
        bg-gradient-to-br ${content.gradient}
        text-white shadow-lg
        ${className}
      `}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5" />

      {/* Content */}
      <div className="relative">
        {/* Icon and title */}
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
            {content.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              {content.title}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="mb-4 text-sm text-white/90">
          {content.description}
        </p>

        {/* Action button */}
        {!isComplete && nextItem && (
          <button
            type="button"
            onClick={() => onAction(nextItem)}
            className="
              flex w-full items-center justify-center gap-2
              rounded-xl bg-white px-4 py-3
              font-medium text-gray-900
              transition-transform duration-200
              hover:scale-[1.02] active:scale-[0.98]
            "
          >
            {content.buttonText}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}

        {/* Complete state - subtle celebration */}
        {isComplete && (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-white/20 py-3">
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">{content.buttonText}</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default NextActionCard;
