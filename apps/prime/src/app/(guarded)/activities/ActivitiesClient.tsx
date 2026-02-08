'use client';

/**
 * Activities Page Client Component
 *
 * Lists all upcoming and live activities.
 * Guests can see activity details and join the chat for any activity.
 */

import { Calendar, Clock, MapPin, MessageCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChat } from '@/contexts/messaging/ChatProvider';
import { MSG_ROOT } from '@/utils/messaging/dbRoot';
import useUuid from '@/hooks/useUuid';
import { readGuestSession } from '@/lib/auth/guestSessionGuard';
import { evaluateSdkAccess, isSdkFlowFeatureEnabled } from '@/lib/security/dataAccessModel';
import { useFirebaseDatabase } from '@/services/useFirebase';
import type { ActivityInstance } from '@/types/messenger/activity';
import { off, onValue, ref, set } from '@/services/firebase';

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

function formatFinishTime(startTime: number): string {
  const finish = new Date(startTime + 2 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(finish);
}

type ActivityLifecycle = 'upcoming' | 'live' | 'ended';

function resolveLifecycle(activity: ActivityInstance, now: number): ActivityLifecycle {
  const start = activity.startTime;
  const end = start + 2 * 60 * 60 * 1000;
  if (now >= end || activity.status === 'archived') {
    return 'ended';
  }
  if (now >= start || activity.status === 'live') {
    return 'live';
  }
  return 'upcoming';
}

interface ActivityCardProps {
  activity: ActivityInstance;
  lifecycle: ActivityLifecycle;
  presenceCount: number;
  isPresent: boolean;
  onMarkPresent: (activityId: string) => Promise<void>;
}

function ActivityCard({
  activity,
  lifecycle,
  presenceCount,
  isPresent,
  onMarkPresent,
}: ActivityCardProps) {
  const { t } = useTranslation('Activities');
  const isLive = lifecycle === 'live';
  const isEnded = lifecycle === 'ended';

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
      <div className="mb-3 flex items-center justify-between">
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            isLive
              ? 'bg-green-100 text-green-700'
              : isEnded
                ? 'bg-slate-200 text-slate-700'
                : 'bg-blue-100 text-blue-700'
          }`}
        >
          {!isEnded && (
            <span className={`h-2 w-2 rounded-full ${isLive ? 'animate-pulse bg-green-500' : 'bg-blue-500'}`} />
          )}
          {isLive
            ? t('status.live', 'Live now')
            : isEnded
              ? t('status.ended', 'Ended')
              : t('status.upcoming', 'Upcoming')}
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
          <Users className="h-3.5 w-3.5" />
          {presenceCount}
        </span>
      </div>

      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        {activity.title}
      </h3>

      <div className="mb-3 space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{formatActivityTime(activity.startTime)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4 text-gray-400" />
          <span>
            {new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(activity.startTime))}
            {' - '}
            {formatFinishTime(activity.startTime)}
          </span>
        </div>
        {!isLive && (
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <Clock className="h-4 w-4" />
            <span>{isEnded ? 'Event finished' : formatRelativeTime(activity.startTime)}</span>
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

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => void onMarkPresent(activity.id)}
          disabled={!isLive || isPresent}
          className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPresent ? 'You are marked present' : isLive ? "I'm here" : 'Available once live'}
        </button>

        <Link
          href={`/chat/channel?id=${activity.id}`}
          className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${
            isEnded
              ? 'bg-slate-400 pointer-events-none'
              : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
          aria-disabled={isEnded}
        >
          <MessageCircle className="h-4 w-4" />
          {isLive
            ? t('actions.joinNow', 'Join now')
            : isEnded
              ? t('actions.eventEnded', 'Event ended')
              : t('actions.seeDetails', 'See details')}
        </Link>
      </div>
    </div>
  );
}

export default function ActivitiesClient() {
  const { t } = useTranslation('Activities');
  const { activities, hasMoreActivities, loadMoreActivities } = useChat();
  const db = useFirebaseDatabase();
  const uuid = useUuid();
  const [isMarkingPresent, setIsMarkingPresent] = useState<string | null>(null);
  const [presenceMap, setPresenceMap] = useState<Record<string, Record<string, { at: number }>>>({});
  const session = readGuestSession();

  const sdkDecision = evaluateSdkAccess('activities_presence', {
    hasGuestToken: Boolean(session.token),
    isGuestAuthReady: Boolean(uuid),
    flowFlagEnabled:
      process.env.NODE_ENV !== 'production' || isSdkFlowFeatureEnabled('activities_presence'),
  });

  // Work around for strong fail-closed UX when SDK preconditions are not met.
  if (!sdkDecision.allowed) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-md rounded-xl bg-white p-6 text-center shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-gray-900">
            {t('title', 'Activities')}
          </h1>
          <p className="text-sm text-gray-600">
            Activities are temporarily unavailable until your secure session is ready.
          </p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  useEffect(() => {
    const presenceRef = ref(db, `${MSG_ROOT}/activities/presence`);
    const unsubscribe = onValue(
      presenceRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setPresenceMap({});
          return;
        }
        setPresenceMap(snapshot.val() as Record<string, Record<string, { at: number }>>);
      },
      () => {
        setPresenceMap({});
      },
    );

    return () => {
      off(presenceRef);
      unsubscribe();
    };
  }, [db]);

  // Sort and categorize activities
  const { liveActivities, upcomingActivities, endedActivities } = useMemo(() => {
    const all = Object.values(activities || {});
    const now = Date.now();

    const live = all
      .filter((a) => resolveLifecycle(a, now) === 'live')
      .sort((a, b) => a.startTime - b.startTime);

    const upcoming = all
      .filter((a) => resolveLifecycle(a, now) === 'upcoming')
      .sort((a, b) => a.startTime - b.startTime);

    const ended = all
      .filter((a) => resolveLifecycle(a, now) === 'ended')
      .sort((a, b) => b.startTime - a.startTime);

    return { liveActivities: live, upcomingActivities: upcoming, endedActivities: ended };
  }, [activities]);

  const hasActivities =
    liveActivities.length > 0 || upcomingActivities.length > 0 || endedActivities.length > 0;

  async function markPresent(activityId: string): Promise<void> {
    if (!uuid) {
      return;
    }
    setIsMarkingPresent(activityId);
    try {
      const { db, ref: dbRef } = await import('@/services/firebase');
      await set(dbRef(db, `${MSG_ROOT}/activities/presence/${activityId}/${uuid}`), {
        at: Date.now(),
      });
    } finally {
      setIsMarkingPresent(null);
    }
  }

  function getPresenceCount(activityId: string): number {
    return Object.keys(presenceMap?.[activityId] ?? {}).length;
  }

  function isPresent(activityId: string): boolean {
    return Boolean(uuid && presenceMap?.[activityId]?.[uuid]);
  }

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
                      lifecycle="live"
                      presenceCount={getPresenceCount(activity.id)}
                      isPresent={isPresent(activity.id)}
                      onMarkPresent={markPresent}
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
                      lifecycle="upcoming"
                      presenceCount={getPresenceCount(activity.id)}
                      isPresent={isPresent(activity.id)}
                      onMarkPresent={markPresent}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Ended activities */}
            {endedActivities.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-medium text-gray-500">
                  {t('sections.ended', 'Ended')}
                </h2>
                <div className="space-y-3">
                  {endedActivities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      lifecycle="ended"
                      presenceCount={getPresenceCount(activity.id)}
                      isPresent={isPresent(activity.id)}
                      onMarkPresent={markPresent}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Load more button */}
            {hasMoreActivities && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={loadMoreActivities}
                  disabled={isMarkingPresent !== null}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                >
                  {t('actions.loadMore', 'Load more activities')}
                </button>
              </div>
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
              href="/positano-guide"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
            >
              {t('empty.exploreGuide', 'Explore Positano Guide')}
            </Link>
          </div>
        )}

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {t('actions.backHome', '← Back to home')}
          </Link>
        </div>
      </div>
    </main>
  );
}
