/**
 * SocialHighlightsCard.tsx
 *
 * Displays upcoming activities or a guidebook CTA on the home screen.
 * Shows the next activity if available, otherwise shows a link to the guidebook.
 *
 * CTA microcopy adapts based on guest intent:
 * - 'social': Enthusiastic CTAs ("Join Chat", "See All")
 * - 'quiet': Softer CTAs ("See what's happening", "Browse")
 * - 'mixed': Default CTAs
 */

import { type FC, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Calendar, Eye, Map, MessageCircle, Users } from 'lucide-react';

import { useChat } from '../../contexts/messaging/ChatProvider';
import type { GuestIntent } from '../../types/guestProfile';

interface SocialHighlightsCardProps {
  /** Optional class name for styling */
  className?: string;
  /** Guest intent for microcopy adaptation */
  intent?: GuestIntent;
}

const SocialHighlightsCard: FC<SocialHighlightsCardProps> = memo(
  function SocialHighlightsCard({ className = '', intent = 'mixed' }) {
    const { t } = useTranslation('Homepage');
    const { activities } = useChat();

    // Intent-based CTA keys
    const ctaKeys = useMemo(() => {
      if (intent === 'quiet') {
        return {
          joinChat: 'social.seeWhatsHappening',
          seeAll: 'social.browse',
        };
      }
      // 'social' and 'mixed' use default enthusiastic CTAs
      return {
        joinChat: 'social.joinChat',
        seeAll: 'social.seeAll',
      };
    }, [intent]);

    // Use softer icon for quiet intent
    const ActionIcon = intent === 'quiet' ? Eye : MessageCircle;

    // Find upcoming activities
    const upcomingActivities = useMemo(() => {
      return Object.values(activities || {})
        .filter((activity) => activity.startTime > Date.now())
        .sort((a, b) => a.startTime - b.startTime)
        .slice(0, 2);
    }, [activities]);

    const hasActivities = upcomingActivities.length > 0;
    const nextActivity = upcomingActivities[0];

    // Format activity time
    const formattedTime = useMemo(() => {
      if (!nextActivity) return '';
      return new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(nextActivity.startTime));
    }, [nextActivity]);

    return (
      <div className={`rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm ${className}`}>
        {hasActivities ? (
          <>
            {/* Header */}
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                {t('social.upcomingActivity')}
              </span>
            </div>

            {/* Next activity */}
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {nextActivity.title}
              </h3>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{formattedTime}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Link
                href={`/chat/channel?id=${nextActivity.id}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
              >
                <ActionIcon className="h-4 w-4" />
                {t(ctaKeys.joinChat)}
              </Link>
              <Link
                href="/activities"
                className="flex items-center justify-center rounded-lg bg-white/60 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-white/80"
              >
                {t(ctaKeys.seeAll)}
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* No activities - show guidebook CTA */}
            <div className="mb-3 flex items-center gap-2">
              <Map className="h-5 w-5 text-emerald-600" />
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                {t('social.explorePositano')}
              </span>
            </div>

            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {t('social.discoverTitle')}
            </h3>
            <p className="mb-3 text-sm text-gray-600">
              {t('social.discoverDescription')}
            </p>

            <Link
              href="/positano-guide"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
            >
              <Map className="h-4 w-4" />
              {t('social.exploreGuide')}
            </Link>
          </>
        )}
      </div>
    );
  },
);

export default SocialHighlightsCard;
