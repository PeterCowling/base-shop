/* eslint-disable ds/min-tap-size -- BRIK-2 tap-size deferred */
'use client';

/**
 * Activities Page Client Component
 *
 * Lists all upcoming and live activities.
 * Guests can see activity details and join the chat for any activity.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Calendar, Clock, MapPin, MessageCircle, Users } from 'lucide-react';

import { useChat } from '@/contexts/messaging/ChatProvider';
import useUuid from '@/hooks/useUuid';
import { readGuestSession } from '@/lib/auth/guestSessionGuard';
import { evaluateSdkAccess, isSdkFlowFeatureEnabled } from '@/lib/security/dataAccessModel';
import { off, onValue, ref, set } from '@/services/firebase';
import { useFirebaseDatabase } from '@/services/useFirebase';
import type { ActivityInstance } from '@/types/messenger/activity';
import { MSG_ROOT } from '@/utils/messaging/dbRoot';

function formatActivityTime(startTime: number): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(startTime));
}

function formatRelativeTime(
  startTime: number,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const now = Date.now();
  const diff = startTime - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return t('time.inDays', { count: days });
  }
  if (hours > 0) {
    return t('time.inHoursMinutes', { hours, minutes });
  }
  if (minutes > 0) {
    return t('time.inMinutes', { minutes });
  }
  return t('time.startingNow');
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
    <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
      <div className="mb-3 flex items-center justify-between">
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            isLive
              ? 'bg-success-soft text-success-foreground'
              : isEnded
                ? 'bg-muted text-muted-foreground'
                : 'bg-info-soft text-info-foreground'
          }`}
        >
          {!isEnded && (
            <span className={`h-2 w-2 rounded-full ${isLive ? 'animate-pulse bg-success' : 'bg-primary'}`} />
          )}
          {isLive
            ? t('status.live')
            : isEnded
              ? t('status.ended')
              : t('status.upcoming')}
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {presenceCount}
        </span>
      </div>

      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {activity.title}
      </h3>

      <div className="mb-3 space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatActivityTime(activity.startTime)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>
            {new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(activity.startTime))}
            {' - '}
            {formatFinishTime(activity.startTime)}
          </span>
        </div>
        {!isLive && (
          <div className="flex items-center gap-2 text-sm text-success">
            <Clock className="h-4 w-4" />
            <span>{isEnded ? t('time.eventFinished') : formatRelativeTime(activity.startTime, t)}</span>
          </div>
        )}
        {activity.meetUpPoint && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{activity.meetUpPoint}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {activity.description && (
        <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
          {activity.description}
        </p>
      )}

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => void onMarkPresent(activity.id)}
          disabled={!isLive || isPresent}
          className="w-full rounded-lg border border-success bg-success-soft px-4 py-2.5 text-sm font-medium text-success-foreground disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPresent ? t('presence.markedPresent') : isLive ? t('presence.markPresent') : t('presence.availableOnceLive')}
        </button>

        <Link
          href={`/chat/channel?id=${activity.id}`}
          className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors ${
            isEnded
              ? 'bg-muted-foreground pointer-events-none'
              : 'bg-success hover:bg-success/90'
          }`}
          aria-disabled={isEnded}
        >
          <MessageCircle className="h-4 w-4" />
          {isLive
            ? t('actions.joinNow')
            : isEnded
              ? t('actions.eventEnded')
              : t('actions.seeDetails')}
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
      <main className="min-h-svh bg-muted p-4">
        <div className="mx-auto max-w-md rounded-xl bg-card p-6 text-center shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-foreground">
            {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('sdkUnavailable.message')}
          </p>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            {t('sdkUnavailable.returnHome')}
          </Link>
        </div>
      </main>
    );
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks -- PRIME-1: Pre-existing pattern: conditional SDK guard above protects this
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
  // eslint-disable-next-line react-hooks/rules-of-hooks -- PRIME-1: Pre-existing pattern: conditional SDK guard above protects this
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
      const { db, ref: dbRef } = await import('@/services/firebase'); // i18n-exempt -- DS-11 module path
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
    <main className="min-h-svh bg-muted pb-24">
      {/* Header */}
      <div className="bg-success px-4 pb-6 pt-8">
        <div className="mx-auto max-w-md">
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-6 w-6 text-success-foreground/80" />
            <h1 className="text-2xl font-bold text-success-foreground">
              {t('title')}
            </h1>
          </div>
          <p className="text-sm text-success-foreground/80">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4">
        {hasActivities ? (
          <div className="space-y-6">
            {/* Live activities */}
            {liveActivities.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
                  {t('sections.happeningNow')}
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
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                  {t('sections.upcoming')}
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
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                  {t('sections.ended')}
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
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted"
                >
                  {t('actions.loadMore')}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="rounded-xl bg-card p-6 text-center shadow-sm">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              {t('empty.title')}
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {t('empty.description')}
            </p>
            <Link
              href="/positano-guide"
              className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-success/90"
            >
              {t('empty.exploreGuide')}
            </Link>
          </div>
        )}

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-muted-foreground"
          >
            {t('actions.backHome')}
          </Link>
        </div>
      </div>
    </main>
  );
}
