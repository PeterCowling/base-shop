'use client';

/**
 * Activities Page
 *
 * Lists all upcoming and live activities.
 * Guests can see activity details and join the chat for any activity.
 */

import { Calendar, Clock, MapPin, MessageCircle, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@/lib/router';
import { useChat } from '@/contexts/messaging/ChatProvider';
import type { ActivityInstance } from '@/types/messenger/activity';

function formatActivityTime(startTime: number): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(startTime));
}

function formatRelativeTime(startTime: number): string {
  const now = Date.now();
  const diff = startTime - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `in ${days} day${days > 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `in ${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `in ${minutes}m`;
  }
  return 'starting now';
}

interface ActivityCardProps {
  activity: ActivityInstance;
  isLive: boolean;
}

function ActivityCard({ activity, isLive }: ActivityCardProps) {
  const { t } = useTranslation('Activities');

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
      {/* Status badge */}
      {isLive && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          {t('status.live', 'Live now')}
        </div>
      )}

      {/* Activity title */}
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        {activity.title}
      </h3>

      {/* Activity details */}
      <div className="mb-3 space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{formatActivityTime(activity.startTime)}</span>
        </div>
        {!isLive && (
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <Clock className="h-4 w-4" />
            <span>{formatRelativeTime(activity.startTime)}</span>
          </div>
        )}
        {activity.meetUpPoint && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{activity.meetUpPoint}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {activity.description && (
        <p className="mb-4 text-sm text-gray-600 line-clamp-2">
          {activity.description}
        </p>
      )}

      {/* Action button */}
      <Link
        to={{ pathname: '/chat/channel', search: `?id=${activity.id}` }}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
      >
        <MessageCircle className="h-4 w-4" />
        {isLive
          ? t('actions.joinNow', 'Join now')
          : t('actions.seeDetails', 'See details')}
      </Link>
    </div>
  );
}

export default function ActivitiesPage() {
  const { t } = useTranslation('Activities');
  const { activities } = useChat();

  // Sort and categorize activities
  const { liveActivities, upcomingActivities } = useMemo(() => {
    const all = Object.values(activities || {});
    const now = Date.now();

    const live = all
      .filter((a) => a.status === 'live')
      .sort((a, b) => a.startTime - b.startTime);

    const upcoming = all
      .filter((a) => a.status === 'upcoming' && a.startTime > now)
      .sort((a, b) => a.startTime - b.startTime);

    return { liveActivities: live, upcomingActivities: upcoming };
  }, [activities]);

  const hasActivities = liveActivities.length > 0 || upcomingActivities.length > 0;

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-4 pb-6 pt-8">
        <div className="mx-auto max-w-md">
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-6 w-6 text-white/80" />
            <h1 className="text-2xl font-bold text-white">
              {t('title', 'Activities')}
            </h1>
          </div>
          <p className="text-sm text-emerald-100">
            {t('subtitle', 'Join fellow travelers for adventures and social events')}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 -mt-4">
        {hasActivities ? (
          <div className="space-y-6">
            {/* Live activities */}
            {liveActivities.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-500">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  {t('sections.happeningNow', 'Happening Now')}
                </h2>
                <div className="space-y-3">
                  {liveActivities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      isLive={true}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming activities */}
            {upcomingActivities.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-medium text-gray-500">
                  {t('sections.upcoming', 'Coming Up')}
                </h2>
                <div className="space-y-3">
                  {upcomingActivities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      isLive={false}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="rounded-xl bg-white p-6 text-center shadow-sm">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              {t('empty.title', 'No activities yet')}
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              {t('empty.description', 'Check back later for upcoming events, or explore Positano on your own!')}
            </p>
            <Link
              to="/positano-guide"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
            >
              {t('empty.exploreGuide', 'Explore Positano Guide')}
            </Link>
          </div>
        )}

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {t('actions.backHome', '← Back to home')}
          </Link>
        </div>
      </div>
    </main>
  );
}
